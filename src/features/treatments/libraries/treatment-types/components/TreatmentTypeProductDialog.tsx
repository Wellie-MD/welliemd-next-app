import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { productConfigurationApi } from "@/features/treatments/api/productConfigurationApi";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatmentTypeId: string;
  treatmentTypeName: string;
  onSaved: () => Promise<unknown> | unknown;
};

export function TreatmentTypeProductDialog({
  open,
  onOpenChange,
  treatmentTypeId,
  treatmentTypeName,
  onSaved,
}: Props) {
  const [productId, setProductId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const { data: products = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["products", "treatment-type-configuration"],
    queryFn: () => productConfigurationApi.list({ page_size: 500, is_active: true }),
    enabled: open,
  });
  const selectableProducts = useMemo(
    () => products.filter((product) => product.product_type !== "supply"),
    [products],
  );

  useEffect(() => {
    if (!open) {
      setProductId("");
      setSaveError("");
    }
  }, [open]);

  const save = async () => {
    if (!productId) return;
    setSaving(true);
    setSaveError("");
    try {
      await productConfigurationApi.assignTreatmentType(productId, treatmentTypeId);
      await onSaved();
      onOpenChange(false);
    } catch {
      setSaveError("The Treatment Type assignment could not be saved. Review the product and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Product Treatment Type</DialogTitle>
          <DialogDescription>
            Assign a product to {treatmentTypeName}. This clinical relationship is independent of legacy visit restrictions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="treatment-type-product">Product</Label>
            <Select value={productId} onValueChange={setProductId} disabled={isLoading || saving}>
              <SelectTrigger id="treatment-type-product">
                <SelectValue placeholder={isLoading ? "Loading products…" : "Select a product"} />
              </SelectTrigger>
              <SelectContent>
                {selectableProducts.map((product) => (
                  <SelectItem key={product.id} value={String(product.id)}>
                    {product.name}{product.treatment_type_name ? ` — ${product.treatment_type_name}` : " — Unassigned"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isError && (
            <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Products could not be loaded.
              <Button type="button" size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
            </div>
          )}
          {saveError && <p className="text-sm text-red-600" role="alert">{saveError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="button" onClick={save} disabled={!productId || saving}>
              {saving ? "Saving…" : "Save assignment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
