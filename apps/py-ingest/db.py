from abc import ABC, abstractmethod
# import psycopg2
# from psycopg2.extras import RealDictCursor
import os

class AbstractDatabase(ABC):
    @abstractmethod
    def save(self, id: str, data: str):
        pass

class SimpleDatabase(AbstractDatabase):
    def save(self, id: str, data: str):
        # get a safe key name from the url, that is, no weird characters
        id = id.replace('/', '_').replace(':', '_').replace('.', '_')

        
        os.makedirs("./simple_db", exist_ok=True)
        filename = f"./simple_db/{id}.txt"
        with open(filename, 'w') as file:
            file.write(data)
        print(f"Saved to SimpleDatabase with ID {id}")

# class PostgresDatabase(AbstractDatabase):
#     def __init__(self):
#         self.connection = psycopg2.connect(
#             dbname=os.getenv('DB_NAME'),
#             user=os.getenv('DB_USER'),
#             password=os.getenv('DB_PASSWORD'),
#             host=os.getenv('DB_HOST')
#         )
#         self.cursor = self.connection.cursor(cursor_factory=RealDictCursor)

#     def save(self, data: str):
#         try:
#             self.cursor.execute("INSERT INTO data_storage (data) VALUES (%s)", (data,))
#             self.connection.commit()
#             print(f"Saved {data} to PostgreSQL")
#         except Exception as e:
#             print(f"An error occurred: {e}")
#             self.connection.rollback()

#     def save_object(self, data: dict):
#         try:
#             self.cursor.execute("INSERT INTO data_storage (data) VALUES (%s)", (data,))
#             self.connection.commit()
#             print(f"Saved {data} to PostgreSQL")
#         except Exception as e:
#             print(f"An error occurred: {e}")
#             self.connection.rollback()