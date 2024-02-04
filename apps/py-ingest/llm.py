# GPT completion, can use 3.5 or 4

from abc import ABC, abstractmethod
import os
import openai
import instructor
from openai import OpenAI
from pydantic import BaseModel

# Enables `response_model`


class AbstractLLM(ABC):
    @abstractmethod
    def generate(self, prompt: str):
        pass


class GPT(AbstractLLM):
    def __init__(self, version: str, system_prompt: str = None):
        openai = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        client = instructor.patch(OpenAI())
        self.client = client
        
        self.model_version = "gpt-3.5-turbo" if self.version == "3.5" else "gpt-4-turbo"

    def generate(self, prompt: str, response_model: BaseModel = None, functions: list = []):
        messages = [{"role": "user", "content": prompt}]
        if self.system_prompt:
            messages.insert(0, {"role": "system", "content": self.system_prompt})
        
        response = self.client.chat.completions.create(
            model=self.model_version,
            messages=messages,
            functions=functions,
            response_model=response_model,
            temperature=0.8,
            max_tokens=64,
            top_p=1
        )
        return response.choices[0].message['content']
