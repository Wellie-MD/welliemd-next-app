import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  ProductDoseMapping,
  createDoseMapping,
  updateDoseMapping,
  deleteDoseMapping,
} from "@/api/productDoseMappings";
import { CategorySelector } from "./CategorySelector";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DoseMappingFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doseMapping?: ProductDoseMapping | null;
  defaultCategoryId?: number;
  onSuccess: () => void;
}

export function DoseMappingFormModal({
  open,
  onOpenChange,
  doseMapping,
  defaultCategoryId,
  onSuccess,
}: DoseMappingFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: defaultCategoryId || (null as number | null),
    name: "",
    patient_label: "",
    display_order: 0,
  });

  useEffect(() => {
    if (doseMapping) {
      setFormData({
        category: doseMapping.category,
        name: doseMapping.name,
        patient_label: doseMapping.patient_label,
        display_order: doseMapping.display_order,
      });
    } else {
      setFormData({
        category: defaultCategoryId || null,
        name: "",
        patient_label: "",
        display_order: 0,
      });
    }
  }, [doseMapping, defaultCategoryId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category) {
      toast({
        title: "Validation Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim() || !formData.patient_label.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and patient label are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (doseMapping) {
        await updateDoseMapping(doseMapping.id, {
          ...formData,
          name: formData.name.trim(),
          patient_label: formData.patient_label.trim(),
        });
        toast({
          title: "Success",
          description: "Dose mapping updated successfully",
        });
      } else {
        await createDoseMapping({
          ...formData,
          name: formData.name.trim(),
          patient_label: formData.patient_label.trim(),
        } as any);
        toast({
          title: "Success",
          description: "Dose mapping created successfully",
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to save dose mapping:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.detail ||
          error.response?.data?.error ||
          error.response?.data?.patient_label?.[0] ||
          "Failed to save dose mapping",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!doseMapping) return;

    if (
      !confirm(
        `Are you sure you want to delete "${doseMapping.patient_label}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await deleteDoseMapping(doseMapping.id);
      toast({
        title: "Success",
        description: "Dose mapping deleted successfully",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to delete dose mapping:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Failed to delete dose mapping";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {doseMapping ? "Edit Dose Mapping" : "Create Dose Mapping"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {doseMapping && doseMapping.product_count > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This dose mapping is used by {doseMapping.product_count}{" "}
                product(s). Deletion is not allowed.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-red-500">*</span>
            </Label>
            <CategorySelector
              value={formData.category}
              onChange={(category) =>
                setFormData({ ...formData, category })
              }
              disabled={!!doseMapping}
            />
            {doseMapping && (
              <p className="text-xs text-muted-foreground">
                Category cannot be changed after creation
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Internal Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Semaglutide 0.25 mg"
              required
            />
            <p className="text-xs text-muted-foreground">
              Internal technical name for reference
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="patient_label">
              Patient Label <span className="text-red-500">*</span>
            </Label>
            <Input
              id="patient_label"
              value={formData.patient_label}
              onChange={(e) =>
                setFormData({ ...formData, patient_label: e.target.value })
              }
              placeholder="e.g., 0.25 mg"
              required
            />
            <p className="text-xs text-muted-foreground">
              EXACT Step-2 dose text shown to patients. Recommended: dose-only format
              like "0.25 mg" (must be unique).
            </p>
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
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Lower numbers appear first in dropdowns
            </p>
          </div>

          <DialogFooter className="gap-2">
            {doseMapping && doseMapping.product_count === 0 && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : doseMapping ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
