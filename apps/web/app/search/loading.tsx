import { Skeleton } from "@/components/atoms/Skeleton";

export default function LoadingSearch() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton count={10} className="w-full h-[60px]" />
    </div>
  );
}
