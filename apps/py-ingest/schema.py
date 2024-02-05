from datetime import datetime
from typing import List, Optional
from prisma import Prisma
from embed import embed 
from prisma.models import Document, Chunk


def test_schema():
    prisma = Prisma()
    prisma.connect()

    # test document creation
    document = prisma.document.create(
        data={
            'title': "Test Document",
            'url': "https://example.com",
            'date_crawled': datetime.now(),
            'date_published': datetime.now(),
        }
    )
    assert document.title == "Test Document", f"Expected title to be 'Test Document', got {document.title}"
    assert document.url == "https://example.com", f"Expected url to be 'https://example.com', got {document.url}"
    assert document.date_crawled, "Expected date_crawled to be set"
    assert document.date_published, "Expected date_published to be set"

    
    embedding = embed(["Test Chunk"])[0]
    print(embedding)
    # test chunk creation
    chunk = prisma.chunk.create(
        data={
            'content': "Test Chunk",
            'document_id': document.id,
            'index_in_doc': 0,
            'embedding': str(embedding) + "::vector" 
        }
    )
    assert chunk.content == "Test Chunk", f"Expected content to be 'Test Chunk', got {chunk.content}"
    assert chunk.document_id == document.id, f"Expected document_id to be {document.id}, got {chunk.document_id}"

    # test chunk retrieval
    chunks = prisma.chunk.find_many(where={"document_id": document.id})
    assert len(chunks) == 1, f"Expected 1 chunk, got {len(chunks)}"
    assert chunks[0].content == "Test Chunk", f"Expected content to be 'Test Chunk', got {chunks[0].content}"
    assert chunks[0].document_id == document.id, f"Expected document_id to be {document.id}, got {chunks[0].document_id}"

    # test chunk deletion
    prisma.chunk.delete(where={"id": chunk.id})
    chunks = prisma.chunk.find_many(where={"document_id": document.id})
    assert len(chunks) == 0, f"Expected 0 chunks, got {len(chunks)}"

    # test document deletion
    prisma.document.delete(where={"id": document.id})
    document = prisma.document.find_unique(where={"id": document.id})
    assert document is None, "Expected document to be deleted"

    prisma.disconnect()
    print("schema.py: All tests passed!")

if __name__ == "__main__":
    test_schema()