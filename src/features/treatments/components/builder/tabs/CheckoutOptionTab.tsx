import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Plus, Loader2, Info } from "lucide-react";
import { productApi, type Product } from "@/api/products";
import { useTreatmentTypes } from "../../../hooks/useTreatmentLibraries";
import type { CheckoutProductOption } from "../../../types";
import { toast } from "@/components/ui/use-toast";

interface CheckoutOptionTabProps {
  onAddItem: (item: {
    kind: "checkout";
    title: string;
    subtitle: string;
    treatmentTypeKey: string;
    checkoutOption: Omit<CheckoutProductOption, "id">;
  }) => void;
}

const INHERITED_MODULES = [
  { name: "GLP Weight Loss Intake", count: 3 },
  { name: "GLP Microdose Intake", count: 2 },
  { name: "Branded GLP Intake", count: 3 },
  { name: "TRT Intake", count: 3 },
  { name: "HRT Intake", count: 2 },
  { name: "Menopause Intake", count: 2 },
  { name: "ED Intake", count: 3 },
  { name: "NAD Intake", count: 2 },
  { name: "Sermorelin Intake", count: 2 },
  { name: "Glutathione Intake", count: 1 },
];

const nameToIdMap: Record<string, string> = {
  "GLP Weight Loss Intake": "program-glp-intake",
  "GLP Microdose Intake": "program-glp-microdose",
  "Branded GLP Intake": "program-branded-glp",
  "TRT Intake": "program-trt-intake",
  "HRT Intake": "program-hrt-intake",
  "Menopause Intake": "program-menopause-intake",
  "ED Intake": "program-glp-intake",
  "NAD Intake": "program-nad-intake",
  "Sermorelin Intake": "program-sermorelin",
  "Glutathione Intake": "program-glp-intake",
};

export function CheckoutOptionTab({ onAddItem }: CheckoutOptionTabProps) {
  const { data: treatmentTypes = [] } = useTreatmentTypes();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOverrideForm, setShowOverrideForm] = useState(false);

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
      .catch(() => {
        toast({
          title: "Unable to load products",
          description: "Checkout products could not be loaded. Retry by reopening this drawer.",
          variant: "destructive",
        });
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
    setShowOverrideForm(false);
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
    <div className="space-y-4">
      {/* Info Alert Notice Box */}
      <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 text-[12px] leading-relaxed text-blue-800 flex items-start gap-3">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold block mb-0.5">Checkout questions are owned by Eligibility modules</span>
          When a plan attaches an Eligibility module, that module's Checkout questions are inherited automatically. To add or change them, open the Eligibility module's detail page.
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Inherited from attached Eligibility modules
        </div>

        {INHERITED_MODULES.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm flex justify-between items-center"
          >
            <div>
              <div className="text-xs font-semibold text-slate-700 leading-tight">
                {item.name}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {item.count} Checkout {item.count === 1 ? "question" : "questions"}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] text-blue-600 border-blue-200 hover:bg-blue-50 font-semibold px-3"
              asChild
            >
              <Link to={`/dashboard/treatments/programs/${nameToIdMap[item.name] || "program-glp-intake"}`}>
                Manage &rarr;
              </Link>
            </Button>
          </div>
        ))}
      </div>

      {/* Plan-level Overrides Alert & Form */}
      <div className="rounded-lg bg-amber-50/70 border border-amber-100 p-4 space-y-3">
        <div className="text-[11px] leading-relaxed text-amber-800">
          <span className="font-semibold">Plan-level overrides</span> — rarely needed. Use only when this specific plan should display a product that its Eligibility modules don't route to.
        </div>

        {!showOverrideForm ? (
          <button
            onClick={() => setShowOverrideForm(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-amber-200 rounded-lg text-[11px] font-bold text-amber-700 bg-white hover:bg-amber-50/50 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Add plan-level override
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg border border-amber-200/50 shadow-inner">
            <h4 className="font-bold text-slate-800 text-xs">Add Plan-Level Override</h4>

            <div className="space-y-2">
              <Label htmlFor="productSelect" className="text-[11px]">Select Product Record</Label>
              <select
                id="productSelect"
                className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-xs outline-none bg-white h-9"
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
              <Label htmlFor="txType" className="text-[11px]">Treatment Type Mapping</Label>
              <select
                id="txType"
                className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-xs outline-none bg-white h-9"
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
              <div className="space-y-3 border-t border-slate-100 pt-3">
                {!isCompatible && (
                  <Alert className="bg-amber-50 border-amber-200 text-amber-900 py-2">
                    <AlertTriangle className="h-4 w-4 text-amber-700 mt-0.5" />
                    <AlertDescription className="text-[10px] text-amber-800 ml-2">
                      Incompatible restriction. Allowed: {selectedProduct.allowed_visit_types?.join(", ")}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1">
                  <Label htmlFor="prodName" className="text-[10px]">Product Name</Label>
                  <Input id="prodName" className="h-8 text-xs" value={checkoutProdName} onChange={(e) => setCheckoutProdName(e.target.value)} required />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="prodCategory" className="text-[10px]">Category</Label>
                    <Input id="prodCategory" className="h-8 text-xs" value={checkoutCategory} onChange={(e) => setCheckoutCategory(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="prodDose" className="text-[10px]">Dose</Label>
                    <Input id="prodDose" className="h-8 text-xs" value={checkoutDose} onChange={(e) => setCheckoutDose(e.target.value)} required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="prodRegimen" className="text-[10px]">Regimen</Label>
                    <Input id="prodRegimen" className="h-8 text-xs" value={checkoutRegimen} onChange={(e) => setCheckoutRegimen(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="prodPrice" className="text-[10px]">Price ($/mo)</Label>
                    <Input
                      id="prodPrice"
                      className="h-8 text-xs"
                      type="number"
                      value={checkoutPrice}
                      onChange={(e) => setCheckoutPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowOverrideForm(false)}
                className="flex-1 h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedProductId || !isCompatible}
                size="sm"
                className="flex-1 h-8 text-xs bg-amber-700 hover:bg-amber-800 text-white"
              >
                Add Override
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
