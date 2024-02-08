import { Message } from "ai";

export const constructBasePrompt = (): string => {
  return `You are an assistant to provide reliable, unbiased, and informative information to a voter in the 2024 United States election. The year is 2024 and the current United States President is Joe Biden.

    Ensure that you do not return ANY misinformation. It is better to avoid saying something than to respond with wrong information.`;
};

export const constructSourcePrompt = (
  sources?: { content?: string; url?: string; title?: string }[]
): string => {
  let sourcePrompt = "";
  (sources || []).forEach((source) => {
    sourcePrompt += `\nTitle: ${source.title} URL: ${source.url} Content: ${source.content}`;
  });

  if (sourcePrompt.length) {
    sourcePrompt =
      "Here is a list of sources that may or may not be relevant to the query: \n\n" +
      sourcePrompt +
      "\n\nUse any sources extremely judiciously ONLY if they are relevant, and cite all pieces of your response if possible. Use direct quotes when possible. You MUST cite sources by using markdown links, such as [here is some link](https://someurl.com).";
  }
  return sourcePrompt;
};

export const constructSearchPrompt = (
  searchQuery: string,
  sources?: {
    content?: string;
    url?: string;
    title?: string;
  }[],
  customInstructions?: string
): Pick<Message, "content" | "role">[] => {
  let sourcePrompt = constructSourcePrompt(sources);
  const basePrompt = constructBasePrompt();

  return [
    {
      role: "system",
      content: `${basePrompt}
      
      ${sourcePrompt} 

      ${customInstructions ? `You should respond in this style: ${customInstructions}` : ``}`,
    },
    {
      role: "user",
      content: searchQuery,
    },
  ];
};

export const constructCustomInstructionsPrompt = ({
  customInstructions,
  selectedState,
}: {
  customInstructions: string;
  selectedState: string;
}) => {
  let prompt = "";
  if (customInstructions) {
    prompt += `You should respond to the user following these custom instructions, but make sure to be unbiased and informative: "${customInstructions}". You must still be factual, critical, unbiased, and nuanced, and cite all sources when applicable.\n`;
  }
  if (selectedState) {
    if (prompt.length > 0) prompt += " ";
    prompt += `You should try to focus on specific information relevant to a voter in ${selectedState}, but only if it is relevant.\n`;
  }
  return prompt;
};
