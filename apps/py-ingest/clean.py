from abc import ABC, abstractmethod
from bs4 import BeautifulSoup
from llm import AbstractLLM, GPT
from pydantic import BaseModel

class AbstractDataCleaner(ABC):
    @abstractmethod
    def clean(self, raw_data: BeautifulSoup):
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

class SimpleDataCleaner(AbstractDataCleaner):
    def clean(self, raw_data: BeautifulSoup):
        # Strip out all scripts, styles, and unnecessary tags to return clean html nodes
        return raw_data.get_text()

class LLMDataCleaner(AbstractDataCleaner):
    # initialize with a GPT("3.5") client
    def __init__(self, gpt):
        self.model = GPT("3.5", "Here is some raw data that we extracted from a webpage. We want to break it up into specific chunks that are logically coherent, preserving the initial text exactly. Please provide a list of these chunks, and be precise.")
        super().__init__()

    def clean(self, raw_data: BeautifulSoup):
        class CleanResponse(BaseModel):
            chunks: list[str]

        clean_text = self.model.generate(self.get_clean_text(raw_data), response_model=CleanResponse)
        print(clean_text)
        return clean_text.chunks

import Levenshtein

def test_llm_data_cleaner_chunking_and_levenshtein_distance():
    cleaner = LLMDataCleaner(GPT("3.5"))
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

