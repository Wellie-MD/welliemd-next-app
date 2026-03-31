import React, { useState, useEffect, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';

type Product = { id: string; name: string; base_price?: number; product_type?: string }

type CategoryFilter = {
  type: 'all' | 'product_type' | 'rx_or_otc' | 'category';
  key?: string;
  label: string;
}

interface ProductSelectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProductIds: string[];
  onSelectionChange: (productIds: string[]) => void;
  categoryFilter?: CategoryFilter;
}

export function ProductSelectionSheet({
  open,
  onOpenChange,
  selectedProductIds,
  onSelectionChange,
  categoryFilter,
}: ProductSelectionSheetProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [localSelected, setLocalSelected] = useState<Set<string>>(new Set(selectedProductIds));

  // Reset local selection when prop changes
  useEffect(() => {
    setLocalSelected(new Set(selectedProductIds));
  }, [selectedProductIds]);

  // Fetch products with lazy loading
  const fetchProducts = useCallback(async (pageNum: number, search: string, reset: boolean = false) => {
    setLoading(true);
    try {
      let url = `/products/?page=${pageNum}&page_size=20`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      // Apply category filter
      if (categoryFilter?.type === 'product_type' && categoryFilter.key) {
        url += `&product_type=${categoryFilter.key}`;
      } else if (categoryFilter?.type === 'rx_or_otc' && categoryFilter.key) {
        url += `&rx_or_otc=${categoryFilter.key}`;
      } else if (categoryFilter?.type === 'category' && categoryFilter.key) {
        url += `&category=${categoryFilter.key}`;
      }

      const res = await axiosInstance.get(url);
      const newProducts = res.data?.results || res.data || [];
      
      if (reset) {
        setProducts(newProducts);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }
      
      setHasMore(res.data?.next !== null);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  // Initial fetch when sheet opens
  useEffect(() => {
    if (open) {
      setPage(1);
      setProducts([]);
      fetchProducts(1, searchTerm, true);
    }
  }, [open, categoryFilter, fetchProducts]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (open) {
        setPage(1);
        fetchProducts(1, searchTerm, true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, open, fetchProducts]);

  // Handle scroll for lazy loading
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100 && !loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, searchTerm);
    }
  };

  const toggleProduct = (productId: string) => {
    setLocalSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleApply = () => {
    onSelectionChange(Array.from(localSelected));
    onOpenChange(false);
  };

  const selectAll = () => {
    setLocalSelected(new Set(products.map(p => p.id)));
  };

  const clearAll = () => {
    setLocalSelected(new Set());
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-lg w-full">
        <SheetHeader>
          <SheetTitle>
            {categoryFilter?.label || 'Select Products'}
          </SheetTitle>
          <SheetDescription>
            Choose products to include in this coupon.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Select/Clear All */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{localSelected.size} selected</span>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-blue-600 dark:text-blue-400 hover:underline">Select all</button>
              <button onClick={clearAll} className="text-red-600 dark:text-red-400 hover:underline">Clear</button>
            </div>
          </div>

          {/* Product List */}
          <ScrollArea 
            className="h-[calc(100vh-320px)] border rounded-lg dark:border-slate-700"
            onScrollCapture={handleScroll}
          >
            <div className="p-4 space-y-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                  onClick={() => toggleProduct(product.id)}
                >
                  <Checkbox
                    checked={localSelected.has(product.id)}
                    onCheckedChange={() => toggleProduct(product.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-foreground">{product.name}</div>
                    {product.base_price && (
                      <div className="text-xs text-muted-foreground">
                        ${Number(product.base_price).toFixed(2)}
                      </div>
                    )}
                  </div>
                  {product.product_type && (
                    <span className="text-xs bg-gray-100 dark:bg-slate-800 dark:text-slate-200 px-2 py-1 rounded">
                      {product.product_type}
                    </span>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {!loading && products.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No products found
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Apply Button */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleApply}>
              Apply ({localSelected.size} products)
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
