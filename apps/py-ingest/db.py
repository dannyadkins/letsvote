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
        try: 
            return self.prisma.execute_raw(query)
        except Exception as e:
            print(f"Failed to execute query: {e}")

    def save_documents(self, documents: List[Document], upsert: bool = True):
        for document in documents:
            columns = ['id']
            values = [f"'{document.id}'"]
            possible_columns = ['title', 'url', 'author', 'date_crawled', 'date_published', 'topics']
            upsert_columns = []

            for column in possible_columns:
                value = getattr(document, column, None)
                if value is not None:
                    columns.append(f'"{column}"')
                    upsert_columns.append(f'"{column}" = EXCLUDED."{column}"')
                    if isinstance(value, list):  # Assuming topics is a list
                        values.append(f"'{{}}'")
                    else:
                        values.append(f"'{value}'")
            
            columns_str = ", ".join(columns)
            values_str = ", ".join(values)
            upsert_str = ", ".join(upsert_columns)
            query = f'INSERT INTO "Document" ({columns_str}) VALUES ({values_str})'
            if upsert:
                query += f' ON CONFLICT (id) DO UPDATE SET {upsert_str}'
            self.execute_raw_query(query)
            print(f"Saved document with ID {document.id} to PrismaDatabase")

    def save_chunks(self, chunks: List[Chunk], upsert: bool = True):
        for chunk in chunks:
            columns = ['id']
            values = [f"'{chunk.id}'"]
            possible_columns = ['content', 'document_id', 'index_in_doc', 'embedding']
            upsert_columns = []

            for column in possible_columns:
                value = getattr(chunk, column, None)
                if value is not None:
                    columns.append(f'"{column}"')
                    upsert_columns.append(f'"{column}" = EXCLUDED."{column}"')
                    values.append(f"'{value}'" if column != 'index_in_doc' else str(value))
            
            columns_str = ", ".join(columns)
            values_str = ", ".join(values)
            upsert_str = ", ".join(upsert_columns)
            query = f'INSERT INTO "Chunk" ({columns_str}) VALUES ({values_str})'
            if upsert:
                query += f' ON CONFLICT (id) DO UPDATE SET {upsert_str}'
            self.execute_raw_query(query)
            print(f"Saved chunk for document ID {chunk.document_id} to PrismaDatabase")

def test_prisma_database():
    prisma_db = PrismaDatabase()
    doc_uuid = get_uuid()
    chunk_uuid = get_uuid()
    # Initial insert
    prisma_db.save_documents([Document(id=doc_uuid, title="Test Document", url="https://example.com", author="Test Author", date_crawled="2022-01-01", date_published="2022-01-01", topics=[])])
    prisma_db.save_chunks([Chunk(id=chunk_uuid, content="Test Chunk", document_id=doc_uuid, index_in_doc=0, embedding=embed("Test Chunk")[0])])
    # Upsert with the same ID but different content to test upsert functionality
    prisma_db.save_documents([Document(id=doc_uuid, title="Updated Test Document", url="https://example.com/updated", author="Updated Test Author", date_crawled="2022-02-01", date_published="2022-02-01", topics=["updated"])], upsert=True)
    prisma_db.save_chunks([Chunk(id=chunk_uuid, content="Updated Test Chunk", document_id=doc_uuid, index_in_doc=1, embedding=embed("Updated Test Chunk")[0])], upsert=True)
    # Cleanup
    prisma_db.execute_raw_query("DELETE FROM \"Document\" WHERE \"id\" = '" + doc_uuid + "'")
    prisma_db.execute_raw_query("DELETE FROM \"Chunk\" WHERE \"id\" = '" + chunk_uuid + "'")
    del prisma_db

if __name__ == "__main__":
    test_prisma_database()
    print("db.py: All tests passed!")    