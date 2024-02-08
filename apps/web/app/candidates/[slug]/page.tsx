export const dynamic = "force-dynamic";

import { Badge } from "@/components/atoms/Badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/atoms/Card";
import { canididates } from "@/libs/const";
import Image from "next/image";
import {
  CandidateSourcesTable,
  CandidateSourcesTableSkeleton,
} from "./CandidateSourcesTable";
import { Suspense } from "react";
import {
  CandidateIssueTracker,
  CandidateIssueTrackerSkeleton,
} from "./CandidateIssueTracker";
import { CandidateCard } from "./CandidateCard";

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
      <div className="flex sm:flex-row sm:justify-between flex-col items-center sm:items-start gap-8 w-full">
        <CandidateCard candidate={candidate} />
        <Card className="max-h-full sm:w-[66%] w-full">
          <CardHeader size={4}>On the issues</CardHeader>
          <CardContent className="flex flex-col gap-2">
            {["Healthcare", "Economy", "Foreign Policy", "Climate Change"].map(
              (issue) => (
                <Suspense
                  key={issue}
                  fallback={<CandidateIssueTrackerSkeleton issue={issue} />}
                >
                  <CandidateIssueTracker issue={issue} candidate={candidate} />
                </Suspense>
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
