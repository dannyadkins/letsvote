import prisma from "@/db";

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

export const knn = async (
  input: { embedding?: number[]; text?: string },
  k: number
): Promise<{ content: string; distance: number }[]> => {
  let { embedding, text } = input;
  if (!embedding && !text) {
    throw new Error("Must provide either an embedding or text");
  }

  if (!embedding && text) {
    embedding = await embed(text);
  }

  return await prisma.$queryRaw`SELECT content, embedding <=> ${embedding}::vector AS distance FROM "Chunk" ORDER BY distance LIMIT ${k}`;
};
