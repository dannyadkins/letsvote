from abc import ABC, abstractmethod
import re
from llm import AbstractLLM, GPT
from pydantic import BaseModel

class AbstractRelevanceChecker(ABC):
    def __init__(self, url_regexes: list, topics: list):
        self.url_regexes = url_regexes
        self.topics = topics

    @abstractmethod
    def is_relevant(self, url: str, data: str):
        pass

    def matches_regex(self, url: str):
        for regex in self.url_regexes:
            if re.match(regex, url):
                return True
        return False
        

class SimpleRelevanceChecker(AbstractRelevanceChecker):
    def __init__(self, url_regexes: list, topics: list):
        super().__init__(url_regexes, topics)

    def is_relevant(self, url: str, data: str):
        return self.matches_regex(url)

# uses llm.GPT(3.5)
class VectorSimilarityRelevanceChecker(AbstractRelevanceChecker):
    def __init__(self, url_regexes: list, topics: list):
        self.vector_model = GPT("3.5", "You will be provided two strings. Please indicate whether the topics are related, and be stringent: we do not want to cause false positives.")
        super().__init__(url_regexes, topics)

    def is_relevant(self, url: str, data: str):
        class RelevanceResponse(BaseModel):
            is_relevant: bool

        topics_are_related = self.vector_model.generate("Here are our topics: " + " ".join(self.topics) + ". Here is the data: " + data + " Is the data relevant to the topics? ", response_model=RelevanceResponse)
        return topics_are_related.is_relevant
    
def test_vector_similarity_relevance_checker():
    checker = VectorSimilarityRelevanceChecker([".*"], ["voting", "elections", "democracy"])
    # Relevant content tests
    assert checker.is_relevant("https://example.com", "The importance of voting in democratic elections") == True
    assert checker.is_relevant("https://example.com", "How to register for voting?") == True
    assert checker.is_relevant("https://example.com", "Upcoming elections and why every vote counts") == True
    # Fringe cases
    assert checker.is_relevant("https://example.com", "The history of democracy in ancient civilizations") == True
    assert checker.is_relevant("https://example.com", "Social media's impact on voting behavior") == True
    # Irrelevant content tests
    assert checker.is_relevant("https://example.com", "The best apple pie recipe") == False
    assert checker.is_relevant("https://example.com", "Top 10 vacation spots for this summer") == False
    assert checker.is_relevant("https://example.com", "The life cycle of a banana tree") == False

if __name__ == "__main__":
    test_vector_similarity_relevance_checker()
    print("relevance.py: All tests passed")