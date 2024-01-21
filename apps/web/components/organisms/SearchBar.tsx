"use client";

import { Input } from "@/components/atoms/Input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atoms/Popover";
import { useState } from "react";

const SUGGESTED_SEARCHES = [
  "What are Nikki Haley's views on foreign policy?",
  "When can I vote in Iowa?",
];

export const SearchBar = ({ className, ...props }: any) => {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const handleChange = (event: any) => setInputValue(event.target.value);

  return (
    <div className="max-w-full w-[500px]">
      <Input
        type="text"
        placeholder="Enter a search"
        className="w-full"
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
      />
      {isFocused && !inputValue && (
        <div className="w-[500px] max-w-full absolute mt-1 bg-beige-50 text-sm flex flex-col z-50 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
          {SUGGESTED_SEARCHES.map((search) => (
            <span className="hover:bg-neutral-100 p-2 rounded-md cursor-pointer">
              {search}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
