import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { chunkKnn, embed } from "@/libs/ai";
import { constructBasePrompt, constructSourcePrompt } from "@/libs/ai/prompts";

let openaiClient;
let model;

export async function POST(req: Request) {
  let { messages, model: requestedModel, knnText } = await req.json();

  let sources: any[] = [];
  if (knnText) {
    try {
      const embedding = await embed(knnText);
      sources = await chunkKnn({ embedding }, 5);
    } catch (e) {
      console.error(e);
    }
  }

  const basePrompt = constructBasePrompt();
  const sourcePrompt = constructSourcePrompt(sources);

  if (sourcePrompt?.length) {
    // push to first
    messages.unshift({
      role: "system",
      content: basePrompt + "\n" + sourcePrompt,
    });
  } else {
    messages.unshift({
      role: "system",
      content: basePrompt,
    });
  }

  console.log("messages", messages);

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
    model = "gpt-3.5-turbo-0125"; // default modelm
    // model = "gpt-4-0125-preview"; // default model
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
