import { useState, useEffect, useCallback } from "react";
import { Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import axiosInstance from "@/api/axiosInstance";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  beluga_medicine_id?: string;
  pharmacy?: string;
  pharmacy_name?: string;
  treatment?: string;
}

interface ProductSelectorProps {
  value?: {
    product_id: string;
    product_name: string;
    pharmacy_id?: string;
    pharmacy_name?: string;
    beluga_medicine_id?: string;
  } | null;
  onChange: (config: {
    product_id: string;
    product_name: string;
    pharmacy_id?: string;
    pharmacy_name?: string;
    beluga_medicine_id?: string;
  } | null) => void;
  disabled?: boolean;
}

export function ProductSelector({ value, onChange, disabled }: ProductSelectorProps) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchProducts = useCallback(async (searchQuery: string = "") => {
    setLoading(true);
    try {
      const params: any = {
        page_size: 50,
        is_active: true,
      };
      
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await axiosInstance.get("/products/", { params });
      const items = response.data?.results || response.data || [];
      setProducts(items);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchProducts(search);
    }
  }, [open, fetchProducts]);

  const handleSearch = useCallback(
    (searchValue: string) => {
      setSearch(searchValue);
      fetchProducts(searchValue);
    },
    [fetchProducts]
  );

  const handleSelect = (product: Product) => {
    onChange({
      product_id: product.id,
      product_name: product.name,
      pharmacy_id: product.pharmacy || undefined,
      pharmacy_name: product.pharmacy_name || undefined,
      beluga_medicine_id: product.beluga_medicine_id || undefined,
    });
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {value ? (
              <span className="truncate">{value.product_name}</span>
            ) : (
              <span className="text-muted-foreground">Select product...</span>
            )}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search products..."
              value={search}
              onValueChange={handleSearch}
            />
            <CommandList>
              {loading ? (
                <div className="py-6 text-center text-sm">Loading...</div>
              ) : (
                <>
                  <CommandEmpty>No products found.</CommandEmpty>
                  <CommandGroup>
                    {products.map((product) => (
                      <CommandItem
                        key={product.id}
                        value={product.id}
                        onSelect={() => handleSelect(product)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value?.product_id === product.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{product.name}</span>
                          {product.pharmacy_name && (
                            <span className="text-xs text-muted-foreground">
                              {product.pharmacy_name}
                            </span>
                          )}
                          {product.beluga_medicine_id && (
                            <span className="text-xs text-muted-foreground">
                              Med ID: {product.beluga_medicine_id}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value && (
        <div className="flex items-center justify-between rounded-md border p-3 text-sm">
          <div className="space-y-1">
            <div className="font-medium">{value.product_name}</div>
            {value.pharmacy_name && (
              <div className="text-xs text-muted-foreground">
                Pharmacy: {value.pharmacy_name}
              </div>
            )}
            {value.beluga_medicine_id && (
              <div className="text-xs text-muted-foreground">
                Beluga Med ID: {value.beluga_medicine_id}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
