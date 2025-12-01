import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { listDoseMappings, ProductDoseMapping } from "@/api/productDoseMappings";
import { DoseMappingFormModal } from "./DoseMappingFormModal";

interface DoseMappingSelectorProps {
  categoryId?: number | null;
  value?: number | null;
  onChange: (value: number | null) => void;
  allowCreate?: boolean;
  disabled?: boolean;
}

export function DoseMappingSelector({
  categoryId,
  value,
  onChange,
  allowCreate = true,
  disabled = false,
}: DoseMappingSelectorProps) {
  const [doseMappings, setDoseMappings] = useState<ProductDoseMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Fetch dose mappings when category changes
  useEffect(() => {
    const fetchDoseMappings = async () => {
      if (!categoryId) {
        setDoseMappings([]);
        return;
      }

      setLoading(true);
      try {
        const response = await listDoseMappings({
          category: categoryId,
          page_size: 100,
        });
        setDoseMappings(response.results || []);
      } catch (error) {
        console.error("Failed to fetch dose mappings:", error);
        setDoseMappings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDoseMappings();
  }, [categoryId]);

  const handleCreateSuccess = () => {
    // Refresh dose mappings after creation
    if (categoryId) {
      listDoseMappings({ category: categoryId, page_size: 100 }).then(
        (response) => {
          setDoseMappings(response.results || []);
        }
      );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select
          value={value?.toString() || ""}
          onValueChange={(val) => onChange(val ? parseInt(val) : null)}
          disabled={disabled || !categoryId || loading}
        >
          <SelectTrigger className="flex-1">
            <SelectValue
              placeholder={
                !categoryId
                  ? "Select category first"
                  : loading
                  ? "Loading..."
                  : "Select dose mapping"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {doseMappings.map((mapping) => (
              <SelectItem key={mapping.id} value={mapping.id.toString()}>
                <div className="flex flex-col">
                  <span className="font-medium">{mapping.patient_label}</span>
                  <span className="text-xs text-muted-foreground">
                    {mapping.name}
                  </span>
                </div>
              </SelectItem>
            ))}
            {doseMappings.length === 0 && !loading && (
              <div className="p-2 text-sm text-muted-foreground text-center">
                No dose mappings found
              </div>
            )}
          </SelectContent>
        </Select>

        {allowCreate && categoryId && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setCreateModalOpen(true)}
            disabled={disabled}
            title="Create new dose mapping"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {allowCreate && (
        <DoseMappingFormModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          defaultCategoryId={categoryId || undefined}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
