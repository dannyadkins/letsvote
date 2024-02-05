from prisma import Prisma 
from embed import embed
from typing import List

def knn(search_string: str, k: int = 20):
    search_embedding = embed([search_string])[0]
    prisma = Prisma()
    prisma.connect()

    formatted_search_embedding = "[" + ",".join([str(x) for x in search_embedding]) + "]"
    # await prisma.$queryRaw`SELECT url, content FROM "Chunks" ORDER BY embedding <-> ${embedding}::vector LIMIT 5`;
    return prisma.query_raw(f"SELECT content, embedding <=> '{formatted_search_embedding}'::vector AS distance FROM \"Chunk\" ORDER BY distance LIMIT {k}")

def test_knn():
    k=20
    results = knn("Nikki Haley views on abortion", k=k)
    print("Results: ", results)
    assert len(results) == k, f"Expected 5 results, got {len(results)}"
    # assert "url" in results[0], "Expected 'url' in first result"
    assert "content" in results[0], "Expected 'content' in first result"
    print("knn.py: All tests passed!")

if __name__ == "__main__":
    test_knn()