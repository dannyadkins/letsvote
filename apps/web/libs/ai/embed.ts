import prisma from "@/db";
import { Chunk, Prisma } from "@prisma/client";

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
  topic: string = "Candidates"
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

  const sql = `
      SELECT "Chunk".id, "Chunk".content, "Chunk".index_in_doc AS indexInDoc, "Chunk".embedding <=> $1::vector AS distance, 
      "Document".title, "Document".url
      FROM "Chunk"
      LEFT JOIN "Document" ON "Chunk".document_id = "Document".id
      ORDER BY distance LIMIT $3
    `;

  return await prisma.$queryRawUnsafe(sql, embedding, topic, k);
};
