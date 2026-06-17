import { useEffect, useMemo, useState } from "react";
import { checkoutProductFactory, visibilityRuleFactory } from "../../../data/factories";
import type { ProgramCheckoutProduct, ProgramCheckoutQuestion, VisibilityRule } from "../../../types";

type ProductForm = ProgramCheckoutProduct;
type VisibilityRuleForm = VisibilityRule;

interface UseCheckoutQuestionFormArgs {
  open: boolean;
  initialQuestion?: ProgramCheckoutQuestion | null;
  onSave: (data: Omit<ProgramCheckoutQuestion, "id">) => void;
  onOpenChange: (open: boolean) => void;
}

export function useCheckoutQuestionForm({ open, initialQuestion, onSave, onOpenChange }: UseCheckoutQuestionFormArgs) {
  const [products, setProducts] = useState<ProductForm[]>([checkoutProductFactory({ category: "", regimen: "", doseLabel: "" })]);
  const [visibilityMode, setVisibilityMode] = useState<"simple" | "nested">("nested");
  const [rules, setRules] = useState<VisibilityRuleForm[]>([]);
  const [selectedPreviewIdx, setSelectedPreviewIdx] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initialQuestion) {
      setProducts(
        (initialQuestion.products || []).map((product) => ({
          id: product.id,
          category: product.category,
          regimen: product.regimen,
          doseLabel: product.doseLabel,
          productId: product.productId,
        }))
      );
      setVisibilityMode(initialQuestion.visibilityRules?.mode || "nested");
      setRules(
        (initialQuestion.visibilityRules?.rules || []).map((rule) => ({
          id: rule.id,
          questionId: rule.questionId,
          operator: rule.operator,
          value: rule.value,
        }))
      );
    } else {
      setProducts([checkoutProductFactory({ category: "", regimen: "", doseLabel: "" })]);
      setVisibilityMode("nested");
      setRules([]);
    }
    setSelectedPreviewIdx(0);
    setFormError(null);
  }, [open, initialQuestion]);

  const validProducts = useMemo(() => products.filter((product) => product.category && product.regimen && product.doseLabel), [products]);

  const handleAddProduct = () => setProducts((current) => [...current, checkoutProductFactory({ category: "", regimen: "", doseLabel: "" })]);

  const handleRemoveProduct = (index: number) => {
    setProducts((current) => {
      if (current.length <= 1) return current;
      const updated = current.filter((_, itemIndex) => itemIndex !== index);
      if (selectedPreviewIdx >= updated.length) setSelectedPreviewIdx(0);
      return updated;
    });
  };

  const handleProductFieldChange = (index: number, field: keyof ProductForm, value: string) => {
    setProducts((current) =>
      current.map((product, itemIndex) => {
        if (itemIndex !== index) return product;
        return { ...product, [field]: value, ...(field === "category" ? { doseLabel: "" } : {}) };
      })
    );
  };

  const handleAddRule = () => setRules((current) => [...current, visibilityRuleFactory({ questionId: "", operator: "equals", value: "" })]);
  const handleRemoveRule = (index: number) => setRules((current) => current.filter((_, itemIndex) => itemIndex !== index));

  const handleRuleFieldChange = (index: number, field: keyof VisibilityRuleForm, value: string) => {
    setRules((current) =>
      current.map((rule, itemIndex) =>
        itemIndex === index ? { ...rule, [field]: field === "operator" ? (value as VisibilityRule["operator"]) : value } : rule
      )
    );
  };

  const handleSaveModal = () => {
    if (validProducts.length === 0) {
      setFormError("Configure at least one complete product with Category, Regimen, and Dose Level.");
      return;
    }

    onSave({
      text: validProducts.map((product) => product.doseLabel).join(" & ") || "Checkout Options",
      products: validProducts,
      visibilityRules: {
        mode: visibilityMode,
        rules: rules.filter((rule) => rule.questionId && rule.operator && rule.value),
      },
    });
    onOpenChange(false);
  };

  return {
    products,
    visibilityMode,
    setVisibilityMode,
    rules,
    selectedPreviewIdx,
    setSelectedPreviewIdx,
    formError,
    validProducts,
    handleAddProduct,
    handleRemoveProduct,
    handleProductFieldChange,
    handleAddRule,
    handleRemoveRule,
    handleRuleFieldChange,
    handleSaveModal,
  };
}
