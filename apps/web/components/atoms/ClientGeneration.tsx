"use client";
import { Message } from "ai";
import { useChat } from "ai/react";
import classNames from "classnames";
import React, { useCallback, useEffect } from "react";
import Markdown from "react-markdown";
import { SocraticText } from "./SocraticText";

interface IGenerationProps {
  messages: Pick<Message, "role" | "content">[];
  useMarkdown?: boolean;
  socratic?: boolean;
}

const randomId = () => {
  return Math.random().toString(36).substring(2, 15);
};

export const ClientGeneration: React.FC<IGenerationProps> = (props) => {
  const { messages: initialMessages, useMarkdown, socratic } = props;

  const { messages, error, append, isLoading } = useChat({
    api: "/api/chat",
    initialMessages: initialMessages
      .filter((m) => m.role !== "user")
      .map((m) => {
        return {
          ...m,
          id: randomId(),
        };
      }),
  });

  useEffect(() => {
    if (initialMessages?.length) {
      const userMessage = initialMessages
        .filter((m) => m.role === "user")
        .map((m) => {
          return {
            ...m,
            id: randomId(),
          };
        })?.[0];
      if (userMessage) {
        console.log("Sending message: ", userMessage);
        append(userMessage);
      }
    }
  }, [initialMessages]);

  return (
    <>
      {useMarkdown ? (
        <>
          {messages &&
            messages
              .filter((m) => m.role === "assistant")
              .map((m) => (
                <Markdown key={m.id} className={"markdown"}>
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
