export async function getEmbedding(
  inputText: string,
  model = "text-embedding-ada-002"
): Promise<number[] | undefined> {
  const url = "https://api.openai.com/v1/embeddings";
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: inputText,
      model: model,
    }),
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    return data?.data?.[0]?.embedding;
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}
