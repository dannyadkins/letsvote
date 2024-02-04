from abc import ABC, abstractmethod
from children import extract_links
from db import AbstractDatabase, SimpleDatabase
import requests
from bs4 import BeautifulSoup
import time
from datetime import datetime, timedelta
import re
from relevance import AbstractRelevanceChecker, SimpleRelevanceChecker, LLMRelevanceChecker
from clean import AbstractDataCleaner, SimpleDataCleaner

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
    
class IngestionEngine:
    def __init__(self, extractor: AbstractDataExtractor, cleaner: AbstractDataCleaner, relevance_checker: AbstractRelevanceChecker, db: AbstractDatabase, queue: AbstractQueueManager):
        self.extractor = extractor
        self.cleaner = cleaner
        self.relevance_checker = relevance_checker
        self.db = db
        self.queue = queue
        self.visited_urls = {}


    def normalize_url(self, url: str) -> str:
        return url.strip("/").strip()

    def run(self, seed_url: str):
        normalized_seed_url = self.normalize_url(seed_url)
        self.queue.add([normalized_seed_url])
        while True:
            current_url = self.queue.pop()
            if not current_url:
                print("Queue is empty, exiting")
                break
            if current_url in self.visited_urls:
                print(f"{current_url} has already been visited, skipping")
                continue

            print(f"Processing {current_url}")
            try: 
                raw_data = self.extractor.extract(current_url)
            except Exception as e:
                # put back in the queue on failure 
                print(f"Failed to extract data from {current_url}: {e}")
                self.queue.add([current_url], delay=60)
                continue 

            pre_cleaned_data = self.cleaner.clean(raw_data)
            print(pre_cleaned_data)

            if not self.relevance_checker.is_relevant(current_url, pre_cleaned_data):
                print(f"{current_url} is not relevant, skipping")
                continue 
            
            # TODO: add chunking and vectorization 

            self.db.save(current_url, pre_cleaned_data)
            children_urls = extract_links(current_url, pre_cleaned_data)
            for url in children_urls:
                normalized_url = self.normalize_url(url)
                self.queue.add([normalized_url])

# We use OOP because we want to play with many different implementations of certain components

relevance_checker = LLMRelevanceChecker([".*\.gov"], ["Instructions for voters on how to vote in the United States election in 2024", "general educational information they should know about how the electoral process works"])

# Example usage:
engine = IngestionEngine(SimpleDataExtractor(), SimpleDataCleaner(), relevance_checker=relevance_checker, db=SimpleDatabase(), queue=SimpleQueueManager())
engine.run("https://www.usa.gov/voting-and-elections")

