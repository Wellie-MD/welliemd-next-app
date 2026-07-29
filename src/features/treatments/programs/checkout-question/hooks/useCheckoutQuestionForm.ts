import { useEffect, useMemo, useState } from "react";
import { checkoutProductFactory } from "@/features/treatments/common/data/factories";
import type { ProgramCheckoutProduct, ProgramCheckoutQuestion, VisibilityRuleGroup } from "@/features/treatments/types";
import { PROGRAM_PRODUCT_ROLE, isCheckoutQuestionRequired } from "../constants";
import { toast } from "@/components/ui/use-toast";

type ProductForm = ProgramCheckoutProduct;
type VisibilityRuleGroupForm = VisibilityRuleGroup;

interface UseCheckoutQuestionFormArgs {
  open: boolean;
  initialQuestion?: ProgramCheckoutQuestion | null;
  onSave: (data: Omit<ProgramCheckoutQuestion, "id">) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function useCheckoutQuestionForm({ open, initialQuestion, onSave, onOpenChange }: UseCheckoutQuestionFormArgs) {
  const [products, setProducts] = useState<ProductForm[]>([checkoutProductFactory({ category: "", regimen: "", doseLabel: "", productRole: PROGRAM_PRODUCT_ROLE.primaryChoice })]);
  const [visibilityRuleGroup, setVisibilityRuleGroup] = useState<VisibilityRuleGroupForm | undefined>(undefined);
  const [selectedPreviewIdx, setSelectedPreviewIdx] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialQuestion) {
      setProducts(
        (initialQuestion.products || []).map((product) => ({
          id: product.id,
          categoryId: product.categoryId,
          category: product.category,
          regimenId: product.regimenId,
          regimen: product.regimen,
          doseMappingId: product.doseMappingId,
          doseLabel: product.doseLabel,
          productId: product.productId,
          sourceProductId: product.sourceProductId,
          price: product.price,
          productRole: product.productRole || PROGRAM_PRODUCT_ROLE.primaryChoice,
          choiceGroup: product.choiceGroup,
          visibilityRules: product.visibilityRules,
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
      setProducts([checkoutProductFactory({ category: "", regimen: "", doseLabel: "", productRole: PROGRAM_PRODUCT_ROLE.primaryChoice })]);
      setVisibilityRuleGroup(undefined);
    }
    setSelectedPreviewIdx(0);
    setFormError(null);
  }, [open, initialQuestion]);

  const validProducts = useMemo(
    () => products.filter((product) => product.category && product.regimen && product.doseLabel && product.productId),
    [products]
  );

  const handleAddProduct = () => setProducts((current) => [...current, checkoutProductFactory({ category: "", regimen: "", doseLabel: "", productRole: PROGRAM_PRODUCT_ROLE.primaryChoice })]);

  const handleRemoveProduct = (index: number) => {
    setProducts((current) => {
      if (current.length <= 1) return current;
      const updated = current.filter((_, itemIndex) => itemIndex !== index);
      if (selectedPreviewIdx >= updated.length) setSelectedPreviewIdx(0);
      return updated;
    });
  };

  const handleProductFieldChange = (
    index: number,
    field: keyof ProductForm,
    value: ProductForm[keyof ProductForm]
  ) => {
    // Every caller that changes category already resets its own dependent
    // fields (regimen/dose/product) explicitly, in the order that keeps the
    // row consistent. An implicit "category clears dose" side effect here
    // used to fire regardless of call order — in handleDoseChange it landed
    // *after* doseLabel/doseMappingId were already set, silently wiping them
    // back out and leaving a row with a product id but no dose label, which
    // the backend then rejected as invalid.
    setProducts((current) =>
      current.map((product, itemIndex) =>
        itemIndex === index ? { ...product, [field]: value } : product
      )
    );
  };

  const handleProductPriceChange = (index: number, value: string) => {
    setProducts((current) =>
      current.map((product, itemIndex) => {
        if (itemIndex !== index) return product;
        const parsed = value.trim() === "" ? undefined : Number(value);
        return { ...product, price: parsed !== undefined && Number.isFinite(parsed) ? parsed : undefined };
      })
    );
  };

  const handleProductVisibilityChange = (index: number, group: VisibilityRuleGroupForm | undefined) => {
    setProducts((current) =>
      current.map((product, itemIndex) => (itemIndex === index ? { ...product, visibilityRules: group } : product))
    );
  };

  const handleVisibilityRuleGroupChange = (group: VisibilityRuleGroupForm | undefined) => {
    setVisibilityRuleGroup(group);
  };

  const handleSaveModal = async () => {
    if (validProducts.length === 0) {
      setFormError("Configure at least one complete option with Category, Regimen, Dose Level, and Catalog Product.");
      return;
    }

    const seenProducts = new Map<string, number>();
    for (const [index, product] of validProducts.entries()) {
      const productId = String(product.productId);
      const firstIndex = seenProducts.get(productId);
      if (firstIndex !== undefined) {
        const label = [product.category, product.regimen, product.doseLabel]
          .filter(Boolean)
          .join(" / ");
        const message = `${label || "This Product"} is selected in options ${firstIndex + 1} and ${index + 1}. A Checkout Question can use the same catalog Product only once. Choose a different Product, or remove the duplicate option.`;
        toast({ title: "Duplicate Product option", description: message, variant: "destructive" });
        return;
      }
      seenProducts.set(productId, index);
    }

    const normalizeGroup = (group: VisibilityRuleGroupForm | undefined): VisibilityRuleGroupForm | undefined => {
      if (!group) return undefined;
      const rules = group.rules.filter((rule) => rule.questionId && rule.operator && rule.value);
      const subgroups = (group.subgroups || [])
        .map(normalizeGroup)
        .filter((subgroup): subgroup is VisibilityRuleGroupForm => Boolean(subgroup));
      if (rules.length === 0 && subgroups.length === 0) return undefined;
      return { mode: group.mode, rules, subgroups };
    };

    const normalizeProduct = (product: ProductForm): ProductForm => {
      const sourceProductId =
        product.sourceProductId && product.sourceProductId !== product.productId
          ? product.sourceProductId
          : undefined;
      return {
        ...product,
        sourceProductId,
      };
    };

    setIsSaving(true);
    setFormError(null);
    try {
      await onSave({
        text: validProducts.map((product) => product.doseLabel).join(" & ") || "Checkout Options",
        products: validProducts.map((product) => ({
          ...normalizeProduct(product),
          visibilityRules: normalizeGroup(product.visibilityRules),
        })),
        visibilityRules: normalizeGroup(visibilityRuleGroup) || { mode: "simple", rules: [] },
        required: isCheckoutQuestionRequired(validProducts),
      });
      onOpenChange(false);
    } catch (error) {
      const responseData = (error as { response?: { data?: unknown } })?.response?.data;
      const extractMessage = (value: unknown): string | null => {
        if (typeof value === "string") return value;
        if (Array.isArray(value)) {
          for (const item of value) {
            const message = extractMessage(item);
            if (message) return message;
          }
        }
        if (value && typeof value === "object") {
          const record = value as Record<string, unknown>;
          const priorityKeys = ["error", "product", "products", "message", "detail"];
          for (const key of priorityKeys) {
            const message = extractMessage(record[key]);
            if (message) return message;
          }
          for (const item of Object.values(record)) {
            const message = extractMessage(item);
            if (message) return message;
          }
        }
        return null;
      };
      setFormError(
        extractMessage(responseData) ||
          (error instanceof Error ? error.message : null) ||
          "Unable to save this checkout question. Review the Product selections and try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return {
    products,
    visibilityRuleGroup,
    selectedPreviewIdx,
    setSelectedPreviewIdx,
    formError,
    isSaving,
    validProducts,
    handleAddProduct,
    handleRemoveProduct,
    handleProductFieldChange,
    handleProductPriceChange,
    handleProductVisibilityChange,
    handleVisibilityRuleGroupChange,
    handleSaveModal,
  };
}
