from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class Chunk(BaseModel):
    content: str
    index_in_doc: int
    document_id: str
    embedding: Optional[List[float]] = None
    
class Document(BaseModel):
    id: str
    url: str
    title: str
    # optional author
    author: Optional[str]
    # optional date crawled
    date_crawled: Optional[datetime]
    # optional date published
    date_published: Optional[datetime]
