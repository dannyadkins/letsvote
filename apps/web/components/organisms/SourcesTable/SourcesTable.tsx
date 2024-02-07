"use client";

import { DataTable } from "@/components/molecules/DataTable/DataTable";
import { ChunkTypes } from "@/libs/candidates";

export default function SourcesTable({ sources }: { sources: any[] }) {
  return (
    <DataTable
      columns={[
        {
          accessorKey: "type",
          header: "Type",
        },
        {
          accessorKey: "content",
          header: "Quote",
          minSize: 600,
        },
        {
          accessorKey: "title",
          header: "Source",
          minSize: 200,
        },
        {
          accessorKey: "url",
          header: "URL",
          cell: (props: any) => {
            return (
              <a
                href={props.getValue()}
                target="_blank"
                rel="noreferrer"
                className="max-w-[200px] truncate"
              >
                {props.getValue()}
              </a>
            );
          },
          maxSize: 200,
        },
      ]}
      data={sources.map((source: any) => ({
        content: source.content,
        url: source?.url,
        title: source?.title,
        type:
          Object.keys(ChunkTypes).find(
            (key: any) =>
              ChunkTypes[key as keyof typeof ChunkTypes] === source.type
          ) || source.type,
      }))}
    />
  );
}
