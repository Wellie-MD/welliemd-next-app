import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { productCategoryApi, ProductCategory } from "@/api/productCategories";

interface CategorySelectorProps {
  value?: number | null;
  onChange: (categoryId: number | null) => void;
  disabled?: boolean;
}

export function CategorySelector({
  value,
  onChange,
  disabled = false,
}: CategorySelectorProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await productCategoryApi.listCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch categories on mount to display selected value
    fetchCategories();
  }, []);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      const newCategory = await productCategoryApi.createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
      });

      toast({
        title: "Success",
        description: "Category created successfully",
      });

      // Refresh categories list
      await fetchCategories();

      // Select the newly created category
      onChange(newCategory.id);

      // Reset form
      setNewCategoryName("");
      setNewCategoryDescription("");
      setShowAddForm(false);
    } catch (error: any) {
      console.error("Failed to create category:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create category",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const selectedCategory = categories.find((cat) => cat.id === value);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={disabled}
              >
                {selectedCategory ? selectedCategory.name : "Select category..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <Command>
                <CommandInput placeholder="Search categories..." />
                <CommandEmpty>No category found.</CommandEmpty>
                <CommandGroup className="max-h-[200px] overflow-auto">
                  {categories.map((category) => (
                    <CommandItem
                      key={category.id}
                      value={category.name}
                      onSelect={() => {
                        onChange(category.id === value ? null : category.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === category.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{category.name}</div>
                        {category.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {category.description}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>

              {!showAddForm && (
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Category
                  </Button>
                </div>
              )}

              {showAddForm && (
                <div className="border-t p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Add New Category</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewCategoryName("");
                        setNewCategoryDescription("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-category-name">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="new-category-name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g., Semaglutide"
                      disabled={creating}
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended: clear patient-facing category name.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-category-description">Description</Label>
                    <Textarea
                      id="new-category-description"
                      value={newCategoryDescription}
                      onChange={(e) => setNewCategoryDescription(e.target.value)}
                      placeholder="Optional description"
                      rows={2}
                      disabled={creating}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreateCategory}
                      disabled={creating || !newCategoryName.trim()}
                      className="flex-1"
                    >
                      {creating ? "Creating..." : "Create Category"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewCategoryName("");
                        setNewCategoryDescription("");
                      }}
                      disabled={creating}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            disabled={disabled}
            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
