"use client";

import { DataTable } from "@/components/molecules/DataTable/DataTable";

export default function SourcesTable({ sources }: { sources: any[] }) {
  return (
    <DataTable
      columns={[
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
          cell: (props) => {
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
      }))}
    />
  );
}
