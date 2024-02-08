"use client";
import { Message } from "ai";
import { useChat } from "ai/react";
import classNames from "classnames";
import React, { useCallback, useEffect, useMemo } from "react";
import Markdown from "react-markdown";
import { SocraticText } from "./SocraticText";
import { useCookies } from "react-cookie";
import {
  constructCustomInstructionsPrompt,
  constructSourcePrompt,
} from "@/libs/ai/prompts";

interface IGenerationProps {
  messages: Pick<Message, "role" | "content">[];
  useMarkdown?: boolean;
  socratic?: boolean;
  sources?: any[];
  setIsLoading?: (isLoading: boolean) => void;
}

const randomId = () => {
  return Math.random().toString(36).substring(2, 15);
};

export const ClientGeneration: React.FC<IGenerationProps> = (props) => {
  const { messages: initialMessages, useMarkdown, socratic, sources } = props;
  const [cookies] = useCookies(["customInstructions", "selectedState"]);

  const initialSystemMessage = useMemo(() => {
    const prompts = [
      constructCustomInstructionsPrompt({
        customInstructions: cookies.customInstructions || "",
        selectedState: cookies.selectedState || "",
      }),
      constructSourcePrompt(sources),
    ].filter(Boolean);

    const combinedPrompt = prompts.join("\n");
    return combinedPrompt
      ? [{ role: "system", content: combinedPrompt, id: randomId() }]
      : [];
  }, [cookies.customInstructions, cookies.selectedState, sources]);

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
    if (props.setIsLoading) {
      props.setIsLoading(isLoading);
    }
  }, [isLoading]);

  useEffect(() => {
    const userMessage = initialMessages
      .filter((m) => m.role === "user")
      .map((m) => ({
        ...m,
        id: randomId(),
      }))[0];
    if (userMessage) {
      console.log("Sending message: ", userMessage.content);
      append(userMessage);
    }
  }, [append]);

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
