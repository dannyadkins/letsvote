import { Card, CardContent, CardHeader } from "@/components/atoms/Card";
import { DataTable } from "@/components/molecules/DataTable/DataTable";
import { DataTableToolbar } from "@/components/molecules/DataTable/DataTableToolbar";
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
  });

  console.log("Quotes: ", quotes);

  return (
    <div className="py-4 px-8">
      <Card>
        <CardHeader>{candidate.name}</CardHeader>
        <CardContent></CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h4>Explore sources</h4>
        </CardHeader>
        <CardContent>
          <DataTableToolbar />
          <DataTable
            columns={[
              {
                accessorKey: "content",
                header: "Quote",
              },
              {
                accessorKey: "source",
                header: "Source",
              },
            ]}
            data={quotes.map((quote) => ({
              content: quote.content,
              // source: quote.url,
            }))}
          />
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
