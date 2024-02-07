import { Card, CardContent, CardHeader } from "@/components/atoms/Card";
import { DataTable } from "@/components/molecules/DataTable/DataTable";
import prisma from "@/db";
import { ChunkTypes, canididates } from "@/libs/candidates";

export default async function CandidatePage({
  params,
}: {
  params: { slug: string };
}) {
  const candidate = canididates.find(
    (candidate) => candidate.slug === params.slug
  );

  if (!candidate) {
    throw new Error("Candidate not found");
  }
  const quotes = await prisma.chunk.findMany({
    where: {
      topics: {
        has: candidate.name + " 2024 Presidential Campaign",
      },
      type: ChunkTypes.DirectQuote,
    },
    take: 25,
    include: {
      Document: true,
    },
  });

  console.log(quotes);

  // TODO add pagination

  return (
    <div className="py-4 px-8">
      <Card>
        <CardHeader>{candidate.name}</CardHeader>
        <CardContent></CardContent>
      </Card>

      <Card>
        <CardHeader size={4}>Explore sources</CardHeader>
        <CardContent>
          <div>
            <DataTable
              columns={[
                {
                  accessorKey: "content",
                  header: "Quote",
                },
                {
                  accessorKey: "title",
                  header: "Source",
                },
                {
                  accessorKey: "url",
                  header: "URL",
                },
              ]}
              data={quotes.map((quote) => ({
                content: quote.content,
                url: quote.Document?.url,
                title: quote.Document?.title,
              }))}
            />
          </div>
        </CardContent>
      </Card>
      <div className="bg-beige-50 rounded-xl shadow-lg p-4">
        Quotes
        {quotes.map((quote) => {
          return <div key={quote.id}>{quote.content}</div>;
        })}
      </div>
    </div>
  );
}
