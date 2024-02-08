import { ClientGeneration } from "@/components/atoms/ClientGeneration";
import { Skeleton } from "@/components/atoms/Skeleton";
import { chunkKnn } from "@/libs/ai";
import { Link1Icon } from "@radix-ui/react-icons";
import Link from "next/link";

export const CandidateIssueTracker = async ({
  candidate,
  issue,
}: {
  candidate: { name: string };
  issue: string;
}) => {
  const sources = await chunkKnn(
    { text: candidate.name + " views on " + issue },
    30
  );

  //   filter out any duplicate sources
  const deduplicatedSources = sources.filter(
    (source, index, self) =>
      index ===
      self.findIndex((t) => t.url === source.url || t.title === source.title)
  );

  return (
    <div className="max-h-full flex flex-col">
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
          sources={sources}
          socratic={true}
        />
        <div className="flex flex-row gap-2 items-center overflow-x-scroll scrollbar-none p-2">
          {deduplicatedSources.map(
            (source) =>
              source.content && (
                <Link href={source.url} key={source.id} target="_blank">
                  <span className="text-xs flex flex-row overflow-x-hidden items-center gap-1 bg-neutral-50 rounded-md max-w-[200px] px-1 py-1 cursor-pointer hover:bg-neutral-100 transition-all duration-200 hover:-translate-y-1">
                    <Link1Icon className="h-4 w-4" color="#000000" />
                    <span className="truncate">{source.title}</span>
                  </span>
                </Link>
              )
          )}
        </div>
      </div>
    </div>
  );
};

export const CandidateIssueTrackerSkeleton = ({ issue }: { issue: string }) => {
  return (
    <div className="max-h-full flex flex-col">
      <span className="text-lg font-semibold">{issue}</span>
      <Skeleton className="h-12 w-full" />
    </div>
  );
};
