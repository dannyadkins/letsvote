"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/atoms/Input";
import { useState, KeyboardEvent } from "react";

const SUGGESTED_SEARCHES = [
  "What are Nikki Haley's views on foreign policy?",
  "When can I vote in Iowa?",
];

export const SearchBar = ({ className, ...props }: any) => {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const handleChange = (event: any) => setInputValue(event.target.value);

  const handleSelectSuggestion = (suggestion: string) => {
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      router.push(`/search?q=${encodeURIComponent(inputValue)}`);
    }
  };

  return (
    <div className="max-w-full w-[500px]">
      <Input
        type="text"
        placeholder="Enter a search"
        className="w-full"
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      {isFocused && !inputValue && (
        <div className="w-[500px] max-w-full absolute mt-1 bg-beige-50 text-sm flex flex-col z-50 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none">
          {SUGGESTED_SEARCHES.map((search) => (
            <span
              key={search}
              className="hover:bg-neutral-100 p-2 rounded-md cursor-pointer"
              onClick={() => handleSelectSuggestion(search)}
            >
              {search}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
