export const dynamic = "force-dynamic";

import { chunkKnn } from "@/libs/ai";
import { Chunk } from "@prisma/client";
import { SourcesCarousel } from "./SourcesCarousel";
import { SearchQueryAnswer } from "./SearchQueryAnswer";

export default async function SearchPage({
  searchParams,
}: {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // extract search query from params.search:
  let searchQuery;
  if (typeof searchParams.q === "string") {
    searchQuery = searchParams.q;
  } else if (Array.isArray(searchParams.q)) {
    searchQuery = searchParams.q[0];
  } else {
    searchQuery = undefined;
  }

  if (!searchQuery) {
    throw new Error("You must input a search query.");
  }
  //   if it exists, then we send it to /api/search/

  // this page should send search text to openai,
  // get the proper query from openai,
  // hydrate this page with that query,

  // then execute the proper prisma query
  const chunks: Partial<
    Chunk & {
      url: string;
      title: string;
      distance: number;
      surroundingchunks?: Partial<Chunk>[];
    }
  >[] = await chunkKnn({ text: searchQuery }, 10);

  // related pages from sitemap

  return (
    <>
      <SourcesCarousel chunks={chunks} />
      <SearchQueryAnswer searchQuery={searchQuery} sources={chunks} />
    </>
  );
}
