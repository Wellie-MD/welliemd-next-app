import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  titrationCategoryApi,
  TitrationCategory,
} from "@/api/titrationCategories";
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

export function TitrationCategoryTab() {
  const [categories, setCategories] = useState<TitrationCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TitrationCategory | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    display_order: 0,
  });
  const [saving, setSaving] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<TitrationCategory | null>(null);

  const fetchCategories = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      // Assuming client-side pagination for now as API returns all
      const data = await titrationCategoryApi.listCategories();
      
      let filtered = data;
      if (searchQuery) {
        filtered = data.filter(cat => 
          cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.code.toLowerCase().includes(searchQuery.toLowerCase())
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
      console.error("Failed to fetch titration categories:", error);
      toast({
        title: "Error",
        description: "Failed to fetch titration categories",
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
    setFormData({
      name: "",
      code: "",
      description: "",
      display_order: totalCount + 1,
    });
    setModalOpen(true);
  };

  const handleEdit = (category: TitrationCategory) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      code: category.code,
      description: category.description || "",
      display_order: category.display_order,
    });
    setModalOpen(true);
  };

  const confirmDelete = (category: TitrationCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await titrationCategoryApi.deleteCategory(categoryToDelete.id);
      toast({
        title: "Success",
        description: "Titration category deleted successfully",
      });
      fetchCategories(currentPage);
    } catch (error: any) {
      console.error("Failed to delete titration category:", error);
      toast({
        title: "Error",
        description: "Failed to delete titration category",
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
    if (!formData.code.trim()) {
      toast({
        title: "Validation Error",
        description: "Code is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (selectedCategory) {
        await titrationCategoryApi.updateCategory(selectedCategory.id, formData);
        toast({
          title: "Success",
          description: "Titration category updated successfully",
        });
      } else {
        await titrationCategoryApi.createCategory(formData);
        toast({
          title: "Success",
          description: "Titration category created successfully",
        });
      }
      setModalOpen(false);
      fetchCategories(currentPage);
    } catch (error: any) {
      console.error("Failed to save titration category:", error);
      toast({
        title: "Error",
        description: "Failed to save titration category",
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
      key: "code",
      label: "Code",
      className: "font-mono text-xs",
    },
    {
      key: "description",
      label: "Description",
    },
    {
      key: "display_order",
      label: "Display Order",
      className: "text-center",
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (_: any, row: any) => (
        <div className="flex justify-start gap-2">
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
          <h1 className="text-3xl font-bold">Titration Categories</h1>
          <p className="text-muted-foreground mt-1">
            Manage titration categories
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Titration Category
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        data={categories}
        columns={columns}
        searchPlaceholder="Search by name or code..."
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
              {selectedCategory ? "Edit Titration Category" : "Create Titration Category"}
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
                placeholder="e.g., Standard Titration"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">
                Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="e.g., standard"
                required
                disabled={!!selectedCategory}
              />
              {selectedCategory && (
                <p className="text-xs text-muted-foreground">
                  Code cannot be changed after creation
                </p>
              )}
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
            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    display_order: parseInt(e.target.value) || 0,
                  })
                }
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
              This action cannot be undone. This will permanently delete the titration category
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
