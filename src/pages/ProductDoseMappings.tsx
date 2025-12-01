import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  listDoseMappings,
  ProductDoseMapping,
} from "@/api/productDoseMappings";
import { DoseMappingFormModal } from "@/components/products/DoseMappingFormModal";
import { productCategoryApi } from "@/api/productCategories";

export default function ProductDoseMappings() {
  const [doseMappings, setDoseMappings] = useState<ProductDoseMapping[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<ProductDoseMapping | null>(null);

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
  const fetchDoseMappings = async () => {
    setLoading(true);
    try {
      const params: any = { page_size: 100 };
      if (categoryFilter && categoryFilter !== "all") {
        params.category = parseInt(categoryFilter);
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await listDoseMappings(params);
      setDoseMappings(response.results || []);
    } catch (error) {
      console.error("Failed to fetch dose mappings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch dose mappings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoseMappings();
  }, [categoryFilter, searchQuery]);

  const handleCreate = () => {
    setSelectedMapping(null);
    setModalOpen(true);
  };

  const handleEdit = (mapping: ProductDoseMapping) => {
    setSelectedMapping(mapping);
    setModalOpen(true);
  };

  const handleSuccess = () => {
    fetchDoseMappings();
  };

  return (
    <div className="p-6 space-y-6">
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

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or patient label..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient Label</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Internal Name</TableHead>
              <TableHead className="text-center">Display Order</TableHead>
              <TableHead className="text-center">Products Using</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : doseMappings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="text-muted-foreground">
                    No dose mappings found
                  </div>
                  <Button
                    variant="link"
                    onClick={handleCreate}
                    className="mt-2"
                  >
                    Create your first dose mapping
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              doseMappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell className="font-medium">
                    {mapping.patient_label}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{mapping.category_name}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {mapping.name}
                  </TableCell>
                  <TableCell className="text-center">
                    {mapping.display_order}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        mapping.product_count > 0 ? "default" : "secondary"
                      }
                    >
                      {mapping.product_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(mapping)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Modal */}
      <DoseMappingFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        doseMapping={selectedMapping}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
