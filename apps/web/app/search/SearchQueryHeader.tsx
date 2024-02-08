"use client";

import { useSearchParams } from "next/navigation";

export const SearchQueryHeader = () => {
  const searchParams = useSearchParams();
  const q = searchParams.get("q");

  let searchQuery;
  if (typeof q === "string") {
    searchQuery = q;
  } else if (Array.isArray(q)) {
    searchQuery = q[0];
  } else {
    searchQuery = undefined;
  }

  if (!searchQuery) {
    throw new Error("You must input a search query.");
  }

  return <h3>{searchQuery}</h3>;
};
