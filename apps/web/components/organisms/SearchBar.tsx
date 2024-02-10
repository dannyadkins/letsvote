"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/atoms/Input";
import { useState, KeyboardEvent, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowUpIcon } from "@radix-ui/react-icons";
import classNames from "classnames";

const SUGGESTED_SEARCHES = [
  "When can I vote in Hawaii?",
  "How does the election process work in Georgia?",
  "What are Nikki Haley's views on foreign policy?",
  "What are the top issues in the 2024 election?",
];

export const SearchBar = ({ className, ...props }: any) => {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const suggestionsRef = useRef<any>(null);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = (event: any) => {
    if (!suggestionsRef.current.contains(event.relatedTarget)) {
      setIsFocused(false);
    }
  };
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
    <div className="max-w-full w-[500px] relative">
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
        <div
          ref={suggestionsRef}
          className="w-[500px] max-w-full absolute mt-1 bg-beige-50 text-sm flex flex-col z-50 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none"
        >
          {SUGGESTED_SEARCHES.map((search) => (
            <Link
              href={`/search?q=${encodeURIComponent(search)}`}
              key={search}
              className="hover:bg-neutral-100 p-2 rounded-md cursor-pointer"
              onTouchEnd={() => handleSelectSuggestion(search)} // Changed to onTouchEnd for better mobile support
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectSuggestion(search);
              }}
            >
              <span key={search}>{search}</span>
            </Link>
          ))}
        </div>
      )}
      <div className="absolute top-0 right-0 h-[100%] flex flex-row items-center w-[28px]">
        <ArrowUpIcon
          color="#999999"
          className={classNames(
            "h-4 w-4 transition-opacity duration-200 ease-in-out",
            inputValue?.length > 0 ? "opacity-100" : "opacity-50"
          )}
        />
      </div>
    </div>
  );
};
