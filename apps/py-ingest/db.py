from abc import ABC, abstractmethod
# import psycopg2
# from psycopg2.extras import RealDictCursor
import os
from typing import List
from embed import embed 
from prisma import Prisma
from utils import get_uuid
from schema import Document, Chunk

class AbstractDatabase(ABC):
    @abstractmethod
    def save_documents(self, documents: List[Document]):
        pass

    @abstractmethod
    def save_chunks(self, chunks: List[Chunk]):
        pass

class SimpleDatabase(AbstractDatabase):
    def save_documents(self, documents: List[Document]):
        os.makedirs("./simple_db/documents", exist_ok=True)
        for document in documents:
            # get a safe key name from the document id
            safe_id = document.id.replace('/', '_').replace(':', '_').replace('.', '_')
            filename = f"./simple_db/documents/{safe_id}.txt"
            with open(filename, 'w') as file:
                file.write(f"URL: {document.url}\nTitle: {document.title}\nAuthor: {document.author}\nDate Crawled: {document.date_crawled}\nDate Published: {document.date_published}")
            print(f"Saved document with ID {document.id} to SimpleDatabase")

    def save_chunks(self, chunks: List[Chunk]):
        os.makedirs("./simple_db/chunks", exist_ok=True)
        for chunk in chunks:
            # get a safe key name from the chunk document_id and index_in_doc
            safe_id = f"{chunk.document_id}_{chunk.index_in_doc}".replace('/', '_').replace(':', '_').replace('.', '_')
            filename = f"./simple_db/chunks/{safe_id}.txt"
            with open(filename, 'w') as file:
                file.write(chunk.content)
            print(f"Saved chunk for document ID {chunk.document_id} to SimpleDatabase")

class PrismaDatabase(AbstractDatabase):
    def __init__(self):
        self.prisma = Prisma()
        self.prisma.connect()

    def __del__(self):
        self.prisma.disconnect()

    def execute_raw_query(self, query: str):
        return self.prisma.execute_raw(query)

    def save_documents(self, documents: List[Document]):
        for document in documents:
            query = f"""
            INSERT INTO "Document" ("id", "title", "url", "author", "date_crawled", "date_published", "topics") 
            VALUES ('{document.id}', '{document.title}', '{document.url}', '{document.author}', '{document.date_crawled}', '{document.date_published}', '{{}}')
            """
            self.execute_raw_query(query)
            print(f"Saved document with ID {document.id} to PrismaDatabase")

    def save_chunks(self, chunks: List[Chunk]):
        for chunk in chunks:
            query = f"""
            INSERT INTO "Chunk" ("id", "content", "document_id", "index_in_doc", "embedding") 
            VALUES ('{chunk.id}', '{chunk.content}', '{chunk.document_id}', {chunk.index_in_doc}, '{chunk.embedding}')
            """
            self.execute_raw_query(query)
            print(f"Saved chunk for document ID {chunk.document_id} to PrismaDatabase")

def test_prisma_database():
    prisma_db = PrismaDatabase()
    doc_uuid = get_uuid()
    chunk_uuid = get_uuid()
    prisma_db.save_documents([Document(id=doc_uuid, title="Test Document", url="https://example.com", author="Test Author", date_crawled="2022-01-01", date_published="2022-01-01", topics=[])])
    prisma_db.save_chunks([Chunk(id=chunk_uuid, content="Test Chunk", document_id=doc_uuid, index_in_doc=0, embedding=embed("Test Chunk")[0])])
    prisma_db.execute_raw_query("DELETE FROM \"Document\" WHERE \"id\" = 'test_document_id'")
    prisma_db.execute_raw_query("DELETE FROM \"Chunk\" WHERE \"id\" = 'test_chunk_id'")
    del prisma_db

if __name__ == "__main__":
    test_prisma_database()
    print("db.py: All tests passed!")    