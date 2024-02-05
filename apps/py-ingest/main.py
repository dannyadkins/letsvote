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
logging.basicConfig(level=numeric_level)

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
            logging.error(f"Failed to get html from {url}")
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

from threading import Lock
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
                logging.info(f"{current_url} has already been visited, skipping")
                return
            
            self.visited_urls[current_url] = True

        logging.debug(f"Processing {current_url}")
        try: 
            raw_data = self.extractor.extract(current_url)
        except Exception as e:
            logging.warning(f"Failed to extract data from {current_url}: {e}")
            self.queue.add([current_url], delay=60)
            return
    
        logging.debug(f"Extracted data from {current_url}")
        
        pre_cleaned_data = self.cleaner.get_clean_text(raw_data)

        logging.debug(f"Pre-cleaned data from {current_url}")

        if not self.relevance_checker.is_relevant(current_url, pre_cleaned_data):
            logging.info(f"{current_url} is not relevant, skipping")
            return

        document = self.cleaner.get_document(current_url, raw_data, meta_topics=self.meta_topics)
        logging.debug(f"Extracted document from {current_url}")

        chunk_contents = self.cleaner.get_chunks(raw_data)
        chunks = self.cleaner.enrich_chunks(chunk_contents, document)
        
        logging.debug(f"Extracted {len(chunks)} chunks from {current_url}")

        self.db.save_documents([document])
        self.db.save_chunks(chunks)
        logging.info(f"Saved {len(chunks)} chunks for document {document.id}")

        children_urls = extract_links(current_url, raw_data)

        children_urls = [url for url in children_urls if url not in self.visited_urls and not self.queue.exists(url)]

        logging.debug("Putting children: ", children_urls)
        for url in children_urls:
            normalized_url = self.normalize_url(url)
            self.queue.add([normalized_url])

    def run(self, seed_url: str):
        normalized_seed_url = self.normalize_url(seed_url)
        self.queue.add([normalized_seed_url])
        with ThreadPoolExecutor(max_workers=self.num_threads) as executor:
            while True:
                current_url = self.queue.pop()
                if not current_url:
                    logging.info("Queue is empty, waiting for new URLs")
                    time.sleep(10)
                    continue
                executor.submit(self.process_url, current_url)

num_threads = 1

def run_for_elections():
    topics = ["Instructions for voters on how to vote in the United States election in 2024", "general educational information they should know about how the electoral process works"]
    relevance_checker = LLMRelevanceChecker([".*\.gov"], topics=topics)
    cleaner = LLMDataCleaner(topics=topics)

    engine = IngestionEngine(["2024 United States Election", "Voting"], SimpleDataExtractor(), cleaner=cleaner, relevance_checker=relevance_checker, db=PrismaDatabase(), queue=SimpleQueueManager(), num_threads=num_threads)
    engine.run("https://www.usa.gov/midterm-elections")

def run_for_nikki_haley():
    topics = ["Nikki Haley's 2024 Presidential campaign and her political views", "her tenure and track record as a politicial and concrete actions she has taken"]
    relevance_checker = LLMRelevanceChecker([".*"], topics=topics)
    cleaner = LLMDataCleaner(topics=topics)

    engine = IngestionEngine(["Nikki Haley 2024 Presidential Campaign", "Candidates"], SimpleDataExtractor(), cleaner=cleaner, relevance_checker=relevance_checker, db=PrismaDatabase(), queue=SimpleQueueManager(), num_threads=num_threads)
    engine.run("https://nikkihaley.com/about/")

if __name__ == "__main__":
    run_for_elections()

