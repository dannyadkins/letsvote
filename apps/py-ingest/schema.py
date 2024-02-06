from datetime import datetime
from typing import List, Optional

from utils import get_chunk_id, get_document_id
from prisma import Prisma
from embed import embed 

from pydantic import BaseModel, Field
from typing import List, Optional

class Document(BaseModel):
    id: str
    url: str
    author: Optional[str] = None
    date_published: Optional[datetime] = None
    date_crawled: datetime = Field(default_factory=datetime.now)
    title: str
    topics: List[str] = []
    chunks: List['Chunk'] = []

class Chunk(BaseModel):
    id: str
    document_id: Optional[str] = None
    index_in_doc: int
    embedding: Optional[List[float]] = None
    content: str
    surrounding_content: Optional[str] = ''
    Document: Optional[Document] = None

Document.update_forward_refs()


def test_schema():
    prisma = Prisma()
    prisma.connect()

    # test document creation
    new_document_id = get_document_id("https://example.com")
    document_insertion_query = f"""
    INSERT INTO "Document" ("id", "title", "url", "date_crawled", "date_published", "topics") 
    VALUES ('{new_document_id}', 'Test Document', 'https://example.com', '{datetime.now()}', '{datetime.now()}', '{{}}')
    """
    prisma.execute_raw(document_insertion_query)

    document = prisma.document.find_unique(where={"id": new_document_id})
    assert document.title == "Test Document", f"Expected title to be 'Test Document', got {document.title}"
    assert document.url == "https://example.com", f"Expected url to be 'https://example.com', got {document.url}"
    assert document.date_crawled, "Expected date_crawled to be set"
    assert document.date_published, "Expected date_published to be set"

    embedding = embed(["Test Chunk"])[0]

    # test chunk creation
    new_chunk_id = get_chunk_id("Test Chunk")
    chunk_insertion_query = f"""
    INSERT INTO "Chunk" ("id", "content", "document_id", "index_in_doc", "embedding") 
    VALUES ('{new_chunk_id}', 'Test Chunk', '{document.id}', 0, '{embedding}')
    """
    prisma.execute_raw(chunk_insertion_query)

    chunk = prisma.chunk.find_unique(where={"id": new_chunk_id})
    assert chunk.content == "Test Chunk", f"Expected content to be 'Test Chunk', got {chunk.content}"
    assert chunk.document_id == document.id, f"Expected document_id to be {document.id}, got {chunk.document_id}"

    # test chunk retrieval
    chunks = prisma.chunk.find_many(where={"document_id": document.id})
    assert len(chunks) == 1, f"Expected 1 chunk, got {len(chunks)}"
    assert chunks[0].content == "Test Chunk", f"Expected content to be 'Test Chunk', got {chunks[0].content}"
    assert chunks[0].document_id == document.id, f"Expected document_id to be {document.id}, got {chunks[0].document_id}"

    # test chunk deletion
    chunk_deletion_query = f"""
    DELETE FROM "Chunk" WHERE "id" = '{chunk.id}'
    """
    prisma.execute_raw(chunk_deletion_query)

    chunks = prisma.chunk.find_many(where={"document_id": document.id})
    assert len(chunks) == 0, f"Expected 0 chunks, got {len(chunks)}"

    # test document deletion
    document_deletion_query = f"""
    DELETE FROM "Document" WHERE "id" = '{document.id}'
    """
    prisma.execute_raw(document_deletion_query)

    document = prisma.document.find_unique(where={"id": document.id})
    assert document is None, "Expected document to be deleted"

    prisma.disconnect()
    print("schema.py: All tests passed!")

if __name__ == "__main__":
    test_schema()