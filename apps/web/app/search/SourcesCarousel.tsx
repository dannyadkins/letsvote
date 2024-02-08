"use client";

import { Card } from "@/components/atoms/Card";
import {
  Carousel,
  CarouselPrevious,
  CarouselContent,
  CarouselItem,
  CarouselNext,
} from "@/components/atoms/Carousel";
import { Skeleton } from "@/components/atoms/Skeleton";
import Link from "next/link";

export const SourcesCarousel = ({ chunks }: { chunks: any }) => {
  return (
    <Carousel>
      <CarouselPrevious />

      <CarouselContent className="p-3">
        {chunks.map((chunk: any, index: number) => {
          return (
            <CarouselItem key={index} className="basis-1/3 max-w-[33.3%]">
              <Link href={chunk.url} target="_blank" rel="noopener noreferrer">
                <Card
                  key={chunk.id}
                  className="cursor-pointer bg-beige-50 rounded-lg p-4 flex flex-col gap-2 hover:shadow-md transition duration-200 ease-in-out relative transform hover:translate-y-[-0.5rem] text-xs"
                >
                  <code className="truncate">{chunk.title}</code>
                  <div className="text-xs p-0 w-full overflow-hidden">
                    <p className="line-clamp-4">{chunk.content}</p>
                  </div>
                  <p className="text-xs truncate opacity-50">{chunk.url}</p>
                </Card>
              </Link>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <CarouselNext />
    </Carousel>
  );
};

export const SourcesCarouselSkeleton = () => {
  return (
    <div className="flex flex-row gap-4 p-3">
      <Skeleton count={3} className="w-[33.3%] h-36 rounded-xl" />
    </div>
  );
};
