"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { DataTableViewOptions } from "@/components/molecules/DataTable/DataTableViewOptions";

// import { priorities, statuses } from "../data/data";

import { DataTableFacetedFilter } from "./DataTableFacetedFilter";
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/atoms/Checkbox";
import { ChunkTypes, ChunkTypesToLabels } from "@/libs/const";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const [tableFilterValue, setTableFilterValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState(tableFilterValue);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [useExactSearch, setUseExactSearch] = useState(true);

  // TODO refactor source-specific logic out
  const types: any[] = Object.entries(ChunkTypes).map((key, value) => ({
    value: value,
    label: ChunkTypesToLabels[key[1]],
  }));

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(tableFilterValue);
    }, 600); // Debounce delay of 300ms

    return () => {
      clearTimeout(handler);
    };
  }, [tableFilterValue]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (useExactSearch) {
      params.set("filter", debouncedValue);
      params.delete("softTextSearch");
    } else {
      params.set("softTextSearch", debouncedValue);
      params.delete("filter");
    }
    const newUrl = `?${params.toString()}`;
    router.push(newUrl, { scroll: false });
    router.refresh();
  }, [debouncedValue, useExactSearch, router]);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter sources..."
          value={tableFilterValue}
          onChange={(event) => setTableFilterValue(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <div className="items-center flex px-2">
          <Checkbox
            id="useExactSearch"
            checked={useExactSearch}
            onCheckedChange={(checked) => setUseExactSearch(checked === true)}
            className="mr-2"
          />
          <label
            htmlFor="useExactSearch"
            className="text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Search for exact text match
          </label>
        </div>
        {table.getColumn("type") && (
          <DataTableFacetedFilter
            column={table.getColumn("type")}
            title="Type"
            options={types}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
