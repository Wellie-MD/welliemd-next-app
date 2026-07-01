import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { labsApi, type CatalogItem, type CatalogLab } from "@/api/labs";
import {
  TestCatalogTable,
  TestDetailSheet,
  TestCreatePanel,
  type CreateFormState,
} from "@/features/test-catalog";

export default function TestCatalog() {
  const navigate = useNavigate();
  const [catalogLabs, setCatalogLabs] = useState<CatalogLab[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [catalogItemIds, setCatalogItemIds] = useState<string[]>([]);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [labFilter, setLabFilter] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // Sheet States
  const [detailItem, setDetailItem] = useState<CatalogItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createExpanded, setCreateExpanded] = useState(false);
  const [createLabFilter, setCreateLabFilter] = useState("all");

  // Load labs list once
  useEffect(() => {
    labsApi.getCatalogLabs().then(setCatalogLabs).catch(console.error);
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load catalog items based on search, lab filter, and page
  const fetchCatalogItems = useCallback(async () => {
    try {
      const response = await labsApi.getCatalogItems({
        lab_id: labFilter === "all" ? undefined : labFilter,
        q: debouncedSearch || undefined,
        page,
        page_size: pageSize,
      });
      setCatalogItems(response.results);
      setTotalCount(response.count);
    } catch (e) {
      console.error(e);
      setCatalogItems([]);
      setTotalCount(0);
    }
  }, [labFilter, debouncedSearch, page]);

  useEffect(() => {
    fetchCatalogItems();
  }, [fetchCatalogItems]);

  const handleDetails = (item: CatalogItem) => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  const handleCreateOpen = () => {
    setCreateLabFilter("all");
    setCatalogItemIds([]);
    setCreateOpen(true);
    setCreateExpanded(false);
  };

  const handleAddToTest = (item: CatalogItem) => {
    setCatalogItemIds((prev) =>
      prev.includes(item.id) ? prev : [...prev, item.id]
    );
  };

  const handleCreateSubmit = async (form: CreateFormState) => {
    try {
      await labsApi.createDraftLabPanelFromCatalog({
        name: form.name,
        description: form.description,
        fasting_required: form.fasting_required,
        collection_method: form.collection_method,
        catalog_item_ids: form.catalog_item_ids,
      });
      toast({
        title: "Draft panel created",
        description: "Finish pricing and availability on the Labs page before assigning it.",
      });
      setCreateOpen(false);
      setCatalogItemIds([]);
      navigate("/dashboard/products/labs");
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to create draft panel.",
        variant: "destructive",
      });
    }
  };

  const isCreateSheetOpen = createOpen;
  const effectiveLabFilter = isCreateSheetOpen ? createLabFilter : labFilter;
  const effectiveOnLabFilterChange = isCreateSheetOpen
    ? (v: string) => {
        setCreateLabFilter(v);
        setLabFilter(v);
        setPage(1); // Reset pagination on filter change
      }
    : (v: string) => {
        setLabFilter(v);
        setPage(1); // Reset pagination on filter change
      };

  const addedIdsSet = new Set(catalogItemIds);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col xl:flex-row gap-6 items-start relative">
        <div className={`w-full space-y-6 transition-all duration-300 ${createOpen ? (createExpanded ? "xl:max-w-[50%]" : "xl:max-w-[calc(100%-400px)]") : ""}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1A202C]">Test Catalog</h1>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                Search the Junction reference catalog and create draft WellieMD panels for later configuration on the Labs page.
              </p>
            </div>

            <Button
              onClick={handleCreateOpen}
              disabled={createOpen}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 inline-flex items-center gap-1 px-4 rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Create draft panel
            </Button>
          </div>

          <TestCatalogTable
            items={catalogItems}
            search={search}
            onSearchChange={setSearch}
            labFilter={effectiveLabFilter}
            onLabFilterChange={effectiveOnLabFilterChange}
            catalogLabs={catalogLabs}
            onDetails={handleDetails}
            addAction={isCreateSheetOpen}
            addedIds={addedIdsSet}
            onAddToTest={handleAddToTest}
            page={page}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>

        {createOpen && (
          <div className={`w-full shrink-0 xl:sticky xl:top-6 self-start transition-all duration-300 ${createExpanded ? "xl:w-[50%]" : "xl:w-[380px]"}`}>
            <TestCreatePanel
              open={createOpen}
              onOpenChange={setCreateOpen}
              catalogLabs={catalogLabs}
              catalogItems={catalogItems}
              labFilter={createLabFilter}
              onLabFilterChange={(v) => {
                setCreateLabFilter(v);
                setLabFilter(v);
                setPage(1);
              }}
              onCreate={handleCreateSubmit}
              biomarkerIds={catalogItemIds}
              onBiomarkerIdsChange={setCatalogItemIds}
              isExpanded={createExpanded}
              onToggleExpand={() => setCreateExpanded((prev) => !prev)}
            />
          </div>
        )}
      </div>

      <TestDetailSheet
        item={detailItem}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        loadDetail={labsApi.getCatalogItemDetail}
      />
    </div>
  );
}
