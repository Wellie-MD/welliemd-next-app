import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, X, Trash2, Info, ChevronDown } from "lucide-react";
import type { ProgramCheckoutProduct, ProgramCheckoutQuestion, VisibilityRule } from "../../types";
import { checkoutProductFactory, visibilityRuleFactory } from "../../data/factories";

const PRODUCT_CATEGORIES = [
  'Endomiphene', 'Glutathione', 'Injection Kit', 'Methylcobalamin', 'NAD+', 'Orforglipron',
  'PT-141 - Men', 'PT-141 - Women', 'Semaglutide', 'Sermorelin', 'Sildenafil', 'Syringe',
  'Tadalafil', 'Tesamorelin', 'Tirzepatide', 'TRT', 'Wegovy', 'Zepbound', 'Estradiol', 'Progesterone'
];

const DOSE_MAPPINGS = [
  { label: 'Foundayo 0.8mg', category: 'Orforglipron' },
  { label: 'Glutathione', category: 'Glutathione' },
  { label: 'Glutathione 200mg', category: 'Glutathione' },
  { label: 'NAD+', category: 'NAD+' },
  { label: 'NAD+ 100mg', category: 'NAD+' },
  { label: 'NAD+ 250mg', category: 'NAD+' },
  { label: 'PT-141 - Men', category: 'PT-141 - Men' },
  { label: 'PT-141 - Women', category: 'PT-141 - Women' },
  { label: 'Semaglutide 0.2mg', category: 'Semaglutide' },
  { label: 'Semaglutide 0.2mg Microdosing', category: 'Semaglutide' },
  { label: 'Wegovy 0.25mg', category: 'Semaglutide' },
  { label: 'Wegovy 0.5mg', category: 'Semaglutide' },
  { label: 'Wegovy 1.0mg', category: 'Semaglutide' },
  { label: 'Sermorelin', category: 'Sermorelin' },
  { label: 'Sermorelin 3mg', category: 'Sermorelin' },
  { label: 'Sermorelin 5mg', category: 'Sermorelin' },
  { label: 'Sildenafil Citrate 20mg', category: 'Sildenafil' },
  { label: 'Sildenafil 20mg', category: 'Sildenafil' },
  { label: 'Sertraline 50mg', category: 'Sertraline' },
  { label: 'Sertraline 100mg', category: 'Sertraline' },
  { label: 'Tadalafil 2.5mg', category: 'Tadalafil' },
  { label: 'Tadalafil 5mg', category: 'Tadalafil' },
  { label: 'Tesamorelin', category: 'Tesamorelin' },
  { label: 'Tirzepatide 1.5mg', category: 'Tirzepatide' },
  { label: 'Tirzepatide 1.5mg Microdosing', category: 'Tirzepatide' },
  { label: 'Zepbound 2.5mg', category: 'Tirzepatide' },
  { label: 'Zepbound 5mg', category: 'Tirzepatide' },
  { label: 'TRT', category: 'TRT' },
  { label: 'Testosterone Cypionate 200mg', category: 'TRT' },
  { label: 'Enclomiphene 12.5mg', category: 'Enclomiphene' },
  { label: 'Estradiol 0.5mg', category: 'Estradiol' },
  { label: 'Estradiol 1.0mg', category: 'Estradiol' },
  { label: 'Progesterone 100mg', category: 'Progesterone' }
];

const TITRATION_CATEGORIES = [
  'Alternative Regimen',
  'Rapid Regimen',
  'Twice Weekly Regimen',
  'Standard',
  'Low Dose',
  'Normal Dose'
];

type ProductForm = ProgramCheckoutProduct;
type VisibilityRuleForm = VisibilityRule;

interface CheckoutQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<ProgramCheckoutQuestion, "id">) => void;
  initialQuestion?: ProgramCheckoutQuestion | null;
  programName?: string;
  screeningQuestions?: Array<{ id: string; text: string }>;
}

export function CheckoutQuestionModal({
  open,
  onOpenChange,
  onSave,
  initialQuestion,
  programName = "GLP Microdose Intake",
  screeningQuestions = [],
}: CheckoutQuestionModalProps) {
  const [products, setProducts] = useState<ProductForm[]>([
    checkoutProductFactory({ category: "", regimen: "", doseLabel: "" })
  ]);
  const [visibilityMode, setVisibilityMode] = useState<"simple" | "nested">("nested");
  const [rules, setRules] = useState<VisibilityRuleForm[]>([]);
  const [selectedPreviewIdx, setSelectedPreviewIdx] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (initialQuestion) {
        setProducts(
          (initialQuestion.products || []).map(p => ({
            id: p.id,
            category: p.category,
            regimen: p.regimen,
            doseLabel: p.doseLabel,
            productId: p.productId,
          }))
        );
        setVisibilityMode(initialQuestion.visibilityRules?.mode || "nested");
        setRules(
          (initialQuestion.visibilityRules?.rules || []).map(r => ({
            id: r.id,
            questionId: r.questionId,
            operator: r.operator,
            value: r.value,
          }))
        );
      } else {
        setProducts([checkoutProductFactory({ category: "", regimen: "", doseLabel: "" })]);
        setVisibilityMode("nested");
        setRules([]);
      }
      setSelectedPreviewIdx(0);
      setFormError(null);
    }
  }, [open, initialQuestion]);

  const handleAddProduct = () => {
    setProducts([...products, checkoutProductFactory({ category: "", regimen: "", doseLabel: "" })]);
  };

  const handleRemoveProduct = (idx: number) => {
    if (products.length <= 1) return;
    setProducts(products.filter((_, i) => i !== idx));
    if (selectedPreviewIdx >= products.length - 1) {
      setSelectedPreviewIdx(0);
    }
  };

  const handleProductFieldChange = (idx: number, field: keyof ProductForm, value: string) => {
    const updated = [...products];
    updated[idx][field] = value;
    if (field === "category") {
      updated[idx].doseLabel = ""; // Clear dose when category changes
    }
    setProducts(updated);
  };

  const handleAddRule = () => {
    setRules([...rules, visibilityRuleFactory({ questionId: "", operator: "equals", value: "" })]);
  };

  const handleRemoveRule = (idx: number) => {
    setRules(rules.filter((_, i) => i !== idx));
  };

  const handleRuleFieldChange = (idx: number, field: keyof VisibilityRuleForm, value: string) => {
    const updated = [...rules];
    updated[idx] = {
      ...updated[idx],
      [field]: field === "operator" ? (value as VisibilityRule["operator"]) : value,
    };
    setRules(updated);
  };

  const handleSaveModal = () => {
    const valid = products.filter(p => p.category && p.regimen && p.doseLabel);
    if (valid.length === 0) {
      setFormError("Configure at least one complete product with Category, Regimen, and Dose Level.");
      return;
    }

    // Text: Auto-derived from the products
    const textVal = valid.map(p => p.doseLabel).join(" & ") || "Checkout Options";
    const validRules = rules.filter((rule) => rule.questionId && rule.operator && rule.value);

    onSave({
      text: textVal,
      products: valid,
      visibilityRules: {
        mode: visibilityMode,
        rules: validRules.map(r => ({
          id: r.id,
          questionId: r.questionId,
          operator: r.operator,
          value: r.value,
        })),
      },
    });
    onOpenChange(false);
  };

  const validProducts = products.filter(p => p.category && p.regimen && p.doseLabel);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[980px] p-0 flex flex-col overflow-hidden bg-white border border-slate-200 shadow-2xl rounded-2xl">
        {/* Header Panel */}
        <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex items-start justify-between z-20">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900 leading-tight">Add Checkout Question</h2>
            <div className="text-[12px] text-slate-400 mt-1">
              Owned by <span className="font-semibold">{programName}</span> · Plans that attach this eligibility inherit this Checkout question automatically.
            </div>
          </div>
          <button onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Body Grid */}
        <div className="flex-1 grid grid-cols-[1fr,340px] overflow-hidden max-h-[72vh]">
          
          {/* LEFT: Form Pane */}
          <div className="p-6 overflow-y-auto border-r border-slate-150 space-y-5">
            
            {/* Products Setup Card */}
            <div className="border border-slate-200 rounded-xl bg-white p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5">
                  Products to Display
                  <Info className="h-3.5 w-3.5 text-slate-400 cursor-pointer" />
                </div>
                <span className="text-[11.5px] font-medium text-slate-400">
                  {products.length} {products.length === 1 ? "product" : "products"}
                </span>
              </div>
              
              <div className="text-[11.5px] text-slate-400 leading-normal">
                Add one or more products the patient can choose from. Each product is a structured Category / Regimen / Dose combination — matching uses the structured fields, not the official product name.
              </div>

              {/* Products List */}
              <div className="space-y-4">
                {products.map((p, idx) => {
                  const categoryDoses = DOSE_MAPPINGS.filter(d => d.category === p.category);
                  
                  return (
                    <div key={idx} className="border border-slate-200 rounded-lg p-4 space-y-3.5 relative bg-white">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[12px] font-bold text-slate-700">Product {idx + 1}</span>
                        {products.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(idx)}
                            className="text-[11.5px] font-semibold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        )}
                      </div>

                      {/* Dropdowns */}
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[11.5px] font-bold text-slate-600">
                            Category <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <select
                              value={p.category}
                              onChange={(e) => handleProductFieldChange(idx, "category", e.target.value)}
                              className="w-full appearance-none rounded-lg border border-slate-200 px-3 py-2 text-[12px] text-slate-700 outline-none bg-white focus:border-blue-500 shadow-sm"
                            >
                              <option value="">— Select category —</option>
                              {PRODUCT_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11.5px] font-bold text-slate-600">
                            Titration / Regimen <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <select
                              value={p.regimen}
                              onChange={(e) => handleProductFieldChange(idx, "regimen", e.target.value)}
                              className="w-full appearance-none rounded-lg border border-slate-200 px-3 py-2 text-[12px] text-slate-700 outline-none bg-white focus:border-blue-500 shadow-sm"
                            >
                              <option value="">— Select regimen —</option>
                              {TITRATION_CATEGORIES.map(reg => (
                                <option key={reg} value={reg}>{reg}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11.5px] font-bold text-slate-600">
                            Dose Level <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <select
                              value={p.doseLabel}
                              disabled={!p.category}
                              onChange={(e) => handleProductFieldChange(idx, "doseLabel", e.target.value)}
                              className="w-full appearance-none rounded-lg border border-slate-200 px-3 py-2 text-[12px] text-slate-700 outline-none bg-white focus:border-blue-500 shadow-sm disabled:bg-slate-50 disabled:text-slate-400"
                            >
                              {!p.category ? (
                                <option value="">— Select category first —</option>
                              ) : (
                                <>
                                  <option value="">— Select dose level —</option>
                                  {categoryDoses.map(d => (
                                    <option key={d.label} value={d.label}>{d.label}</option>
                                  ))}
                                </>
                              )}
                            </select>
                            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Resolved Green Banner */}
                      {p.category && p.regimen && p.doseLabel && (
                        <div className="mt-3 px-3 py-2 bg-[#d1f4e0]/40 border border-[#b2ebd5] text-[#1e8a4a] text-[11.5px] font-medium rounded-lg leading-relaxed">
                          {p.doseLabel} · {p.category} · {p.regimen} regimen
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add another product button */}
              <button
                type="button"
                onClick={handleAddProduct}
                className="w-full flex items-center justify-center gap-1.5 py-3 border border-dashed border-slate-200 hover:border-slate-300 rounded-lg text-[12px] font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add another product
              </button>
            </div>

            {/* Visibility Rules Setup Card */}
            <div className="border border-slate-200 rounded-xl bg-white p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-bold text-slate-900">Visibility Rules</div>
                  <div className="text-[11.5px] text-slate-400 mt-0.5">Show this Checkout question only when these conditions match.</div>
                </div>
                <div className="relative">
                  <select
                    value={visibilityMode}
                    onChange={(e) => setVisibilityMode(e.target.value as "simple" | "nested")}
                    className="appearance-none border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-[11.5px] font-semibold text-slate-600 outline-none bg-white focus:border-blue-500"
                  >
                    <option value="simple">Simple — single condition</option>
                    <option value="nested">Advanced nested rules</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="text-[11px] text-slate-400 leading-normal italic">
                Use advanced mode when you need branch convergence like (A AND B) OR (C AND D).
              </div>

              {/* Rules List */}
              {rules.length > 0 && (
                <div className="space-y-3">
                  {rules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <select
                        value={rule.questionId}
                        onChange={(e) => handleRuleFieldChange(idx, "questionId", e.target.value)}
                        className="flex-1 border border-slate-200 rounded px-2 py-1 text-[11.5px] bg-white outline-none"
                      >
                        <option value="">Select question...</option>
                        {screeningQuestions.map(q => (
                          <option key={q.id} value={q.id}>{q.text}</option>
                        ))}
                        {screeningQuestions.length === 0 && (
                          <option value="sq-1">Are you currently pregnant, breastfeeding or planning to become pregnant?</option>
                        )}
                      </select>
                      
                      <select
                        value={rule.operator}
                        onChange={(e) => handleRuleFieldChange(idx, "operator", e.target.value)}
                        className="w-24 border border-slate-200 rounded px-2 py-1 text-[11.5px] bg-white outline-none"
                      >
                        <option value="equals">Equals</option>
                        <option value="not_equals">Not Equals</option>
                      </select>

                      <input
                        type="text"
                        value={rule.value}
                        onChange={(e) => handleRuleFieldChange(idx, "value", e.target.value)}
                        placeholder="Value"
                        className="w-24 border border-slate-200 rounded px-2 py-1 text-[11.5px] bg-white outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveRule(idx)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add visibility rule button */}
              <button
                type="button"
                onClick={handleAddRule}
                className="w-full flex items-center justify-center gap-1.5 py-3 border border-dashed border-slate-200 hover:border-slate-300 rounded-lg text-[12px] font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add visibility rule
              </button>
            </div>

          </div>

          {/* RIGHT: Live Preview Pane */}
          <div className="p-5 bg-[#f8fafc] overflow-y-auto flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 block">
              Patient Preview
            </span>
            
            {validProducts.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="p-6 text-center text-slate-400 text-xs italic bg-white border border-dashed border-slate-200 rounded-xl leading-relaxed">
                  Configure Category, Regimen, and Dose for at least one product to see the patient preview.
                </div>
              </div>
            ) : (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                
                {/* As shown to patient Card Box */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  {/* Card Header */}
                  <div className="p-3.5 bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-200">
                    <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                      As Shown to Patient
                    </div>
                    <div className="text-[13px] font-bold text-slate-800 mt-1">
                      Choose your product
                    </div>
                  </div>

                  {/* Card Body options */}
                  <div className="p-4 space-y-2.5">
                    <div className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
                      Choose Product
                    </div>
                    
                    {validProducts.map((p, idx) => {
                      const isSelected = selectedPreviewIdx === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedPreviewIdx(idx)}
                          className={`flex items-start gap-3 p-3 rounded-lg border text-[12px] cursor-pointer transition-all ${
                            isSelected 
                              ? "border-blue-600 bg-blue-50/10 shadow-sm" 
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          {/* Radio circle */}
                          <div className="mt-0.5 flex-shrink-0 h-4 w-4 rounded-full border border-slate-300 flex items-center justify-center">
                            {isSelected && (
                              <div className="h-2 w-2 rounded-full bg-blue-600" />
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-800 text-[12px] truncate">
                              {p.doseLabel}
                            </div>
                            <div className="text-[10.5px] text-slate-400 mt-0.5 leading-snug">
                              {p.category} · {p.regimen} regimen
                            </div>
                          </div>

                          {/* Pricing */}
                          <div className="text-right flex-shrink-0 pl-2">
                            <div className="font-bold text-slate-800 text-[12px] font-mono">
                              $-
                            </div>
                            <div className="text-[9.5px] text-slate-400">
                              starting from
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Yellow visibility hint */}
                <div className="px-3 py-2.5 bg-[#fefce8] border border-[#fde047] text-[#713f12] text-[11px] font-medium rounded-lg leading-relaxed shadow-sm">
                  <strong>Visibility:</strong> {rules.length === 0 ? "Always visible to all patients in this plan." : "Only shown to patients whose answers match the configured rules."}
                </div>

              </div>
            )}
          </div>

        </div>

        {/* Footer Panel */}
        <div className="shrink-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
          {formError && (
            <div className="mr-auto rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11.5px] font-semibold text-red-700">
              {formError}
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 px-5 text-xs font-bold text-slate-600 border-slate-200 hover:bg-slate-100/80 rounded-lg shadow-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveModal}
            className="h-9 px-5 text-xs font-bold bg-[#1d4ed8] hover:bg-blue-700 text-white rounded-lg shadow-sm"
          >
            {initialQuestion ? "Save Changes" : "Add Checkout Question"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
