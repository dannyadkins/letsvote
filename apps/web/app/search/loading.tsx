import { Skeleton } from "@/components/atoms/Skeleton";
import { SourcesCarouselSkeleton } from "./SourcesCarousel";

export default function LoadingSearch() {
  return (
    <div className="flex flex-col gap-2">
      <SourcesCarouselSkeleton />
    </div>
  );
}
