export const dynamic = "force-dynamic";

import { Badge } from "@/components/atoms/Badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/atoms/Card";
import { canididates } from "@/libs/candidates";
import Image from "next/image";
import {
  CandidateSourcesTable,
  CandidateSourcesTableSkeleton,
} from "./CandidateSourcesTable";
import { Suspense } from "react";

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

  return (
    <div className="py-4 px-8 flex flex-col gap-8">
      <div className="flex flex-row gap-8">
        <Card className="w-[360px]">
          <CardHeader>{candidate.name}</CardHeader>
          <CardContent className="relative flex flex-col gap-2">
            <Image
              src={candidate.image}
              alt={candidate.name}
              height={240}
              width={340}
              layout="crop"
              className="rounded-lg"
            />
          </CardContent>
          <CardFooter>
            {candidate.party && <Badge>{candidate.party}</Badge>}
          </CardFooter>
        </Card>
        <Card>
          <CardHeader size={4}>On the issues</CardHeader>
        </Card>
      </div>
      <Suspense fallback={<CandidateSourcesTableSkeleton />}>
        <CandidateSourcesTable
          candidate={candidate}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  );
}
