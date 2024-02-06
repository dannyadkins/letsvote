import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";

let openaiClient;
let model;

export async function POST(req: Request) {
  const { messages, model: requestedModel } = await req.json();

  if (requestedModel === "pplx-70b-online") {
    openaiClient = new OpenAI({
      apiKey: process.env.PPLX_API_KEY || "",
      baseURL: "https://api.perplexity.ai/",
    });
    model = requestedModel;
  } else {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });
    model = "gpt-4-0125-preview"; // default model
  }

  const response = await openaiClient.chat.completions.create({
    model: model,
    stream: true,
    max_tokens: 4096,
    messages,
  });

  const stream = OpenAIStream(response);

  return new StreamingTextResponse(stream);
}
