"use client";
import { Message } from "ai";
import { useChat } from "ai/react";
import React, { useCallback, useEffect } from "react";
import Markdown from "react-markdown";

interface IGenerationProps {
  messages: Pick<Message, "role" | "content">[];
  useMarkdown?: boolean;
}

const randomId = () => {
  return Math.random().toString(36).substring(2, 15);
};

export const ClientGeneration: React.FC<IGenerationProps> = (props) => {
  const { messages: initialMessages, useMarkdown } = props;

  console.log("messages: ", initialMessages);
  const { messages, error, append } = useChat({
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
        <div>
          Generating:{" "}
          {messages &&
            messages
              .filter((m) => m.role === "assistant")
              .map((m) => <div key={m.id}>{m.content}</div>)}
        </div>
      )}
    </>
  );
};
