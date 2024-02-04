# openai embedding methods
# embed a list of things
# get cosine similarity between two things

from openai import Embed
from typing import List, Tuple
from openai import OpenAI
from cache import LocalCache 

def embed(self, texts: List[str], model: str = "text-embedding-ada-002") -> List[List[float]]:
    """
    Get embeddings for a list of texts.

    :param texts: A list of strings for which to get embeddings.
    :param model: The model to use for generating embeddings.
    :return: A list of embeddings, each embedding is a list of floats.
    """
    client = OpenAI()

    embeddings = []
    for text in texts:
        text = text.replace("\n", " ")
        response = client.embeddings.create(input=[text], model=model)
        embeddings.append(response['data'][0]['embedding'])
    return embeddings

def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
    """
    Calculate the cosine similarity between two vectors.

    :param vec1: The first vector.
    :param vec2: The second vector.
    :return: The cosine similarity between vec1 and vec2.
    """
    dot_product = sum(p*q for p, q in zip(vec1, vec2))
    magnitude_vec1 = sum(p**2 for p in vec1) ** 0.5
    magnitude_vec2 = sum(q**2 for q in vec2) ** 0.5
    if magnitude_vec1 == 0 or magnitude_vec2 == 0:
        # Avoid division by zero
        return 0.0
    return dot_product / (magnitude_vec1 * magnitude_vec2)
