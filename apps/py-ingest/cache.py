from abc import ABC, abstractmethod

import os
import pickle
from typing import Any, Optional

class AbstractCache(ABC):
    @abstractmethod
    def save(self, key: str, value: Any) -> None:
        pass

    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        pass

    @abstractmethod
    def delete(self, key: str) -> None:
        pass

    @abstractmethod
    def exists(self, key: str) -> bool:
        pass

class LocalCache(AbstractCache):
    def __init__(self, cache_dir: str = "local_cache"):
        self.cache_dir = cache_dir
        if not os.path.exists(self.cache_dir):
            os.makedirs(self.cache_dir)

    def _get_cache_path(self, key: str) -> str:
        return os.path.join(self.cache_dir, f"{key}.pkl")

    def save(self, key: str, value: Any) -> None:
        cache_path = self._get_cache_path(key)
        with open(cache_path, 'wb') as cache_file:
            pickle.dump(value, cache_file)

    def get(self, key: str) -> Optional[Any]:
        cache_path = self._get_cache_path(key)
        if os.path.exists(cache_path):
            with open(cache_path, 'rb') as cache_file:
                return pickle.load(cache_file)
        return None

    def delete(self, key: str) -> None:
        cache_path = self._get_cache_path(key)
        if os.path.exists(cache_path):
            os.remove(cache_path)

    def exists(self, key: str) -> bool:
        cache_path = self._get_cache_path(key)
        return os.path.exists(cache_path)
