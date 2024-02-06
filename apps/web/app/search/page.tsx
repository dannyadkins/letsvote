import { knn } from "@/libs/ai";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // extract search query from params.search:
  const searchQuery = searchParams.instruction as string;

  //   if it exists, then we send it to /api/search/

  // this page should send search text to openai,
  // get the proper query from openai,
  // hydrate this page with that query,

  // then execute the proper prisma query
  const results = await knn({ text: "Nikki Haley's views on abortion" }, 10);

  return (
    <div>
      <div className="flex flex-col gap-2">
        {results.map((result) => (
          <div key={result.content} className="bg-beige-50">
            <p>{result.content}</p>
            <p>{result.distance}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
