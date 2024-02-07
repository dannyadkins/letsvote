from prisma import Prisma

import logging
if __name__ == "__main__":
    # require input to move forward
    confirmation = input("Do you want to proceed? (y/N): ")
    if confirmation.lower() != 'y':
        print("Operation cancelled.")
        exit()

    logging.debug("Initializing PrismaDatabase connection.")
    prisma = Prisma()
    prisma.connect()

    documents_to_delete = prisma.document.find_many(where={"topics": {"has": "Candidates"}})
    chunks_to_delete = prisma.chunk.find_many(where={"topics": {"has": "Candidates"}})

    print(f"Number of documents to delete: {len(documents_to_delete)}")
    print(f"Number of chunks to delete: {len(chunks_to_delete)}")

    confirmation = input("Are you sure you want to delete these rows? (y/N): ")
    if confirmation.lower() == 'y':
        prisma.document.delete_many(where={"topics": {"has": "Candidates"}})
        prisma.chunk.delete_many(where={"topics": {"has": "Candidates"}})
        print("Rows deleted successfully.")
    else:
        print("Operation cancelled.")

    prisma.disconnect()
