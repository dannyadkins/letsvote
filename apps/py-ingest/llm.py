# GPT completion, can use 3.5 or 4

from abc import ABC, abstractmethod
import os
import openai
import instructor
from openai import OpenAI
from pydantic import BaseModel
from dotenv import load_dotenv
from cache import LocalCache

load_dotenv()

# Enables `response_model`

class AbstractLLM(ABC):
    @abstractmethod
    def generate(self, prompt: str):
        pass


class GPT(AbstractLLM):
    def __init__(self, version: str, system_prompt: str = None):
        openai = OpenAI()
        client = instructor.patch(OpenAI())
        self.client = client

        self.model_version = "gpt-3.5-turbo" if version == "3.5" else "gpt-4-0125-preview"
        self.system_prompt = system_prompt

    def generate(self, prompt: str, response_model: BaseModel = None, functions: list = [], temperature: float = 0, max_tokens: int = 64, top_p: float = 1):
        messages = [{"role": "user", "content": prompt}]
        if self.system_prompt:
            messages.insert(0, {"role": "system", "content": self.system_prompt})
        
        response = self.client.chat.completions.create(
            model=self.model_version,
            messages=messages,
            functions=functions,
            response_model=response_model,
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=top_p
        )

        if (response_model):
            return response
        return response.choices[0].message['content']
