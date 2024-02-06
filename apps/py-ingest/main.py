import logging
import argparse

# Setting up CLI argument parsing for logging level
parser = argparse.ArgumentParser(description='Ingestion Engine Logging Level')
parser.add_argument('--log', dest='log_level', default='INFO', help='Set the logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)')
args = parser.parse_args()

# Configuring logging based on the CLI argument
numeric_level = getattr(logging, args.log_level.upper(), None)
if not isinstance(numeric_level, int):
    raise ValueError(f'Invalid log level: {args.log_level}')
logging.basicConfig(level=numeric_level, handlers=[logging.StreamHandler()], format='%(asctime)s - %(levelname)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S')

from abc import ABC, abstractmethod
from children import extract_links
from db import AbstractDatabase, PrismaDatabase
import requests
from bs4 import BeautifulSoup
import time
from datetime import datetime, timedelta
import re
from relevance import AbstractRelevanceChecker, SimpleRelevanceChecker, LLMRelevanceChecker
from clean import AbstractDataCleaner, LLMDataCleaner
from schema import Chunk 
from typing import List 

class AbstractDataExtractor(ABC):
    @abstractmethod
    def extract(self, url: str) -> BeautifulSoup:
        pass

    def get_html(self, url: str) -> bytes:
        response = requests.get(url)
        if response.status_code == 200:
            return response.content
        else:
            return None
    
    def parse_html(self, html: bytes) -> BeautifulSoup:
        return BeautifulSoup(html, 'html.parser')

class SimpleDataExtractor(AbstractDataExtractor):
    def extract(self, url: str) -> BeautifulSoup:
        html = self.get_html(url)
        if not html:
            logging.error(f"IngestionEngine: Failed to get html from {url}")
        return self.parse_html(html)

class AbstractQueueManager(ABC):
    @abstractmethod
    def add(self, items, delay=0):
        pass

    @abstractmethod
    def pop(self):
        pass

    @abstractmethod 
    def exists(self, item):
        pass

class SimpleQueueManager(AbstractQueueManager):
    def __init__(self):
        self.queue = []
        self.time_to_visit = {}

    def add(self, items: list, delay=0):
        for item in items:
            if delay > 0:
                self.time_to_visit[item] = datetime.now() + timedelta(seconds=delay)
            if item not in self.queue:
                self.queue.append(item)

    def pop(self):
        if not self.queue:
            return None
        current_time = datetime.now()
        for i, url in enumerate(self.queue):
            if url in self.time_to_visit and self.time_to_visit[url] > current_time:
                continue
            return self.queue.pop(i)
        return None

    def exists(self, item):
        return item in self.queue
    
    def __len__(self):
        return len(self.queue)

from threading import Lock, current_thread
from concurrent.futures import ThreadPoolExecutor

class ThreadedQueueManager(AbstractQueueManager):
    def __init__(self):
        self.queue = []
        self.time_to_visit = {}
        self.lock = Lock()

    def add(self, items: list, delay=0):
        with self.lock:
            for item in items:
                if delay > 0:
                    self.time_to_visit[item] = datetime.now() + timedelta(seconds=delay)
                if item not in self.queue:
                    self.queue.append(item)

    def pop(self):
        with self.lock:
            if not self.queue:
                return None
            current_time = datetime.now()
            for i, url in enumerate(self.queue):
                if url in self.time_to_visit and self.time_to_visit[url] > current_time:
                    continue
                return self.queue.pop(i)
            return None

    def exists(self, item):
        with self.lock:
            return item in self.queue

class IngestionEngine:
    def __init__(self, meta_topics: List[str], extractor: AbstractDataExtractor, cleaner: AbstractDataCleaner, relevance_checker: AbstractRelevanceChecker, db: AbstractDatabase, queue: AbstractQueueManager, num_threads: int = 1):
        self.meta_topics = meta_topics
        self.extractor = extractor
        self.cleaner = cleaner
        self.relevance_checker = relevance_checker
        self.db = db
        self.queue = queue
        self.visited_urls = {}
        self.num_threads = num_threads
        self.lock = Lock()

    def normalize_url(self, url: str) -> str:
        return url.strip("/").strip()

    def process_url(self, current_url: str, depth: int = 0, start_at_depth: int = 0, max_depth=10000):
        with self.lock:
            if current_url in self.visited_urls:
                logging.info(f"IngestionEngine: {current_url} has already been visited, skipping")
                return

            self.visited_urls[current_url] = True

        logging.info(f"IngestionEngine: Processing {current_url} at depth {depth}")

        if depth >= max_depth:
            logging.info(f"IngestionEngine: Reached max depth for {current_url}, skipping further processing")
            return

        try:
            raw_data = self.extractor.extract(current_url)
            logging.debug(f"IngestionEngine: Extracted data from {current_url}")
            pre_cleaned_data = self.cleaner.get_clean_text(raw_data)

            if depth >= start_at_depth:
                logging.debug(f"IngestionEngine: Pre-cleaned data from {current_url}")

                if not self.relevance_checker.is_relevant(current_url, pre_cleaned_data):
                    logging.info(f"IngestionEngine: {current_url} is not relevant, skipping")
                    return

                document = self.cleaner.get_document(current_url, raw_data)
                document.topics = self.meta_topics
                print("Document topics: ", document)
                logging.debug(f"IngestionEngine: Extracted document from {current_url}")

                chunk_contents, chunk_surrounding_contents, chunk_types = self.cleaner.get_chunks(raw_data)
                chunks = self.cleaner.enrich_chunks(chunk_contents, document, chunk_surrounding_contents, chunk_types)
                logging.debug(f"IngestionEngine: Extracted {len(chunks)} chunks from {current_url}")

                self.db.save_documents([document])
                self.db.save_chunks(chunks)
                logging.info(f"IngestionEngine: Saved {len(chunks)} chunks for document {document.id}")
            else:
                logging.info(f"IngestionEngine: Skipping processing for {current_url} at depth {depth}")

            children_urls = extract_links(current_url, raw_data)
            children_urls = [url for url in children_urls if url not in self.visited_urls and not self.queue.exists(url) and self.relevance_checker.is_maybe_relevant(url, pre_cleaned_data)]
            logging.debug(f"IngestionEngine: Putting children: {children_urls}")

            for url in children_urls:
                normalized_url = self.normalize_url(url)
                self.queue.add([(normalized_url, depth + 1)])

        except Exception as e:
            logging.error(f"IngestionEngine: Encountered an error while processing {current_url} due to {e}.", exc_info=True)
            # Optionally, re-queue the URL with a delay for retrying failed operations
            # self.queue.add([(current_url, depth)], delay=60)
    def run(self, seed_urls: List[str], start_at_depth: int = 0, max_depth: int = 10000000):
        normalized_seed_urls = [(self.normalize_url(url), 0) for url in seed_urls]
        self.queue.add(normalized_seed_urls)
        with ThreadPoolExecutor(max_workers=self.num_threads) as executor:
            futures = []
            while not all(future.done() for future in futures) or not len(self.queue) == 0:
                queue_item = self.queue.pop()
                if queue_item:
                    current_url, depth = queue_item
                    future = executor.submit(self.process_url, current_url, depth, start_at_depth, max_depth)
                    futures.append(future)
                else:
                    logging.info("IngestionEngine: Queue is empty, waiting for new URLs")
                    time.sleep(10)
                    continue
            print("Exiting...")


num_threads = 1

def run_for_elections():
    topics = ["Instructions for voters on how to vote in the United States election in 2024", "general educational information they should know about how the electoral process works"]
    relevance_checker = LLMRelevanceChecker([".*\.gov"], topics=topics)
    cleaner = LLMDataCleaner(topics=topics)

    engine = IngestionEngine(["2024 United States Election", "Voting"], SimpleDataExtractor(), cleaner=cleaner, relevance_checker=relevance_checker, db=PrismaDatabase(), queue=SimpleQueueManager(), num_threads=num_threads)
    engine.run(["https://www.usa.gov/midterm-elections"])

def run_for_nikki_haley():
    topics = ["Nikki Haley 2024 Presidential campaign and her political views", "Nikki Haley's tenure and track record as a politicial and concrete actions she has taken"]
    relevance_checker = LLMRelevanceChecker(["https://nikkihaley\.com/.*"], topics=topics)
    cleaner = LLMDataCleaner(topics=topics)

    engine = IngestionEngine(["Nikki Haley 2024 Presidential Campaign", "Candidates"], SimpleDataExtractor(), cleaner=cleaner, relevance_checker=relevance_checker, db=PrismaDatabase(), queue=SimpleQueueManager(), num_threads=num_threads)
    engine.run(["https://nikkihaley.com/about/"])

def run_for_candidate_wikipedia(candidate_name, wikipedia_url):
    topics = [f"{candidate_name} 2024 Presidential campaign and their political views", f"${candidate_name}'s tenure and track record as a politicial and concrete actions they have taken"]
    relevance_checker = LLMRelevanceChecker([
    ".*"
    ], topics=topics)
    cleaner = LLMDataCleaner(topics=topics)

    engine = IngestionEngine([f"{candidate_name} 2024 Presidential Campaign", "Candidates", "Wikipedia"], SimpleDataExtractor(), cleaner=cleaner, relevance_checker=relevance_checker, db=PrismaDatabase(), queue=SimpleQueueManager(), num_threads=num_threads)
    engine.run([wikipedia_url], start_at_depth=0, max_depth=3)

def run_for_state_elections():
    # all 50 states
    for state, state_seed_urls in [
        ("Alabama", ["https://www.sos.alabama.gov/alabama-votes"]),
        ("Alaska", ["https://www.elections.alaska.gov/"]),
        ("Arizona", ["https://azsos.gov/elections"]),
        ("Arkansas", ["https://www.sos.arkansas.gov/elections"]),
        ("California", ["https://www.sos.ca.gov/elections"]),
        ("Colorado", ["https://www.sos.state.co.us/pubs/elections/"]),
        ("Connecticut", ["https://portal.ct.gov/SOTS/Election-Services/Election-Services-Home-Page"]),
        ("Delaware", ["https://elections.delaware.gov/"]),
        ("Florida", ["https://dos.myflorida.com/elections/"]),
        ("Georgia", ["https://georgia.gov/voting"]),
        ("Hawaii", ["https://elections.hawaii.gov/"]),
        ("Idaho", ["https://sos.idaho.gov/elections-division/"]),
        ("Illinois", ["https://www.elections.il.gov/"]),
        ("Indiana", ["https://www.in.gov/sos/elections/"]),
        ("Iowa", ["https://sos.iowa.gov/elections/"]),
        ("Kansas", ["https://sos.kansas.gov/elections/"]),
        ("Kentucky", ["https://elect.ky.gov/Pages/default.aspx"]),
        ("Louisiana", ["https://www.sos.la.gov/ElectionsAndVoting/Pages/default.aspx"]),
        ("Maine", ["https://www.maine.gov/sos/cec/elec/"]),
        ("Maryland", ["https://elections.maryland.gov/"]),
        ("Massachusetts", ["https://www.sec.state.ma.us/ele/eleidx.htm"]),
        ("Michigan", ["https://www.michigan.gov/sos/0,4670,7-127-1633---,00.html"]),
        ("Minnesota", ["https://www.sos.state.mn.us/elections-voting/"]),
        ("Mississippi", ["https://www.sos.ms.gov/Elections-Voting/Pages/default.aspx"]),
        ("Missouri", ["https://www.sos.mo.gov/elections"]),
        ("Montana", ["https://sosmt.gov/elections/"]),
        ("Nebraska", ["https://sos.nebraska.gov/elections"]),
        ("Nevada", ["https://www.nvsos.gov/sos/elections"]),
        ("New Hampshire", ["https://sos.nh.gov/elections/"]),
        ("New Jersey", ["https://www.state.nj.us/state/elections/index.shtml"]),
        ("New Mexico", ["https://www.sos.state.nm.us/voting-and-elections/"]),
        ("New York", ["https://www.elections.ny.gov/"]),
        ("North Carolina", ["https://www.ncsbe.gov/"]),
        ("North Dakota", ["https://vip.sos.nd.gov/"]),
        ("Ohio", ["https://www.ohiosos.gov/elections/"]),
        ("Oklahoma", ["https://www.ok.gov/elections/"]),
        ("Oregon", ["https://sos.oregon.gov/voting-elections/Pages/default.aspx"]),
        ("Pennsylvania", ["https://www.votespa.com/"]),
        ("Rhode Island", ["https://elections.ri.gov/"]),
        ("South Carolina", ["https://www.scvotes.gov/"]),
        ("South Dakota", ["https://sdsos.gov/elections-voting/default.aspx"]),
        ("Tennessee", ["https://sos.tn.gov/elections"]),
        ("Texas", ["https://www.sos.state.tx.us/elections/"]),
        ("Utah", ["https://elections.utah.gov/"]),
        ("Vermont", ["https://sos.vermont.gov/elections/"]),
        ("Virginia", ["https://www.elections.virginia.gov/"]),
        ("Washington", ["https://www.sos.wa.gov/elections/"]),
        ("West Virginia", ["https://sos.wv.gov/elections/Pages/default.aspx"]),
        ("Wisconsin", ["https://elections.wi.gov/"]),
        ("Wyoming", ["https://sos.wyo.gov/Elections/"])
    ]:
        topics = [f"Instructions for voters on how to vote in local, state, primary, or general elections in {state} in 2024", "general educational information that voters should know about how the electoral process works", f"voting in {state}"]
        gov_regex = r".*\.gov.*"
        relevance_checker = LLMRelevanceChecker([gov_regex], topics=topics)
        cleaner = LLMDataCleaner(topics=topics)

        engine = IngestionEngine([state, "State Elections", "2024 United States Election", "Voting"], SimpleDataExtractor(), cleaner=cleaner, relevance_checker=relevance_checker, db=PrismaDatabase(), queue=SimpleQueueManager(), num_threads=num_threads)
        engine.run(state_seed_urls, max_depth=3)

if __name__ == "__main__":
    # we should run for every candidate, on their website+Twitter+Wikipedia+news articles
    # run_for_candidate_wikipedia("Nikki Haley", "https://en.wikipedia.org/wiki/Nikki_Haley")
    run_for_elections()
    # for voting, run on the official government websites 
    # run_for_state_elections()