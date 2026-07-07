import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Info, ChevronLeft, ChevronRight, X, ChevronDown } from "lucide-react";
import { labsApi, type CatalogItem } from "@/api/labs";

interface Props {
  items: CatalogItem[];
  search: string;
  onSearchChange: (v: string) => void;
  labFilter: string;
  onLabFilterChange: (v: string) => void;
  catalogLabs: { id: string; name: string }[];
  onDetails: (item: CatalogItem) => void;
  addAction?: boolean;
  addedIds?: Set<string>;
  onAddToTest?: (item: CatalogItem) => void;
  // Pagination props
  page?: number;
  totalCount?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export default function TestCatalogTable({
  items,
  search,
  onSearchChange,
  labFilter,
  onLabFilterChange,
  catalogLabs,
  onDetails,
  addAction = false,
  addedIds,
  onAddToTest,
  page = 1,
  totalCount = 0,
  pageSize = 10,
  onPageChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const isProviderChosen = labFilter !== "all" && labFilter !== "";
  const hasSyncedLabs = catalogLabs.length > 0;
  const emptyMessage = !hasSyncedLabs
    ? "Reference catalog has not been synced yet."
    : !isProviderChosen
      ? "Choose a lab first to load the reference catalog."
      : search.trim()
        ? "No catalog items match your search."
        : "No catalog items are available for this lab.";

  return (
    <>
      <div className="bg-card border border-border/60 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <SearchCombobox
            search={search}
            onSearchChange={onSearchChange}
            labFilter={labFilter}
            catalogLabs={catalogLabs}
          />
          <select
            value={labFilter}
            onChange={(e) => onLabFilterChange(e.target.value)}
            className="h-10 text-xs font-semibold rounded-md border border-border/80 bg-white px-3 py-2 text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-[200px] shrink-0"
          >
            <option value="all">All Labs</option>
            {catalogLabs.map((lab) => (
              <option key={lab.id} value={lab.id}>
                Lab: {lab.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground">
                LAB TEST
              </TableHead>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground">
                TEST CODE
              </TableHead>
              <TableHead className="font-semibold text-xs tracking-wider text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  PRICE
                  <span className="text-slate-400 text-[10px] cursor-help font-normal" title="Estimated source price from the Junction reference catalog">
                    ⓘ
                  </span>
                </span>
              </TableHead>
              <TableHead className="text-right font-semibold text-xs tracking-wider text-muted-foreground pr-6">
                ACTION
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const isAdded = addedIds?.has(item.id) ?? false;
              return (
                <TableRow
                  key={item.id}
                  className="hover:bg-muted/5 cursor-pointer"
                  onClick={() => onDetails(item)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className="font-medium text-slate-900 truncate cursor-pointer hover:text-blue-700"
                          onClick={() => onDetails(item)}
                        >
                          {item.name}
                        </p>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => onDetails(item)}
                          title="View details"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                        {item.has_aoe_required && (
                          <span className="inline-flex items-center gap-1 shrink-0 rounded bg-slate-100 border border-slate-200/50 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                            AOE REQUIRED
                            <span className="text-slate-400 text-[10px] cursor-help font-normal" title="Junction requires answers to order-entry questions for this test">
                              ⓘ
                            </span>
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.lab_name}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="font-bold text-[#12517A] text-sm">
                      {item.provider_id || "—"}
                    </span>
                  </TableCell>

                  <TableCell className="text-sm text-slate-700">
                    {item.price || "—"}
                  </TableCell>

                  <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onDetails(item)}
                        className="border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs py-1 px-3 h-8 shadow-none transition-colors duration-200"
                      >
                        Details
                      </Button>
                      {addAction && isProviderChosen && onAddToTest && (
                        <Button
                          type="button"
                          variant={isAdded ? "secondary" : "outline"}
                          size="sm"
                          disabled={isAdded}
                          onClick={() => onAddToTest(item)}
                          className={isAdded 
                            ? "bg-[#EDF2F7] text-[#718096] border-none shadow-none cursor-not-allowed hover:bg-[#EDF2F7] hover:text-[#718096] font-semibold text-xs py-1 px-4 h-8 transition-all duration-200" 
                            : "border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs py-1 px-3 h-8 shadow-none transition-all duration-200"}
                        >
                          {isAdded ? "Added" : "Add to test"}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-12 text-muted-foreground text-sm"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {totalCount > 0 && onPageChange && (
          <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/10">
            <div className="text-xs text-muted-foreground">
              Showing page <span className="font-medium text-foreground">{page}</span> of{" "}
              <span className="font-medium text-foreground">{totalPages}</span> ({totalCount} total items)
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous page</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next page</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

interface SearchItem {
  id: string;
  type: "test" | "code";
  name?: string;
  lab_name?: string;
  provider_id: string;
}

function SearchCombobox({
  search,
  onSearchChange,
  labFilter,
  catalogLabs,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  labFilter: string;
  catalogLabs: { id: string; name: string }[];
}) {
  const [searchPills, setSearchPills] = useState<SearchItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CatalogItem[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Sync parent reset (e.g. if lab filter changes, parent sets search to empty)
  useEffect(() => {
    if (search === "") {
      setSearchPills([]);
      setSearchQuery("");
    }
  }, [search]);

  // Fetch suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await labsApi.getCatalogItems({
          q: searchQuery,
          lab_id: labFilter,
          page_size: 10,
        });
        setSuggestions(res.results || []);
      } catch (err) {
        console.error("Failed to load search suggestions", err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, labFilter]);

  // Update parent when pills change
  const triggerSearchChange = (pills: SearchItem[], query: string) => {
    if (pills.length === 0) {
      onSearchChange(query);
    } else {
      onSearchChange(pills.map((p) => p.provider_id).join(","));
    }
  };

  const handleAddCodePill = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    const newPill: SearchItem = {
      id: `${Date.now()}-${trimmed}`,
      type: "code",
      provider_id: trimmed,
    };
    const updated = [...searchPills, newPill];
    setSearchPills(updated);
    setSearchQuery("");
    triggerSearchChange(updated, "");
  };

  const handleAddTestPill = (item: CatalogItem) => {
    const newPill: SearchItem = {
      id: item.id,
      type: "test",
      name: item.name,
      lab_name: item.lab_name,
      provider_id: item.provider_id,
    };
    const updated = [...searchPills, newPill];
    setSearchPills(updated);
    setSearchQuery("");
    triggerSearchChange(updated, "");
  };

  const handleRemovePill = (id: string) => {
    const updated = searchPills.filter((p) => p.id !== id);
    setSearchPills(updated);
    triggerSearchChange(updated, searchQuery);
  };

  const handleClearAll = () => {
    setSearchPills([]);
    setSearchQuery("");
    onSearchChange("");
  };

  return (
    <div className="relative flex-1 w-full z-10">
      <div
        className={`relative flex items-center flex-wrap gap-1.5 px-3 py-1.5 min-h-[40px] w-full border rounded-lg bg-white shadow-sm transition-all duration-200 ${
          isFocused ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200"
        }`}
      >
        {searchPills.map((pill) => (
          <React.Fragment key={pill.id}>
            {pill.type === "code" ? (
              <span className="inline-flex items-center gap-1 bg-[#FED7D7] text-[#C53030] text-xs font-semibold px-2 py-0.5 rounded shadow-sm">
                {pill.provider_id}
                <button
                  type="button"
                  onClick={() => handleRemovePill(pill.id)}
                  className="text-red-500 hover:text-red-700 font-bold ml-0.5 transition-colors duration-150"
                >
                  ✕
                </button>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-[#EDF2F7] text-[#2D3748] text-xs font-semibold px-2.5 py-0.5 rounded shadow-sm max-w-[280px] sm:max-w-[400px]">
                <span className="truncate max-w-[120px] sm:max-w-[200px]">{pill.name}</span>
                <span className="text-[10px] text-slate-400 font-normal">{pill.lab_name}</span>
                <span className="text-[10px] text-[#3EB0A1] font-bold">{pill.provider_id}</span>
                <button
                  type="button"
                  onClick={() => handleRemovePill(pill.id)}
                  className="text-slate-500 hover:text-slate-700 font-bold ml-0.5 shrink-0 transition-colors duration-150"
                >
                  ✕
                </button>
              </span>
            )}
          </React.Fragment>
        ))}

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            triggerSearchChange(searchPills, e.target.value);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={searchPills.length === 0 ? "Search by name or provider IDs" : ""}
          className="flex-1 min-w-[60px] bg-transparent outline-none border-none text-xs text-slate-800 placeholder-slate-400 py-0.5"
        />

        <div className="flex items-center gap-2 pr-1 shrink-0 ml-auto">
          {(searchQuery || searchPills.length > 0) && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <ChevronDown
            className="h-4 w-4 text-slate-400 cursor-pointer"
            onClick={() => setIsFocused((prev) => !prev)}
          />
        </div>
      </div>

      {isFocused && (searchQuery.trim() || suggestions.length > 0) && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-[300px] overflow-y-auto py-1">
          {searchQuery.trim() && (
            <button
              type="button"
              onMouseDown={() => handleAddCodePill(searchQuery)}
              className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-[#F0FDF4] transition-colors flex items-center justify-between border-b border-slate-100"
            >
              <span>
                Search as multiple Test Codes <span className="text-[#3EB0A1] font-bold ml-1">{searchQuery}</span>
              </span>
            </button>
          )}

          {loadingSuggestions ? (
            <div className="px-4 py-3 text-xs text-slate-400 italic">Searching suggestions…</div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-400 italic">No matching results found</div>
          ) : (
            suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={() => handleAddTestPill(item)}
                className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-between"
              >
                <div className="min-w-0 pr-4">
                  <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.lab_name}</p>
                </div>
                <span className="text-[#3EB0A1] font-bold shrink-0">{item.provider_id}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
