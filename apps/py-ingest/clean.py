from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Optional
import uuid
from bs4 import BeautifulSoup
from llm import AbstractLLM, GPT
from pydantic import BaseModel
from schema import Chunk, Document 
from utils import get_document_id
from embed import embed 

# TODO: We may want to append contextual information to each chunk, which could help in lookup.
# For example, we could have "parent text", "html node", etc. as fields on the chunk. 
# We definitely do not want to lose the context. Nikki Haley's website makes brazen claims that are not substantiated by the text.

class AbstractDataCleaner(ABC):
    @abstractmethod
    def get_chunks(self, raw_data: BeautifulSoup):
        pass

    def get_clean_text(self, raw_data: BeautifulSoup):
        for script in raw_data(["script", "style"]):
            script.decompose()  # rip it out

        # get text
        text = raw_data.get_text(separator=' ', strip=True)
        # break into lines and remove leading and trailing space on each
        lines = (line.strip() for line in text.splitlines())
        # break multi-headlines into a line each
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        # drop blank lines
        text = '\n'.join(chunk for chunk in chunks if chunk)
        return text 
    
    def get_document(self, url: str, raw_data: BeautifulSoup) -> Document:
        # get the title of the page using beautifulsoup 
        title = raw_data.title.string
        # get the date of the page using beautifulsoup
        date_published = raw_data.find("meta",  property="article:published_time")
        if date_published:
            date_published = date_published['content']
        
        author = raw_data.find("meta",  property="article:author")
        if author:
            author = author['content']

        date_crawled = datetime.now()

        # generate a unique objectid that can be used to identify the document, and work with postgres/other databases
        document_id = get_document_id(url)

        return Document(id=document_id, url=url, title=title, author=author, date_crawled=date_crawled, date_published=date_published, topics=[])
    
    # TODO: maybe link to neighbors in document 
    def enrich_chunks(self, chunk_contents: List[str], document: Document):
        chunks = []
        index = 0
        # generate a uuid 

        # embed all chunk contents as a batch
        embeddings = embed(chunk_contents)
        for content in chunk_contents:
            id = str(uuid.uuid4())
            embedding = embeddings[index]
            chunks.append(Chunk(id=id, document_id=document.id, content=content, index_in_doc=index, embedding=embedding))
            index += 1
        return chunks
            

class SimpleDataCleaner(AbstractDataCleaner):
    def get_chunks(self, raw_data: BeautifulSoup):
        # Strip out all scripts, styles, and unnecessary tags to return clean html nodes
        return [raw_data.get_text()]

class LLMDataCleaner(AbstractDataCleaner):
    # initialize with a GPT("3.5") client
    def __init__(self, topics=[]):
        system_prompt = "Here is some raw data that we extracted from a webpage. We want to break it up into specific chunks that are logically coherent, preserving the initial text exactly. Please provide a list of these chunks, and be precise. We do not care about headers or short strings or links to other pages, we only want actual substantive information. If it is not a FACT that will be a useful reference text, do not include it. Don't just include stuff that points to other facts without adding substantive information."
        if (topics):
            system_prompt += " We ONLY care about text related to these topics, you must ignore the rest so we don't look at any irrelevant information: " + ",".join(topics)
        self.model = GPT("4", system_prompt=system_prompt)
        super().__init__()

    def get_chunks(self, raw_data: BeautifulSoup):
        class CleanResponse(BaseModel):
            chunks: list[str]

        clean_text = self.get_clean_text(raw_data)

        num_tokens = len(clean_text.split())
        model_response = self.model.generate(clean_text, response_model=CleanResponse, max_tokens=4096)
        return model_response.chunks        

        


import Levenshtein

def test_llm_data_cleaner_chunking_and_levenshtein_distance():
    cleaner = LLMDataCleaner()
    # Test cases with expected chunked outputs and original texts for Levenshtein distance comparison
    test_cases = [
        ("<p>This is a simple paragraph.</p>", ["This is a simple paragraph."], "This is a simple paragraph."),
        ("<div><p>First paragraph.</p><p>Second paragraph.</p></div>", ["First paragraph.", "Second paragraph."], "First paragraph. Second paragraph."),
        ("<div><h1>Title</h1><p>Paragraph under a title.</p></div>", ["Title", "Paragraph under a title."], "Title Paragraph under a title."),
        ("<div><p>Paragraph with <a href='#'>a link</a> inside.</p></div>", ["Paragraph with a link inside."], "Paragraph with a link inside."),
        ("<div><p>First line.<br>Second line.</p></div>", ["First line.", "Second line."], "First line. Second line."),
        ("<script>console.log('Ignore this.')</script><p>Paragraph after script.</p>", ["Paragraph after script."], "Paragraph after script."),
    ]

    for raw_html, expected_chunks, original_text in test_cases:
        raw_data = BeautifulSoup(raw_html, 'html.parser')
        chunks = cleaner.clean(raw_data)
        assert chunks == expected_chunks, f"Expected {expected_chunks}, got {chunks}"

        # Calculate and assert Levenshtein distance
        cleaned_text = " ".join(chunks)
        distance = Levenshtein.distance(cleaned_text, original_text)
        assert distance <= len(original_text) * 0.1, f"Levenshtein distance {distance} is too high between '{cleaned_text}' and '{original_text}'"

    print("LLMDataCleaner chunking tests and Levenshtein distance checks passed.")

if __name__ == "__main__":
    test_llm_data_cleaner_chunking_and_levenshtein_distance()
    print("All tests passed")

