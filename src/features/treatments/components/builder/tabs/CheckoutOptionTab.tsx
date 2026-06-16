import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Plus, Loader2 } from "lucide-react";
import { productApi, type Product } from "@/api/products";
import { useTreatmentTypes } from "../../../hooks/useTreatmentLibraries";
import type { CheckoutProductOption } from "../../../types";

interface CheckoutOptionTabProps {
  onAddItem: (item: {
    kind: "checkout";
    title: string;
    subtitle: string;
    treatmentTypeKey: string;
    checkoutOption: Omit<CheckoutProductOption, "id">;
  }) => void;
}

export function CheckoutOptionTab({ onAddItem }: CheckoutOptionTabProps) {
  const { data: treatmentTypes = [] } = useTreatmentTypes();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [checkoutTxType, setCheckoutTxType] = useState<string>("glp_weight_loss");
  const [checkoutPrice, setCheckoutPrice] = useState<string>("");
  const [checkoutRegimen, setCheckoutRegimen] = useState<string>("Standard Regimen");
  const [checkoutDose, setCheckoutDose] = useState<string>("1 Unit");
  const [checkoutCategory, setCheckoutCategory] = useState<string>("General");
  const [checkoutProdName, setCheckoutProdName] = useState<string>("");

  useEffect(() => {
    productApi
      .listProducts({ is_admin_product: true })
      .then((data) => {
        setProducts(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load products for checkout option tab:", err);
        setLoading(false);
      });
  }, []);

  // Sync details when selected product changes
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id.toString() === selectedProductId.toString());
  }, [products, selectedProductId]);

  useEffect(() => {
    if (selectedProduct) {
      setCheckoutProdName(selectedProduct.name || "");
      setCheckoutCategory(selectedProduct.category_name || "General");
      setCheckoutDose(selectedProduct.dose_mapping_label || selectedProduct.rx_drug_strength || "1 Unit");
      setCheckoutRegimen(selectedProduct.titration_category_name || "Standard Regimen");
      setCheckoutPrice(selectedProduct.base_price || "0.00");
    } else {
      setCheckoutProdName("");
      setCheckoutCategory("General");
      setCheckoutDose("1 Unit");
      setCheckoutRegimen("Standard Regimen");
      setCheckoutPrice("");
    }
  }, [selectedProduct]);

  // Determine active visit types for chosen treatment mapping
  const targetVisitTypes = useMemo(() => {
    const tx = treatmentTypes.find((t) => t.key === checkoutTxType);
    if (!tx) {
      if (checkoutTxType === "glp_weight_loss") return ["weightloss", "weightlossFollowup"];
      if (checkoutTxType === "ed") return ["ED", "EDFollowup"];
      if (checkoutTxType === "trt") return ["TRT", "TRTFollowup"];
      return [];
    }
    const types = [];
    if (tx.intakeVisitType) types.push(tx.intakeVisitType);
    if (tx.followupVisitType) types.push(tx.followupVisitType);
    return types;
  }, [checkoutTxType, treatmentTypes]);

  // Incompatibility Warning calculation
  const isCompatible = useMemo(() => {
    if (!selectedProduct) return true;
    const restrict = selectedProduct.restrict_visit_types || false;
    if (!restrict) return true;
    const allowed = selectedProduct.allowed_visit_types || [];
    if (allowed.length === 0) return false;
    return targetVisitTypes.some((vt) => allowed.includes(vt));
  }, [selectedProduct, targetVisitTypes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !checkoutProdName || !isCompatible) return;

    onAddItem({
      kind: "checkout",
      title: `Checkout - ${checkoutProdName}`,
      subtitle: `${checkoutCategory} (${checkoutDose}) at $${checkoutPrice}/mo.`,
      treatmentTypeKey: checkoutTxType,
      checkoutOption: {
        productId: selectedProductId,
        treatmentTypeKey: checkoutTxType,
        category: checkoutCategory,
        regimen: checkoutRegimen,
        dose: checkoutDose,
        productName: checkoutProdName,
        price: parseFloat(checkoutPrice) || 0,
        visibilitySummary: `Shown when ${checkoutTxType.replace(/_/g, " ")} is recommended.`,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-500 text-sm">
        <Loader2 className="h-6 w-6 animate-spin mb-2 text-[#12517A]" />
        Loading product records...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="font-bold text-slate-900 text-sm">Add Checkout Option</h3>

      <div className="space-y-2">
        <Label htmlFor="productSelect">Select Product Record</Label>
        <select
          id="productSelect"
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none bg-white h-10"
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          required
        >
          <option value="">-- Select Product --</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.rx_drug_strength ? `(${p.rx_drug_strength})` : ""} - ${p.base_price || "0.00"}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="txType">Treatment Type Mapping</Label>
        <select
          id="txType"
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none bg-white h-10"
          value={checkoutTxType}
          onChange={(e) => setCheckoutTxType(e.target.value)}
        >
          <option value="glp_weight_loss">GLP Weight Loss</option>
          <option value="ed">ED</option>
          <option value="trt">TRT</option>
          {treatmentTypes
            .filter((t) => t.key !== "glp_weight_loss" && t.key !== "ed" && t.key !== "trt")
            .map((t) => (
              <option key={t.key} value={t.key}>
                {t.name}
              </option>
            ))}
        </select>
      </div>

      {selectedProduct && (
        <div className="space-y-4 border-t border-slate-100 pt-4">
          {!isCompatible && (
            <Alert className="bg-amber-50 border-amber-200 text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-700 mt-0.5" />
              <AlertDescription className="text-xs text-amber-800 ml-2">
                <strong>Incompatible Visit Type restriction:</strong> This product restricts visit types to{" "}
                <code>{(selectedProduct.allowed_visit_types || []).join(", ")}</code>, but the chosen mapping{" "}
                <code>{checkoutTxType}</code> uses <code>{targetVisitTypes.join(", ")}</code>.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="prodName">Product Name</Label>
            <Input id="prodName" value={checkoutProdName} onChange={(e) => setCheckoutProdName(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="prodCategory">Category</Label>
              <Input id="prodCategory" value={checkoutCategory} onChange={(e) => setCheckoutCategory(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prodDose">Dose</Label>
              <Input id="prodDose" value={checkoutDose} onChange={(e) => setCheckoutDose(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="prodRegimen">Regimen</Label>
              <Input id="prodRegimen" value={checkoutRegimen} onChange={(e) => setCheckoutRegimen(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prodPrice">Price ($/mo)</Label>
              <Input
                id="prodPrice"
                type="number"
                value={checkoutPrice}
                onChange={(e) => setCheckoutPrice(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      )}

      <Button
        type="submit"
        disabled={!selectedProductId || !isCompatible}
        className="w-full bg-[#12517A] text-white hover:bg-[#12517A]/90 disabled:opacity-50"
      >
        <Plus className="mr-2 h-4 w-4" /> Add Checkout Item
      </Button>
    </form>
  );
}
