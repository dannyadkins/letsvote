from abc import ABC, abstractmethod
# import psycopg2
# from psycopg2.extras import RealDictCursor
import os
from typing import List
from embed import embed 
from prisma import Prisma
from utils import get_uuid, get_document_id, get_chunk_id
from schema import Document, Chunk
import logging

class AbstractDatabase(ABC):
    @abstractmethod
    def save_documents(self, documents: List[Document]):
        pass

    @abstractmethod
    def save_chunks(self, chunks: List[Chunk]):
        pass

class SimpleDatabase(AbstractDatabase):
    def save_documents(self, documents: List[Document]):
        logging.debug("Creating directory for documents if it doesn't exist.")
        os.makedirs("./simple_db/documents", exist_ok=True)
        for document in documents:
            logging.debug(f"Processing document with ID {document.id}")
            # get a safe key name from the document id
            safe_id = document.id.replace('/', '_').replace(':', '_').replace('.', '_')
            filename = f"./simple_db/documents/{safe_id}.txt"
            with open(filename, 'w') as file:
                file.write(f"URL: {document.url}\nTitle: {document.title}\nAuthor: {document.author}\nDate Crawled: {document.date_crawled}\nDate Published: {document.date_published}")
            logging.debug(f"Saved document with ID {document.id} to SimpleDatabase")

    def save_chunks(self, chunks: List[Chunk]):
        logging.debug("Creating directory for chunks if it doesn't exist.")
        os.makedirs("./simple_db/chunks", exist_ok=True)
        for chunk in chunks:
            logging.debug(f"Processing chunk for document ID {chunk.document_id}")
            # get a safe key name from the chunk document_id and index_in_doc
            safe_id = f"{chunk.document_id}_{chunk.index_in_doc}".replace('/', '_').replace(':', '_').replace('.', '_')
            filename = f"./simple_db/chunks/{safe_id}.txt"
            with open(filename, 'w') as file:
                file.write(chunk.content)
            logging.debug(f"Saved chunk for document ID {chunk.document_id} to SimpleDatabase")

class PrismaDatabase(AbstractDatabase):
    def __init__(self):
        logging.debug("Initializing PrismaDatabase connection.")
        self.prisma = Prisma()
        self.prisma.connect()

    def __del__(self):
        logging.debug("Disconnecting PrismaDatabase.")
        self.prisma.disconnect()

    def execute_raw_query(self, query: str):
        logging.debug(f"Executing raw query: {query}")
        try: 
            return self.prisma.execute_raw(query)
        except Exception as e:
            logging.error(f"Failed to execute query: {e}")

    def save_documents(self, documents: List[Document], upsert: bool = True):
        for document in documents:
            logging.debug(f"Preparing to save document with ID {document.id}")
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
                        formatted_list = "{" + ",".join([f'"{item}"' for item in value]) + "}"
                        values.append(f"'{formatted_list}'")
                    else:
                        values.append(f"'{value}'")
            
            columns_str = ", ".join(columns)
            values_str = ", ".join(values)
            upsert_str = ", ".join(upsert_columns)
            query = f'INSERT INTO "Document" ({columns_str}) VALUES ({values_str})'
            if upsert:
                query += f' ON CONFLICT (id) DO UPDATE SET {upsert_str}'
            self.execute_raw_query(query)
            logging.debug(f"Saved document with ID {document.id} to PrismaDatabase")

    def save_chunks(self, chunks: List[Chunk], upsert: bool = True):
        for chunk in chunks:
            logging.debug(f"Preparing to save chunk for document ID {chunk.document_id}")
            columns = ['id']
            values = [f"'{chunk.id}'"]
            possible_columns = ['content', 'document_id', 'index_in_doc', 'embedding', 'surrounding_content', 'type', 'topics']
            upsert_columns = []

            for column in possible_columns:
                value = getattr(chunk, column, None)
                if value is not None:
                    columns.append(f'"{column}"')
                    upsert_columns.append(f'"{column}" = EXCLUDED."{column}"')
                    try:
                        if (column == 'index_in_doc'):
                            values.append(str(value))
                        elif (column == 'embedding'):
                            # Escaping single quotes in strings to prevent syntax errors
                            values.append(f"'{value}'")
                        elif (column == 'topics'):
                            formatted_list = "{" + ",".join([f'"{item}"' for item in value]) + "}"
                            values.append(f"'{formatted_list}'")
                        else:
                            escaped_value = str(value).replace("'", "''")
                            values.append(f"'{escaped_value}'")
                    except Exception as e:
                        logging.error(f"Error processing value for column '{column}' with content: '{value}'. Error: {e}")
                        continue
            
            columns_str = ", ".join(columns)
            values_str = ", ".join(values)
            upsert_str = ", ".join(upsert_columns)
            query = f'INSERT INTO "Chunk" ({columns_str}) VALUES ({values_str})'
            if upsert:
                query += f' ON CONFLICT (id) DO UPDATE SET {upsert_str}'
            self.execute_raw_query(query)
            logging.debug(f"Saved chunk for document ID {chunk.document_id} to PrismaDatabase")

def test_prisma_database():
    logging.debug("Testing PrismaDatabase functionality.")
    prisma_db = PrismaDatabase()
    doc_uuid = get_document_id("https://example.com")
    chunk_uuid = get_chunk_id("Test Chunk")
    # Initial insert
    prisma_db.save_documents([Document(id=doc_uuid, title="Test Document", url="https://example.com", author="Test Author", date_crawled="2022-01-01", date_published="2022-01-01", topics=["2024 Election"])])
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
