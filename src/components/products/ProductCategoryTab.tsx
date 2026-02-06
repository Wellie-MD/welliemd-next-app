import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  productCategoryApi,
  ProductCategory,
} from "@/api/productCategories";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/ui/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ProductCategoryTab() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ProductCategory | null>(null);

  const fetchCategories = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      // Note: The API currently returns all categories, so we'll do client-side pagination for now
      // unless the API supports page_size and page params.
      // Based on previous file reads, it seems to support pagination but returns an array if not paginated?
      // Let's assume standard behavior or client-side fallback.
      
      const data = await productCategoryApi.listCategories();
      
      let filtered = data;
      if (searchQuery) {
        filtered = data.filter(cat => 
          cat.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setTotalCount(filtered.length);
      setTotalPages(Math.ceil(filtered.length / pageSize));
      
      // Client-side pagination slice
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      setCategories(filtered.slice(start, end));
      setCurrentPage(page);

    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, pageSize]);

  useEffect(() => {
    fetchCategories(1);
  }, [fetchCategories]);

  const handleCreate = () => {
    setSelectedCategory(null);
    setFormData({ name: "", description: "" });
    setModalOpen(true);
  };

  const handleEdit = (category: ProductCategory) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setModalOpen(true);
  };

  const confirmDelete = (category: ProductCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await productCategoryApi.deleteCategory(categoryToDelete.id);
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      fetchCategories(currentPage);
    } catch (error: any) {
      console.error("Failed to delete category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (selectedCategory) {
        await productCategoryApi.updateCategory(selectedCategory.id, formData);
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        await productCategoryApi.createCategory(formData);
        toast({
          title: "Success",
          description: "Category created successfully",
        });
      }
      setModalOpen(false);
      fetchCategories(currentPage);
    } catch (error: any) {
      console.error("Failed to save category:", error);
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchCategories(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      className: "font-medium",
    },
    {
      key: "description",
      label: "Description",
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (_: any, row: any) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => confirmDelete(row)}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Categories</h1>
          <p className="text-muted-foreground mt-1">
            Manage product categories used in dynamic selection
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Category
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        data={categories}
        columns={columns}
        searchPlaceholder="Search categories..."
        onSearch={setSearchQuery}
        showResetFilters={false}
        loading={loading}
        pagination={{
          currentPage,
          totalPages,
          pageSize,
          totalCount,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
        }}
      />

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? "Edit Category" : "Create Category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Semaglutide"
                required
              />
              <p className="text-xs text-muted-foreground">
                Use clear names that users recognize.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : selectedCategory ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category
              "{categoryToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
