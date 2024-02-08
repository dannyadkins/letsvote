"use client";
import { Message } from "ai";
import { useChat } from "ai/react";
import classNames from "classnames";
import React, { useCallback, useEffect } from "react";
import Markdown from "react-markdown";
import { SocraticText } from "./SocraticText";
import { useCookies } from "react-cookie";

interface IGenerationProps {
  messages: Pick<Message, "role" | "content">[];
  useMarkdown?: boolean;
  socratic?: boolean;
}

const randomId = () => {
  return Math.random().toString(36).substring(2, 15);
};

const deriveSystemPromptFromSettings = ({
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

export const ClientGeneration: React.FC<IGenerationProps> = (props) => {
  const { messages: initialMessages, useMarkdown, socratic } = props;
  const [cookies] = useCookies(["customInstructions", "selectedState"]);

  const systemPrompt = deriveSystemPromptFromSettings({
    customInstructions: cookies.customInstructions || "",
    selectedState: cookies.selectedState || "",
  });

  const initialSystemMessage = systemPrompt
    ? [{ role: "system", content: systemPrompt, id: randomId() }]
    : [];

  const { messages, error, append, isLoading } = useChat({
    api: "/api/chat",
    // @ts-ignore
    initialMessages: initialSystemMessage.concat(
      initialMessages
        .filter((m) => m.role !== "user")
        .map((m) => ({
          ...m,
          id: randomId(),
        }))
    ),
  });

  useEffect(() => {
    const userMessage = initialMessages
      .filter((m) => m.role === "user")
      .map((m) => ({
        ...m,
        id: randomId(),
      }))[0];
    if (userMessage) {
      console.log("Sending message: ", userMessage);
      append(userMessage);
    }
  }, [initialMessages, append]);

  return (
    <>
      {useMarkdown ? (
        <>
          {messages &&
            messages
              .filter((m) => m.role === "assistant")
              .map((m) => (
                <Markdown key={m.id} className={"markdown flex flex-col gap-2"}>
                  {m.content}
                </Markdown>
              ))}
        </>
      ) : (
        <>
          {messages &&
            messages
              .filter((m) => m.role === "assistant")
              .map((m) =>
                socratic ? (
                  <SocraticText
                    disabled={isLoading}
                    key={m.id}
                    text={m.content}
                  />
                ) : (
                  <span>{m.content}</span>
                )
              )}
        </>
      )}
    </>
  );
};
