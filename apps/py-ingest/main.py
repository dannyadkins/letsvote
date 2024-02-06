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

    def process_url(self, current_url: str):
        with self.lock:
            if current_url in self.visited_urls:
                logging.info(f"IngestionEngine: {current_url} has already been visited, skipping")
                return
            
            self.visited_urls[current_url] = True

        logging.info(f"IngestionEngine: Processing {current_url}")

        try: 
            raw_data = self.extractor.extract(current_url)
        except Exception as e:
            logging.error(f"IngestionEngine: Failed to extract data from {current_url} due to {e}. Retrying in 60 seconds.", exc_info=True)
            self.queue.add([current_url], delay=60)
            return
    
        logging.debug(f"IngestionEngine: Extracted data from {current_url}")

        try:
            pre_cleaned_data = self.cleaner.get_clean_text(raw_data)
        except Exception as e:
            logging.error(f"IngestionEngine: Failed to clean data from {current_url} due to {e}. Skipping URL.", exc_info=True)
            return

        logging.debug(f"IngestionEngine: Pre-cleaned data from {current_url}")

        try:
            if not self.relevance_checker.is_relevant(current_url, pre_cleaned_data):
                logging.info(f"IngestionEngine: {current_url} is not relevant, skipping")
                return
        except Exception as e:
            logging.error(f"IngestionEngine: Failed to check relevance for {current_url} due to {e}. Skipping URL.", exc_info=True)
            return

        try:
            document = self.cleaner.get_document(current_url, raw_data)
            document.topics = self.meta_topics
            print("Document topics: ", document)
        except Exception as e:
            logging.error(f"IngestionEngine: Failed to extract document from {current_url} due to {e}. Skipping URL.", exc_info=True)
            return

        logging.debug(f"IngestionEngine: Extracted document from {current_url}")

        try:
            chunk_contents = self.cleaner.get_chunks(raw_data)
            chunks = self.cleaner.enrich_chunks(chunk_contents, document)
        except Exception as e:
            logging.error(f"IngestionEngine: Failed to extract or enrich chunks from {current_url} due to {e}. Skipping URL.", exc_info=True)
            return

        logging.debug(f"IngestionEngine: Extracted {len(chunks)} chunks from {current_url}")

        try:
            self.db.save_documents([document])
            self.db.save_chunks(chunks)
        except Exception as e:
            logging.error(f"IngestionEngine: Failed to save documents or chunks for {current_url} due to {e}.", exc_info=True)
            return

        logging.info(f"IngestionEngine: Saved {len(chunks)} chunks for document {document.id}")

        try:
            children_urls = extract_links(current_url, raw_data)
        except Exception as e:
            logging.error(f"IngestionEngine: Failed to extract links from {current_url} due to {e}. Continuing without adding children URLs.", exc_info=True)
            children_urls = []

        children_urls = [url for url in children_urls if url not in self.visited_urls and not self.queue.exists(url) and self.relevance_checker.is_maybe_relevant(url, pre_cleaned_data)]

        logging.debug(f"IngestionEngine: Putting children: {children_urls}")
        for url in children_urls:
            try:
                normalized_url = self.normalize_url(url)
                self.queue.add([normalized_url])
            except Exception as e:
                logging.error(f"IngestionEngine: Failed to normalize or add URL {url} to the queue due to {e}.", exc_info=True)
    
    def run(self, seed_url: str):
        normalized_seed_url = self.normalize_url(seed_url)
        self.queue.add([normalized_seed_url])
        with ThreadPoolExecutor(max_workers=self.num_threads) as executor:
            while True:
                current_url = self.queue.pop()
                if not current_url:
                    logging.info("IngestionEngine: Queue is empty, waiting for new URLs")
                    time.sleep(10)
                    continue
                executor.submit(self.process_url, current_url)

num_threads = 16

def run_for_elections():
    topics = ["Instructions for voters on how to vote in the United States election in 2024", "general educational information they should know about how the electoral process works"]
    relevance_checker = LLMRelevanceChecker([".*\.gov"], topics=topics)
    cleaner = LLMDataCleaner(topics=topics)

    engine = IngestionEngine(["2024 United States Election", "Voting"], SimpleDataExtractor(), cleaner=cleaner, relevance_checker=relevance_checker, db=PrismaDatabase(), queue=SimpleQueueManager(), num_threads=num_threads)
    engine.run("https://www.usa.gov/midterm-elections")

def run_for_nikki_haley():
    topics = ["Nikki Haley's 2024 Presidential campaign and her political views", "Nikki Haley's tenure and track record as a politicial and concrete actions she has taken"]
    relevance_checker = LLMRelevanceChecker(["https://nikkihaley\.com/.*"], topics=topics)
    cleaner = LLMDataCleaner(topics=topics)

    engine = IngestionEngine(["Nikki Haley 2024 Presidential Campaign", "Candidates"], SimpleDataExtractor(), cleaner=cleaner, relevance_checker=relevance_checker, db=PrismaDatabase(), queue=SimpleQueueManager(), num_threads=num_threads)
    engine.run("https://nikkihaley.com/about/")

def run_for_candidate_wikipedia(candidate_name, wikipedia_url):
    topics = [f"{candidate_name}'s 2024 Presidential campaign and their political views", f"${candidate_name}'s tenure and track record as a politicial and concrete actions they have taken"]
    relevance_checker = LLMRelevanceChecker([
        # some regex rule that nothing can pass 
        "https://en.wikipedia.org/wiki/Nikki_Haley"
    ], topics=topics)
    cleaner = LLMDataCleaner(topics=topics)

    engine = IngestionEngine([f"{candidate_name} 2024 Presidential Campaign", "Candidates", "Wikipedia"], SimpleDataExtractor(), cleaner=cleaner, relevance_checker=relevance_checker, db=PrismaDatabase(), queue=SimpleQueueManager(), num_threads=num_threads)
    engine.run(wikipedia_url)

if __name__ == "__main__":
    # we should run for every candidate, on their website+Twitter+Wikipedia+news articles
    run_for_candidate_wikipedia("Nikki Haley", "https://en.wikipedia.org/wiki/Nikki_Haley")
    # run_for_elections()
    # for voting, run on the official government websites 