import prisma from "@/db";
import { Chunk } from "@prisma/client";

type EmbeddingModel =
  | "text-embedding-3-small"
  | "text-embedding-3-large"
  | "text-embedding-ada-002";

// Generate an embedding using OpenAI's new `text-embedding-3-small` model
export const embed = async (
  text: string,
  model: string = "text-embedding-3-small"
): Promise<number[]> => {
  const response = await fetch(`https://api.openai.com/v1/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      input: text,
    }),
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data?.data?.[0]?.embedding;
};

export const chunkKnn = async (
  input: { embedding?: number[]; text?: string },
  k: number,
  includeDocument: boolean = false,
  includeSurroundingChunks: boolean = false
): Promise<
  (Partial<Chunk & Document> & {
    distance: number;
    surroundingchunks?: Partial<Chunk>[];
  })[]
> => {
  let { embedding, text } = input;

  if (!embedding && !text) {
    throw new Error("Must provide either an embedding or text");
  }

  if (!embedding && text) {
    embedding = await embed(text);
  }

  if (includeDocument && includeSurroundingChunks) {
    return await prisma.$queryRaw`
      SELECT "Chunk".id, "Chunk".content, "Chunk".index_in_doc AS indexInDoc, "Chunk".embedding <=> ${embedding}::vector AS distance, 
      "Document".title, "Document".url,
      (
        SELECT array_agg(json_build_object('content', c.content, 'indexIn_doc', c.index_in_doc)) 
        FROM "Chunk" c 
        WHERE c.document_id = "Chunk".document_id 
        AND c.index_in_doc BETWEEN "Chunk".index_in_doc - 5 AND "Chunk".index_in_doc + 5 
        AND c.id != "Chunk".id
      ) AS surroundingChunks
      FROM "Chunk"
      LEFT JOIN "Document" ON "Chunk".document_id = "Document".id
      ORDER BY distance LIMIT ${k}
    `;
  } else if (includeDocument) {
    return await prisma.$queryRaw`
      SELECT "Chunk".id, "Chunk".content, "Chunk".index_in_doc AS indexInDoc, "Chunk".embedding <=> ${embedding}::vector AS distance, 
      "Document".title, "Document".url
      FROM "Chunk"
      LEFT JOIN "Document" ON "Chunk".document_id = "Document".id
      ORDER BY distance LIMIT ${k}
    `;
  } else {
    return await prisma.$queryRaw`
      SELECT "Chunk".id, "Chunk".content, "Chunk".index_in_doc AS indexInDoc, "Chunk".embedding <=> ${embedding}::vector AS distance
      FROM "Chunk"
      ORDER BY distance LIMIT ${k}
    `;
  }
};
