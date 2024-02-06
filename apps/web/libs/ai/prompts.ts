import { Message } from "ai";

export const constructSearchPrompt = (
  searchQuery: string,
  sources?: {
    content?: string;
    url?: string;
    title?: string;
  }[],
  customInstructions?: string
): Pick<Message, "content" | "role">[] => {
  let sourcePrompt = "";
  (sources || []).forEach((source) => {
    sourcePrompt += `\nTitle: ${source.title} URL: ${source.url} Content: ${source.content}`;
  });

  if (sourcePrompt.length) {
    sourcePrompt =
      "Here is a list of sources that may or may not be relevant to the query: \n\n" +
      sourcePrompt +
      "\n\nUse any sources extremely judiciously ONLY if they are relevant, and cite all pieces of your response if possible. You MUST cite sources by using markdown links, such as [here is some link](https://someurl.com).";
  }

  return [
    {
      role: "system",
      content: `You are assisting a user with a query. 
      
      Ensure that you do not return ANY misinformation. It is better to avoid saying something than to respond with wrong information. 
      
      ${sourcePrompt} 

      ${customInstructions ? `You should respond in this style: ${customInstructions}` : ``}`,
    },
    {
      role: "user",
      content: searchQuery,
    },
  ];
};
