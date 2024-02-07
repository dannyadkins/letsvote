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
  {
    /* <ClientGeneration
        useMarkdown={true}
        messages={constructSearchPrompt(
          searchQuery,
          chunks,
          "speak to a phd level student"
        )}
      /> */
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="">{searchQuery}</h3>

      <Carousel
        opts={{
          align: "start",
        }}
        className="w-full"
      >
        <CarouselPrevious />

        <CarouselContent className="p-3">
          {chunks.map((chunk, index) => {
            return (
              <CarouselItem key={index} className="basis-1/3">
                <a href={chunk.url} target="_blank" rel="noopener noreferrer">
                  <Card
                    key={chunk.id}
                    className=" cursor-pointer bg-beige-50 rounded-lg p-4 flex flex-col gap-2 hover:shadow-md transition duration-200 ease-in-out relative transform hover:translate-y-[-0.5rem] text-xs"
                  >
                    <code className="truncate">{chunk.title}</code>
                    <div className="text-xs p-0 w-full overflow-hidden">
                      <p className="line-clamp-4">{chunk.content}</p>
                    </div>
                    <a className="text-xs truncate opacity-50">{chunk.url}</a>
                  </Card>
                </a>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselNext />
      </Carousel>
    </div>
  );
}
