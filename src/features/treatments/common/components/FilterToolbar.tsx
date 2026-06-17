import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface FilterToolbarProps {
  placeholder: string;
}

export function FilterToolbar({ placeholder }: FilterToolbarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2">
        <button className="rounded-md bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white">All</button>
        <button className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">Published</button>
        <button className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">Draft</button>
        <button className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">Reset Filters</button>
      </div>
      <div className="relative w-full lg:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input className="pl-9" placeholder={placeholder} />
      </div>
    </div>
  );
}
