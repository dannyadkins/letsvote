import { Card, CardContent, CardHeader } from "@/components/atoms/Card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/atoms/Carousel";
import { ClientGeneration } from "@/components/atoms/ClientGeneration";
import { chunkKnn } from "@/libs/ai";
import { constructSearchPrompt } from "@/libs/ai/prompts";
import { Chunk } from "@prisma/client";
import { SourcesCarousel } from "./SourcesCarousel";

export default async function SearchPage({
  params,
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
    <div className="flex flex-col gap-4 w-full">
      <h3 className="">{searchQuery}</h3>

      <SourcesCarousel chunks={chunks} />
      <Card>
        <CardHeader size={4}>Answer</CardHeader>
        <CardContent>
          <ClientGeneration
            useMarkdown={true}
            messages={constructSearchPrompt(searchQuery, chunks)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
