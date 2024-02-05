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
            raise Exception(f"Failed to get html from {url}")
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

# TODO make priority queue manager, maybe with LLM to assign priority levels to different URLs

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
    def __init__(self, extractor: AbstractDataExtractor, cleaner: AbstractDataCleaner, relevance_checker: AbstractRelevanceChecker, db: AbstractDatabase, queue: AbstractQueueManager, num_threads: int = 1):
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
                print(f"{current_url} has already been visited, skipping")
                return
            
            self.visited_urls[current_url] = True

        print(f"Processing {current_url}")
        try: 
            raw_data = self.extractor.extract(current_url)
        except Exception as e:
            # put back in the queue on failure 
            print(f"Failed to extract data from {current_url}: {e}")
            self.queue.add([current_url], delay=60)
            return

        pre_cleaned_data = self.cleaner.get_clean_text(raw_data)

        if not self.relevance_checker.is_relevant(current_url, pre_cleaned_data):
            print(f"{current_url} is not relevant, skipping")
            return

        # tries to get things like the author, etc.
        document = self.cleaner.get_document(current_url, raw_data)
        
        # TODO: vectorize, extract relevant data, and perform side effects like uploading to DB using function calling
        chunk_contents = self.cleaner.get_chunks(raw_data)
        chunks = self.cleaner.enrich_chunks(chunk_contents, document)
        
        self.db.save_documents([document])
        self.db.save_chunks(chunks)

        children_urls = extract_links(current_url, raw_data)

        # filter by children not already visited; TODO make this more robust with a bloom filter? And not just skipping preemptively
        children_urls = [url for url in children_urls if url not in self.visited_urls and not self.queue.exists(url)]

        print("Putting children: ", children_urls)
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
                    print("Queue is empty, waiting for new URLs")
                    time.sleep(10)  # wait for 10 seconds before trying again
                    continue
                executor.submit(self.process_url, current_url)

# We are I/O bound, not CPU bound, so we can use a ton of threads
# Basically bound by DB + API bandwidth 
num_threads = 32

# We use OOP because we want to play with many different implementations of certain components
def run_for_elections():
    topics = ["Instructions for voters on how to vote in the United States election in 2024", "general educational information they should know about how the electoral process works"]
    relevance_checker = LLMRelevanceChecker([".*\.gov"], topics=topics)
    cleaner = LLMDataCleaner(topics=topics)

    # Example usage:
    engine = IngestionEngine(SimpleDataExtractor(), cleaner=cleaner, relevance_checker=relevance_checker, db=PrismaDatabase(), queue=SimpleQueueManager(), num_threads=num_threads)
    engine.run("https://www.usa.gov/midterm-elections")

def run_for_nikki_haley():
    topics = ["Nikki Haley's 2024 Presidential campaign and her political views", "her tenure and track record as a politicial and concrete actions she has taken"]
    relevance_checker = LLMRelevanceChecker([".*"], topics=topics)
    cleaner = LLMDataCleaner(topics=topics)

    # Example usage:
    engine = IngestionEngine(SimpleDataExtractor(), cleaner=cleaner, relevance_checker=relevance_checker, db=PrismaDatabase(), queue=SimpleQueueManager(), num_threads=num_threads)
    engine.run("https://nikkihaley.com/about/")

if __name__ == "__main__":
    run_for_elections()