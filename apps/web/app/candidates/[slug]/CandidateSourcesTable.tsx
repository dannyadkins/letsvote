import { Card, CardContent, CardHeader } from "@/components/atoms/Card";
import SourcesTable from "@/components/organisms/SourcesTable/SourcesTable";
import prisma from "@/db";
import { chunkKnn } from "@/libs/ai";
import { ChunkTypes } from "@/libs/candidates";

export const CandidateSourcesTable = async ({
  candidate,
  searchParams,
}: {
  candidate: any;
  searchParams: any;
}) => {
  let quotes = [];

  try {
    if (searchParams.softTextSearch) {
      quotes = await chunkKnn(
        { text: searchParams.softTextSearch as string },
        25,
        "Candidates"
      );
    } else {
      quotes = await prisma.chunk.findMany({
        where: {
          topics: {
            has: candidate.name + " 2024 Presidential Campaign",
          },
          type: searchParams.type as ChunkTypes,
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

      quotes = quotes.map((chunk) => {
        return {
          ...(chunk.Document || {}),
          ...chunk,
        };
      });
    }
  } catch (error: any) {
    return (
      <Card>
        <CardHeader size={4}>Explore sources</CardHeader>
        <CardContent>
          Error loading sources:
          <br /> <code> {error?.message}</code>{" "}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader size={4}>Explore sources</CardHeader>
      <CardContent>
        <SourcesTable sources={quotes} />
      </CardContent>
    </Card>
  );
};

export const CandidateSourcesTableSkeleton = () => {
  return (
    <Card>
      <CardHeader size={4}>Explore sources</CardHeader>
    </Card>
  );
};
