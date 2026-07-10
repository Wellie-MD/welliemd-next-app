import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { productApi, assignmentLogApi } from "@/api/products";
import { clientApi } from "@/api/clientApi";
import { Loader2, Archive, RotateCcw, Search, ChevronLeft, ChevronRight, Package } from "lucide-react";

export default function ArchiveProductsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(30);

  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: clientApi.list,
  });

  const { data: paginationData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["client-products", selectedClient, currentPage, pageSize, searchQuery],
    queryFn: async (): Promise<{ results: any[]; count: number }> => {
      if (!selectedClient) return { results: [], count: 0 };
      const history = await assignmentLogApi.listLogs({
        client: selectedClient,
        status: "success",
        latest_only: "true",
        page: currentPage,
        page_size: pageSize,
      });
      return history;
    },
    enabled: !!selectedClient,
  });

  const assignedProducts = paginationData?.results || [];
  const totalCount = paginationData?.count || 0;

  const archiveMutation = useMutation({
    mutationFn: productApi.archiveProducts,
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Success", description: data.message || "Products archived successfully" });
        queryClient.invalidateQueries({ queryKey: ["client-products", selectedClient] });
        setSelectedProducts([]);
      } else {
        toast({ title: "Error", description: data.error || "Failed to archive products", variant: "destructive" });
      }
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error
        ? error.message
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "An error occurred";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: productApi.unarchiveProducts,
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Success", description: data.message || "Products restored successfully" });
        queryClient.invalidateQueries({ queryKey: ["client-products", selectedClient] });
        setSelectedProducts([]);
      } else {
        toast({ title: "Error", description: data.error || "Failed to restore products", variant: "destructive" });
      }
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error
        ? error.message
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "An error occurred";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    },
  });

  const filteredProducts = useMemo(() => {
    if (!assignedProducts) return [];
    if (!searchQuery) return assignedProducts;
    return assignedProducts.filter((log) =>
      log.product_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assignedProducts, searchQuery]);

  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedClient]);

  const handleSelectAll = (checked: boolean) => {
    if (checked && filteredProducts) {
      setSelectedProducts(filteredProducts.map((log) => parseInt(log.product_id)));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: number, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
    }
  };

  const handleArchive = () => {
    if (!selectedClient || selectedProducts.length === 0) return;
    archiveMutation.mutate({ product_ids: selectedProducts, client_ids: [selectedClient] });
  };

  const handleUnarchive = () => {
    if (!selectedClient || selectedProducts.length === 0) return;
    unarchiveMutation.mutate({ product_ids: selectedProducts, client_ids: [selectedClient] });
  };

  return (
    <div className="space-y-6">
      <div className="w-full md:w-1/3">
        <label className="text-sm font-medium mb-2 block">Select Client</label>
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger>
            <SelectValue placeholder="Select a client..." />
          </SelectTrigger>
          <SelectContent>
            {isLoadingClients ? (
              <div className="p-2 flex justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              clients?.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {!selectedClient ? (
        <div className="flex flex-col items-center justify-center py-16 text-center max-w-xl mx-auto">
          <Package className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-base font-semibold text-slate-700 mb-1">Select a client</h3>
          <p className="text-sm text-slate-500">Choose a client above to view their archived products.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleUnarchive}
                disabled={selectedProducts.length === 0 || unarchiveMutation.isPending}
              >
                {unarchiveMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                Restore Selected
              </Button>
              <Button
                variant="destructive"
                onClick={handleArchive}
                disabled={selectedProducts.length === 0 || archiveMutation.isPending}
              >
                {archiveMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Archive className="mr-2 h-4 w-4" />
                )}
                Archive Selected
              </Button>
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        filteredProducts &&
                        filteredProducts.length > 0 &&
                        selectedProducts.length === filteredProducts.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Assigned At</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingProducts ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : filteredProducts && filteredProducts.length > 0 ? (
                  filteredProducts.map((log) => {
                    const productId = parseInt(log.product_id);
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.includes(productId)}
                            onCheckedChange={(checked) =>
                              handleSelectProduct(productId, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">{log.product_name}</TableCell>
                        <TableCell>{new Date(log.assigned_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-700 border-green-200">
                            {log.status === "success" ? "Active" : log.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-sm text-slate-500">
                      {searchQuery ? "No products match your search." : "No products found for this client."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-500">
              Showing {filteredProducts.length} of {totalCount} products
            </div>
            <div className="flex items-center space-x-4">
              {totalCount > 0 && (
                <>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-500">Items per page:</span>
                    <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-500">
                      Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
