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

  return (
    <div className="flex justify-center items-center ">
      <div className="max-w-[700px] w-full">
        <h3 className="">{searchQuery}</h3>
        <ClientGeneration
          useMarkdown={true}
          messages={constructSearchPrompt(
            searchQuery,
            chunks,
            "speak to a phd level student"
          )}
        />

        <div className="flex flex-col gap-2 items-center">
          {chunks.map((chunk) => {
            return (
              <div key={chunk.id} className="bg-beige-50 w-full rounded-lg">
                <div key={chunk.id} className="p-4">
                  <p>{chunk.content}</p>
                  <p className="text-sm italic">
                    Source:{" "}
                    <a
                      href={chunk.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {chunk.title}
                    </a>
                  </p>
                  <p>Relevance: {chunk.distance}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
