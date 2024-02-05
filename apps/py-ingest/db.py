from abc import ABC, abstractmethod
# import psycopg2
# from psycopg2.extras import RealDictCursor
import os
from schema import Document, Chunk
from typing import List

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

# class PostgresDatabase(AbstractDatabase):
#     def __init__(self):
#         self.connection = psycopg2.connect(
#             dbname=os.getenv('DB_NAME'),
#             user=os.getenv('DB_USER'),
#             password=os.getenv('DB_PASSWORD'),
#             host=os.getenv('DB_HOST')
#         )
#         self.cursor = self.connection.cursor(cursor_factory=RealDictCursor)

#     def save_documents(self, documents: List[Document]):
#         for document in documents:
#             try:
#                 self.cursor.execute("INSERT INTO documents (id, url, title, author, date_crawled, date_published) VALUES (%s, %s, %s, %s, %s, %s)", 
#                                     (document.id, document.url, document.title, document.author, document.date_crawled, document.date_published))
#                 self.connection.commit()
#                 print(f"Saved document with ID {document.id} to PostgreSQL")
#             except Exception as e:
#                 print(f"An error occurred while saving document {document.id}: {e}")
#                 self.connection.rollback()

#     def save_chunks(self, chunks: List[Chunk]):
#         for chunk in chunks:
#             try:
#                 self.cursor.execute("INSERT INTO chunks (content, index_in_doc, document_id) VALUES (%s, %s, %s)", 
#                                     (chunk.content, chunk.index_in_doc, chunk.document_id))
#                 self.connection.commit()
#                 print(f"Saved chunk for document ID {chunk.document_id} to PostgreSQL")
#             except Exception as e:
#                 print(f"An error occurred while saving chunk for document {chunk.document_id}: {e}")
#                 self.connection.rollback()
