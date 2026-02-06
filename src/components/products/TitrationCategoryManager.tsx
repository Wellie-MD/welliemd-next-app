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
import { titrationCategoryApi, TitrationCategory } from "@/api/titrationCategories";

interface TitrationCategoryManagerProps {
  value?: number | null;
  onChange: (categoryId: number | null) => void;
  disabled?: boolean;
}

export function TitrationCategoryManager({
  value,
  onChange,
  disabled = false,
}: TitrationCategoryManagerProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<TitrationCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryCode, setNewCategoryCode] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await titrationCategoryApi.listCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch titration categories:", error);
      toast({
        title: "Error",
        description: "Failed to load titration categories",
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

    if (!newCategoryCode.trim()) {
      toast({
        title: "Validation Error",
        description: "Category code is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      const newCategory = await titrationCategoryApi.createCategory({
        name: newCategoryName.trim(),
        code: newCategoryCode.trim().toLowerCase(),
        description: newCategoryDescription.trim() || undefined,
        display_order: categories.length + 1,
      });

      toast({
        title: "Success",
        description: "Titration category created successfully",
      });

      // Refresh categories list
      await fetchCategories();

      // Select the newly created category
      onChange(newCategory.id);

      // Reset form
      setNewCategoryName("");
      setNewCategoryCode("");
      setNewCategoryDescription("");
      setShowAddForm(false);
    } catch (error: any) {
      console.error("Failed to create titration category:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create titration category",
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
                {selectedCategory ? selectedCategory.name : "Select regimen"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <Command>
                <CommandInput placeholder="Search regimens..." />
                <CommandEmpty>No regimen found.</CommandEmpty>
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
                        <div className="text-xs text-muted-foreground">
                          Code: {category.code}
                        </div>
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
                    Add New Regimen
                  </Button>
                </div>
              )}

              {showAddForm && (
                <div className="border-t p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Add New Regimen</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewCategoryName("");
                        setNewCategoryCode("");
                        setNewCategoryDescription("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-regimen-name">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="new-regimen-name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g., Alternative Regimen"
                      disabled={creating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-regimen-code">
                      Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="new-regimen-code"
                      value={newCategoryCode}
                      onChange={(e) => setNewCategoryCode(e.target.value)}
                      placeholder="e.g., alternative"
                      disabled={creating}
                    />
                    <p className="text-xs text-muted-foreground">
                      Lowercase identifier used in API calls. Recommended:
                      `alternative`, `rapid`, `biweekly`.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-regimen-description">Description</Label>
                    <Textarea
                      id="new-regimen-description"
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
                      disabled={creating || !newCategoryName.trim() || !newCategoryCode.trim()}
                      className="flex-1"
                    >
                      {creating ? "Creating..." : "Create Regimen"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewCategoryName("");
                        setNewCategoryCode("");
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
