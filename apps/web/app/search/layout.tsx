import { SearchQueryHeader } from "./SearchQueryHeader";

export default function SearchLayout({ children }: { children: any }) {
  return (
    <div className="flex justify-center items-center p-8">
      <div className="max-w-[700px] w-full">
        <div className="flex flex-col gap-4 w-full">
          <SearchQueryHeader />
          {children}
        </div>
      </div>
    </div>
  );
}
