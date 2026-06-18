import { useEffect, useMemo, useState } from "react";
import { checkoutProductFactory } from "@/features/treatments/common/data/factories";
import type { ProgramCheckoutProduct, ProgramCheckoutQuestion, VisibilityRuleGroup } from "@/features/treatments/types";

type ProductForm = ProgramCheckoutProduct;
type VisibilityRuleGroupForm = VisibilityRuleGroup;

interface UseCheckoutQuestionFormArgs {
  open: boolean;
  initialQuestion?: ProgramCheckoutQuestion | null;
  onSave: (data: Omit<ProgramCheckoutQuestion, "id">) => void;
  onOpenChange: (open: boolean) => void;
}

export function useCheckoutQuestionForm({ open, initialQuestion, onSave, onOpenChange }: UseCheckoutQuestionFormArgs) {
  const [products, setProducts] = useState<ProductForm[]>([checkoutProductFactory({ category: "", regimen: "", doseLabel: "" })]);
  const [visibilityRuleGroup, setVisibilityRuleGroup] = useState<VisibilityRuleGroupForm | undefined>(undefined);
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
      setVisibilityRuleGroup(
        initialQuestion.visibilityRules
          ? {
              mode: initialQuestion.visibilityRules.mode,
              rules: (initialQuestion.visibilityRules.rules || []).map((rule) => ({
                id: rule.id,
                questionId: rule.questionId,
                operator: rule.operator,
                value: rule.value,
              })),
              subgroups: initialQuestion.visibilityRules.subgroups,
            }
          : undefined
      );
    } else {
      setProducts([checkoutProductFactory({ category: "", regimen: "", doseLabel: "" })]);
      setVisibilityRuleGroup(undefined);
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

  const handleVisibilityRuleGroupChange = (group: VisibilityRuleGroupForm | undefined) => {
    setVisibilityRuleGroup(group);
  };

  const handleSaveModal = () => {
    if (validProducts.length === 0) {
      setFormError("Configure at least one complete product with Category, Regimen, and Dose Level.");
      return;
    }

    onSave({
      text: validProducts.map((product) => product.doseLabel).join(" & ") || "Checkout Options",
      products: validProducts,
      visibilityRules: visibilityRuleGroup
        ? {
            mode: visibilityRuleGroup.mode,
            rules: visibilityRuleGroup.rules.filter((rule) => rule.questionId && rule.operator && rule.value),
            subgroups: visibilityRuleGroup.subgroups,
          }
        : { mode: "simple", rules: [] },
    });
    onOpenChange(false);
  };

  return {
    products,
    visibilityRuleGroup,
    selectedPreviewIdx,
    setSelectedPreviewIdx,
    formError,
    validProducts,
    handleAddProduct,
    handleRemoveProduct,
    handleProductFieldChange,
    handleVisibilityRuleGroupChange,
    handleSaveModal,
  };
}
