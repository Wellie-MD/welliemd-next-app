import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  listDoseMappings,
  ProductDoseMapping,
  deleteDoseMapping,
} from "@/api/productDoseMappings";
import { DoseMappingFormModal } from "@/components/products/DoseMappingFormModal";
import { productCategoryApi } from "@/api/productCategories";
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

export function DoseMappingTab() {
  const [doseMappings, setDoseMappings] = useState<ProductDoseMapping[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<ProductDoseMapping | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState<ProductDoseMapping | null>(null);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productCategoryApi.listCategories();
        setCategories(response || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch dose mappings
  const fetchDoseMappings = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const params: any = { 
        page, 
        page_size: pageSize 
      };
      
      if (categoryFilter && categoryFilter !== "all") {
        params.category = parseInt(categoryFilter);
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await listDoseMappings(params);
      
      if (response && response.results) {
        setDoseMappings(response.results);
        setTotalCount(response.count);
        setTotalPages(Math.ceil(response.count / pageSize));
        setCurrentPage(page);
      } else {
        setDoseMappings([]);
        setTotalCount(0);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Failed to fetch dose mappings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch dose mappings",
        variant: "destructive",
      });
      setDoseMappings([]);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, searchQuery, pageSize]);

  useEffect(() => {
    fetchDoseMappings(1);
  }, [fetchDoseMappings]);

  const handleCreate = () => {
    setSelectedMapping(null);
    setModalOpen(true);
  };

  const handleEdit = (mapping: ProductDoseMapping) => {
    setSelectedMapping(mapping);
    setModalOpen(true);
  };

  const confirmDelete = (mapping: ProductDoseMapping) => {
    if (mapping.product_count > 0) {
      toast({
        title: "Cannot Delete",
        description: `This mapping is used by ${mapping.product_count} product(s).`,
        variant: "destructive",
      });
      return;
    }
    setMappingToDelete(mapping);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!mappingToDelete) return;

    try {
      await deleteDoseMapping(mappingToDelete.id);
      toast({
        title: "Success",
        description: "Dose mapping deleted successfully",
      });
      fetchDoseMappings(currentPage);
    } catch (error: any) {
      console.error("Failed to delete dose mapping:", error);
      toast({
        title: "Error",
        description: "Failed to delete dose mapping",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setMappingToDelete(null);
    }
  };

  const handleSuccess = () => {
    fetchDoseMappings(currentPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchDoseMappings(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    // fetchDoseMappings will be triggered by useEffect dependency on pageSize
  };

  const columns = [
    {
      key: "patient_label",
      label: "Patient Label",
      className: "font-medium",
    },
    {
      key: "category_name",
      label: "Category",
      render: (value: any) => <Badge variant="outline">{value}</Badge>,
    },
    {
      key: "name",
      label: "Internal Name",
      className: "text-muted-foreground",
    },
    {
      key: "display_order",
      label: "Display Order",
      className: "text-center",
    },
    {
      key: "product_count",
      label: "Products Using",
      className: "text-center",
      render: (value: number) => (
        <Badge variant={value > 0 ? "default" : "secondary"}>
          {value}
        </Badge>
      ),
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
          <h1 className="text-3xl font-bold">Product Dose Mappings</h1>
          <p className="text-muted-foreground mt-1">
            Manage structured dose mappings for products
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Dose Mapping
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        data={doseMappings}
        columns={columns}
        searchPlaceholder="Search by name or patient label..."
        showResetFilters={false}
        onSearch={setSearchQuery}
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
      <DoseMappingFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        doseMapping={selectedMapping}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the dose mapping
              "{mappingToDelete?.patient_label}".
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
