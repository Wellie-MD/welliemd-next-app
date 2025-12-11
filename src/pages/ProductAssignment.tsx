import { useState, useEffect, useMemo, useRef } from "react";
import { ArrowLeft, Search, X, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { productApi } from "@/api/products";
import { clientApi, Client } from "@/api/clientApi";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";

interface ProductForAssignment {
  id: number;
  name: string;
  treatment: string;
  manufacturer_name?: string;
  is_active: boolean;
  base_price?: string;
  rx_or_otc?: string;
  is_modified_need_to_re_assigned?: boolean;
  pharmacy_name?: string;
  category_name?: string;
  beluga_medicine_id?: string;
}

interface PaginatedProductsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProductForAssignment[];
}

const PAGE_SIZE = 20;

export default function ProductAssignment() {
  const navigate = useNavigate();
  const hasFetchedRef = useRef(false);

  // Data states
  const [products, setProducts] = useState<ProductForAssignment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Selection states
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(
    new Set()
  );
  const [selectedClients, setSelectedClients] = useState<Set<string>>(
    new Set()
  );

  // Search states
  const [productSearch, setProductSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");

  // Check if more products available
  const hasMoreProducts = products.length < totalProducts;

  // Initial data fetch - runs only once
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const loadInitialData = async () => {
      try {
        setLoading(true);

        const [productsResponse, clientsData] = await Promise.all([
          axiosInstance.get<PaginatedProductsResponse>("products/", {
            params: { page: 1, page_size: PAGE_SIZE },
          }),
          clientApi.list(),
        ]);

        const productsData = productsResponse.data;
        setProducts(productsData.results || []);
        setTotalProducts(productsData.count || 0);
        setClients(Array.isArray(clientsData) ? clientsData : []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Error",
          description: "Failed to load products and clients",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load more products handler
  const handleLoadMore = async () => {
    if (loadingMore || !hasMoreProducts) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;

      const { data } = await axiosInstance.get<PaginatedProductsResponse>(
        "products/",
        {
          params: { page: nextPage, page_size: PAGE_SIZE },
        }
      );

      setProducts((prev) => [...prev, ...(data.results || [])]);
      setTotalProducts(data.count || 0);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error("Failed to load more products:", error);
      toast({
        title: "Error",
        description: "Failed to load more products",
        variant: "destructive",
      });
    } finally {
      setLoadingMore(false);
    }
  };

  // Filter products based on search (multi-field: name, pharmacy, category, MedID)
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const search = productSearch.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(search) ||
        product.treatment?.toLowerCase().includes(search) ||
        product.manufacturer_name?.toLowerCase().includes(search) ||
        product.pharmacy_name?.toLowerCase().includes(search) ||
        product.category_name?.toLowerCase().includes(search) ||
        product.beluga_medicine_id?.toLowerCase().includes(search)
    );
  }, [products, productSearch]);

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const search = clientSearch.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(search) ||
        client.user?.email?.toLowerCase().includes(search) ||
        client.user?.full_name?.toLowerCase().includes(search)
    );
  }, [clients, clientSearch]);

  // Selection handlers
  const toggleProduct = (productId: number) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const toggleClient = (clientId: string) => {
    setSelectedClients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const selectAllProducts = () => {
    setSelectedProducts(new Set(filteredProducts.map((p) => p.id)));
  };

  const deselectAllProducts = () => {
    setSelectedProducts(new Set());
  };

  const selectAllClients = () => {
    setSelectedClients(new Set(filteredClients.map((c) => c.id)));
  };

  const deselectAllClients = () => {
    setSelectedClients(new Set());
  };

  const clearAllSelections = () => {
    setSelectedProducts(new Set());
    setSelectedClients(new Set());
  };

  // Handle assignment
  const handleAssign = async () => {
    if (selectedProducts.size === 0 || selectedClients.size === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one product and one client",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const result = await productApi.bulkAssign({
        product_ids: Array.from(selectedProducts),
        client_ids: Array.from(selectedClients),
      });

      if (result.success_count > 0) {
        toast({
          title: "Success",
          description:
            result.message ||
            `Assigned ${result.success_count} product(s) successfully`,
        });
        clearAllSelections();
      } else {
        toast({
          title: "Assignment Failed",
          description: result.message || "All assignments failed",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      console.error("Assignment error:", error);
      toast({
        title: "Error",
        description:
          error?.response?.data?.error ||
          error?.response?.data?.client_ids?.[0] ||
          "Failed to assign products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle re-assignment
  const handleReAssign = async () => {
    if (selectedProducts.size === 0 || selectedClients.size === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one product and one client",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const result = await productApi.reAssignProducts({
        product_ids: Array.from(selectedProducts),
        client_ids: Array.from(selectedClients),
      });

      if (result.successful > 0) {
        toast({
          title: "Success",
          description: `Re-assigned ${
            result.successful
          } product(s) successfully${
            result.failed > 0 ? `, ${result.failed} failed` : ""
          }`,
        });
        clearAllSelections();

        // Refresh products
        setCurrentPage(1);
        const { data } = await axiosInstance.get<PaginatedProductsResponse>(
          "products/",
          {
            params: { page: 1, page_size: PAGE_SIZE },
          }
        );
        setProducts(data.results || []);
        setTotalProducts(data.count || 0);
      } else {
        toast({
          title: "Re-assignment Failed",
          description: "All re-assignments failed. Please check the logs.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      console.error("Re-assignment error:", error);
      toast({
        title: "Error",
        description:
          error?.response?.data?.error || "Failed to re-assign products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format treatment for display
  const formatTreatment = (treatment: string): string => {
    return treatment
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Loading state
  if (loading && products.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard/products")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Assign Products to Clients</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select products and clients to create assignments
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleAssign}
            disabled={
              selectedProducts.size === 0 ||
              selectedClients.size === 0 ||
              loading
            }
            size="lg"
          >
            Assign Products
          </Button>
          <Button
            onClick={handleReAssign}
            disabled={
              selectedProducts.size === 0 ||
              selectedClients.size === 0 ||
              loading
            }
            size="lg"
            variant="secondary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Re-assign
          </Button>
        </div>
      </div>

      {/* Selection Summary */}
      {(selectedProducts.size > 0 || selectedClients.size > 0) && (
        <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              {selectedProducts.size} product(s) selected •{" "}
              {selectedClients.size} client(s) selected
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={clearAllSelections}>
            Clear All
          </Button>
        </div>
      )}

      {/* Dual List Transfer Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Products List */}
        <div className="border rounded-lg bg-white shadow-sm flex flex-col">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Products</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllProducts}
                  disabled={filteredProducts.length === 0}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectAllProducts}
                  disabled={selectedProducts.size === 0}
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search by name, pharmacy, category, or MedID..."
                className="pl-9 pr-9"
              />
              {productSearch && (
                <button
                  onClick={() => setProductSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="h-[400px] overflow-y-auto">
            <div className="p-2">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {productSearch
                    ? "No products found"
                    : "No products available"}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedProducts.has(product.id)
                          ? "bg-blue-50 border-2 border-blue-500"
                          : "hover:bg-gray-50 border-2 border-transparent"
                      }`}
                    >
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={() => toggleProduct(product.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-medium text-sm truncate">
                            {product.name}
                          </p>
                          {product.is_active && (
                            <Badge variant="default" className="text-xs">
                              Active
                            </Badge>
                          )}
                          {product.rx_or_otc && (
                            <Badge
                              variant="outline"
                              className="text-xs uppercase"
                            >
                              {product.rx_or_otc}
                            </Badge>
                          )}
                          {product.is_modified_need_to_re_assigned && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    UPDATED
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>You have updated this product.</p>
                                  <p>
                                    You need to re-assign it to clients to push
                                    the updates.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatTreatment(product.treatment)}
                        </p>
                        {product.pharmacy_name && (
                          <p className="text-xs text-muted-foreground">
                            Pharmacy: {product.pharmacy_name}
                          </p>
                        )}
                        {product.category_name && (
                          <p className="text-xs text-muted-foreground">
                            Category: {product.category_name}
                          </p>
                        )}
                        {product.manufacturer_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {product.manufacturer_name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Load More Button */}
          {hasMoreProducts && !productSearch && (
            <div className="px-3 py-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  `Load More Products (${products.length} of ${totalProducts})`
                )}
              </Button>
            </div>
          )}

          <div className="p-3 border-t bg-gray-50 text-sm text-muted-foreground">
            {selectedProducts.size} of {filteredProducts.length} selected
            {totalProducts > 0 && !productSearch && (
              <span className="ml-2 text-xs">
                • {products.length} of {totalProducts} loaded
              </span>
            )}
          </div>
        </div>

        {/* Clients List */}
        <div className="border rounded-lg bg-white shadow-sm flex flex-col">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Clients</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllClients}
                  disabled={filteredClients.length === 0}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectAllClients}
                  disabled={selectedClients.size === 0}
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Search clients..."
                className="pl-9 pr-9"
              />
              {clientSearch && (
                <button
                  onClick={() => setClientSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="h-[400px] overflow-y-auto">
            <div className="p-2">
              {filteredClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {clientSearch ? "No clients found" : "No clients available"}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => toggleClient(client.id)}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedClients.has(client.id)
                          ? "bg-blue-50 border-2 border-blue-500"
                          : "hover:bg-gray-50 border-2 border-transparent"
                      }`}
                    >
                      <Checkbox
                        checked={selectedClients.has(client.id)}
                        onCheckedChange={() => toggleClient(client.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">
                            {client.name}
                          </p>
                          {client.is_active && (
                            <Badge variant="default" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        {client.user && (
                          <>
                            <p className="text-xs text-muted-foreground truncate">
                              {client.user.full_name ||
                                `${client.user.first_name} ${client.user.last_name}`}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {client.user.email}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-3 border-t bg-gray-50 text-sm text-muted-foreground">
            {selectedClients.size} of {filteredClients.length} selected
          </div>
        </div>
      </div>
    </div>
  );
}
