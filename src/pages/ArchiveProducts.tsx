import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { productApi, assignmentLogApi } from '@/api/products';
import { clientApi } from '@/api/clientApi';
import { Loader2, Archive, RotateCcw, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ArchiveProducts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(30);

  // Fetch clients
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: clientApi.list,
  });

  // Fetch assigned products for selected client with server-side pagination
  const { data: paginationData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['client-products', selectedClient, currentPage, pageSize, searchQuery],
    queryFn: async (): Promise<{ results: any[]; count: number }> => {
      if (!selectedClient) return { results: [], count: 0 };
      // Using assignment logs as proxy for assigned products
      // Server-side pagination - fetch only current page
      const history = await assignmentLogApi.listLogs({ 
        client: selectedClient, 
        status: 'success',
        latest_only: 'true',
        page: currentPage,
        page_size: pageSize
      });
      return history;
    },
    enabled: !!selectedClient,
  });

  const assignedProducts = paginationData?.results || [];
  const totalCount = paginationData?.count || 0;

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: productApi.archiveProducts,
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Success',
          description: data.message || 'Products archived successfully',
        });
        queryClient.invalidateQueries({ queryKey: ['client-products', selectedClient] });
        setSelectedProducts([]);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to archive products',
          variant: 'destructive',
        });
      }
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'An error occurred';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Unarchive mutation
  const unarchiveMutation = useMutation({
    mutationFn: productApi.unarchiveProducts,
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Success',
          description: data.message || 'Products restored successfully',
        });
        queryClient.invalidateQueries({ queryKey: ['client-products', selectedClient] });
        setSelectedProducts([]);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to restore products',
          variant: 'destructive',
        });
      }
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'An error occurred';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Client-side filtering for search
  const filteredProducts = useMemo(() => {
    if (!assignedProducts) return [];
    
    if (!searchQuery) return assignedProducts;
    
    return assignedProducts.filter((log) =>
      log.product_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assignedProducts, searchQuery]);

  // Calculate total pages based on server count
  const totalPages = Math.ceil(totalCount / pageSize);

  // Reset to page 1 when search query or client changes
  React.useEffect(() => {
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
    archiveMutation.mutate({
      product_ids: selectedProducts,
      client_ids: [selectedClient],
    });
  };

  const handleUnarchive = () => {
    if (!selectedClient || selectedProducts.length === 0) return;
    unarchiveMutation.mutate({
      product_ids: selectedProducts,
      client_ids: [selectedClient],
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Archive Products</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Product Archives</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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

          {selectedClient && (
            <div className="space-y-4">
              {/* Search Bar and Action Buttons */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                            <TableCell className="font-medium">
                              {log.product_name}
                            </TableCell>
                            <TableCell>
                              {new Date(log.assigned_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {log.status === 'success' ? 'Active' : log.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          {searchQuery ? 'No products match your search.' : 'No products found for this client.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Count and Pagination Controls */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Showing {filteredProducts.length} of {totalCount} products
                </div>
                <div className="flex items-center space-x-4">
                  {/* Pagination Controls */}
                  {totalCount > 0 && (
                    <>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Items per page:</span>
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
                        <span className="text-sm text-gray-600">
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
        </CardContent>
      </Card>
    </div>
  );
}
