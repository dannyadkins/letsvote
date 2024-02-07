import { Card, CardContent, CardHeader } from "@/components/atoms/Card";
import { DataTable } from "@/components/molecules/DataTable/DataTable";
import SourcesTable from "@/components/organisms/SourcesTable/SourcesTable";
import prisma from "@/db";
import { chunkKnn } from "@/libs/ai";
import { ChunkTypes, canididates } from "@/libs/candidates";

export default async function CandidatePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const candidate = canididates.find(
    (candidate) => candidate.slug === params.slug
  );

  if (!candidate) {
    throw new Error("Candidate not found");
  }

  let quotes;
  if (searchParams.softTextSearch) {
    quotes = await chunkKnn(
      { text: searchParams.softTextSearch as string },
      25,
      true,
      false
    );
  } else {
    quotes = await prisma.chunk.findMany({
      where: {
        topics: {
          has: candidate.name + " 2024 Presidential Campaign",
        },
        type: ChunkTypes.DirectQuote,
        ...(searchParams.filter && {
          content: {
            contains: searchParams.filter as string,
          },
        }),
      },
      take: 25,
      include: {
        Document: true,
      },
    });
  }

  quotes = quotes.map((chunk) => {
    return {
      ...(chunk.Document || {}),
      ...chunk,
    };
  });

  return (
    <div className="py-4 px-8">
      <Card>
        <CardHeader>{candidate.name}</CardHeader>
        <CardContent></CardContent>
      </Card>
      <Card>
        <CardHeader size={4}>Explore sources</CardHeader>
        <CardContent>
          <SourcesTable sources={quotes} />
        </CardContent>
      </Card>
    </div>
  );
}
