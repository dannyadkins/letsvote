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
import { ClientGeneration } from "@/components/atoms/ClientGeneration";

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
    <div className="py-4 px-8 flex flex-col gap-8 items-center">
      <div className="flex sm:flex-row sm:justify-between flex-col items-center sm:items-start gap-8">
        <Card className="w-[360px]">
          <CardHeader>{candidate.name}</CardHeader>
          <CardContent className="h-[300px] px-6">
            <div className="w-full relative h-full rounded-xl">
              <Image
                src={candidate.image}
                alt={candidate.name}
                fill
                style={{
                  objectFit: "contain",
                  borderRadius: "8px",
                }}
                className="rounded-lg"
              />
            </div>
          </CardContent>
          <CardFooter>
            {candidate.party && <Badge>{candidate.party}</Badge>}
          </CardFooter>
        </Card>
        <Card className="flex-grow max-h-full sm:max-w-[66%] max-w-full">
          <CardHeader size={4}>On the issues</CardHeader>
          <CardContent className="flex flex-col gap-2">
            {["Healthcare", "Economy", "Foreign Policy", "Climate Change"].map(
              (issue) => (
                <div className="max-h-full ">
                  <span className="text-lg font-semibold">{issue}</span>
                  <div className="text-sm line-clamp-2">
                    {/* TODO change to cached server-side with search augmentation, based on cookie */}
                    <ClientGeneration
                      messages={[
                        {
                          content: `In 30 words or fewer, what is ${candidate.name}'s stance on ${issue}?`,
                          role: "user",
                        },
                      ]}
                      socratic={true}
                    />
                  </div>
                </div>
              )
            )}
          </CardContent>
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
