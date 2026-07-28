import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CheckoutProductOption, CustomProgramFlowItem } from "@/features/treatments/types";

interface CheckoutOverrideEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CustomProgramFlowItem | null;
  option?: CheckoutProductOption;
  onSave: (item: CustomProgramFlowItem, option: CheckoutProductOption) => void;
}

export function CheckoutOverrideEditDialog({
  open,
  onOpenChange,
  item,
  option,
  onSave,
}: CheckoutOverrideEditDialogProps) {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [regimen, setRegimen] = useState("");
  const [dose, setDose] = useState("");
  const [price, setPrice] = useState("");
  const [treatmentTypeKey, setTreatmentTypeKey] = useState("");

  useEffect(() => {
    if (!open || !item) return;
    setProductName(option?.productName || item.title.replace(/^Checkout\s*-\s*/i, ""));
    setCategory(option?.category || "General");
    setRegimen(option?.regimen || "Standard Regimen");
    setDose(option?.dose || "");
    setPrice(String(option?.price ?? ""));
    setTreatmentTypeKey(option?.treatmentTypeKey || item.treatmentTypeKey || "");
  }, [item, open, option]);

  if (!item || !option) return null;

  const handleSave = () => {
    const normalizedPrice = Number(price);
    const nextOption: CheckoutProductOption = {
      ...option,
      productName: productName.trim(),
      category: category.trim(),
      regimen: regimen.trim(),
      dose: dose.trim(),
      price: Number.isFinite(normalizedPrice) ? normalizedPrice : 0,
      treatmentTypeKey: treatmentTypeKey.trim(),
    };
    onSave(
      {
        ...item,
        title: `Checkout - ${nextOption.productName}`,
        subtitle: `${nextOption.category} (${nextOption.dose}) at $${nextOption.price}/mo.`,
        treatmentTypeKey: nextOption.treatmentTypeKey,
        sourceId: nextOption.id,
      },
      nextOption
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Plan-Level Checkout Override</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <label className="col-span-2 space-y-1.5">
            <Label>Product name</Label>
            <Input value={productName} onChange={(event) => setProductName(event.target.value)} />
          </label>
          <label className="space-y-1.5">
            <Label>Category</Label>
            <Input value={category} onChange={(event) => setCategory(event.target.value)} />
          </label>
          <label className="space-y-1.5">
            <Label>Treatment type</Label>
            <Input value={treatmentTypeKey} onChange={(event) => setTreatmentTypeKey(event.target.value)} />
          </label>
          <label className="space-y-1.5">
            <Label>Regimen</Label>
            <Input value={regimen} onChange={(event) => setRegimen(event.target.value)} />
          </label>
          <label className="space-y-1.5">
            <Label>Dose</Label>
            <Input value={dose} onChange={(event) => setDose(event.target.value)} />
          </label>
          <label className="col-span-2 space-y-1.5">
            <Label>Monthly price</Label>
            <Input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!productName.trim()} onClick={handleSave}>Save Override</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
