import { useEffect, useMemo, useState } from "react";
import { Info, Layers3, Plus, Ungroup } from "lucide-react";
import { productCategoryApi, type ProductCategory } from "@/api/productCategories";
import { titrationCategoryApi, type TitrationCategory } from "@/api/titrationCategories";
import { listDoseMappings, type ProductDoseMapping } from "@/api/productDoseMappings";
import { productApi, type Product } from "@/api/products";
import type { ProgramCheckoutProduct, ProgramQuestion, VisibilityRuleGroup } from "@/features/treatments/types";
import { CheckoutProductRow } from "./CheckoutProductRow";
import { selectableCatalogProducts } from "../utils/catalogOptions";

interface CheckoutProductsSectionProps {
  products: ProgramCheckoutProduct[];
  /** Earlier questions in the program, used as conditions for per-product visibility. */
  eligibleQuestions: ProgramQuestion[];
  programTreatmentTypeKey?: string | null;
  onAddProduct: () => void;
  onRemoveProduct: (index: number) => void;
  onProductFieldChange: (
    index: number,
    field: keyof ProgramCheckoutProduct,
    value: ProgramCheckoutProduct[keyof ProgramCheckoutProduct]
  ) => void;
  onProductPriceChange: (index: number, value: string) => void;
  onProductVisibilityChange: (index: number, group: VisibilityRuleGroup | undefined) => void;
}

export function CheckoutProductsSection({
  products,
  eligibleQuestions,
  programTreatmentTypeKey,
  onAddProduct,
  onRemoveProduct,
  onProductFieldChange,
  onProductPriceChange,
  onProductVisibilityChange,
}: CheckoutProductsSectionProps) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [titrationCategories, setTitrationCategories] = useState<TitrationCategory[]>([]);
  const [doseMappings, setDoseMappings] = useState<ProductDoseMapping[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [groupingSelection, setGroupingSelection] = useState<number[]>([]);
  const [groupLabel, setGroupLabel] = useState("");

  useEffect(() => {
    setGroupingSelection((current) => current.filter((index) => index < products.length));
  }, [products.length]);

  useEffect(() => {
    let cancelled = false;
    setCatalogLoaded(false);

    const fetchCatalogMetadata = async () => {
      try {
        const [nextCategories, nextTitrationCategories, nextDoseMappings, nextProducts] = await Promise.all([
          productCategoryApi.listCategories(),
          titrationCategoryApi.listCategories({ is_active: true, page_size: 100 }),
          listDoseMappings({ page_size: 1000 }),
          productApi.listProducts({ is_admin_product: true, is_active: true, page_size: 250 }),
        ]);

        if (cancelled) return;
        setCategories(nextCategories || []);
        setTitrationCategories(nextTitrationCategories || []);
        setDoseMappings(nextDoseMappings?.results || []);
        setCatalogProducts(selectableCatalogProducts(nextProducts || [], programTreatmentTypeKey));
        setCatalogError(null);
        setCatalogLoaded(true);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to fetch checkout product catalog metadata:", error);
        setCatalogError("Unable to load product catalog metadata from Django.");
        setCatalogLoaded(true);
      }
    };

    fetchCatalogMetadata();

    return () => {
      cancelled = true;
    };
  }, [programTreatmentTypeKey]);

  const hasCatalogMetadata = useMemo(
    () => categories.length > 0 && titrationCategories.length > 0 && doseMappings.length > 0,
    [categories.length, titrationCategories.length, doseMappings.length]
  );
  const selectedProducts = groupingSelection
    .map((index) => products[index])
    .filter(Boolean);
  const selectedDurations = selectedProducts.map((product) => product.rxDaysSupply);
  const canCreateGroup = (
    selectedProducts.length >= 2
    && selectedProducts.every((product) => product.productId && product.rxDaysSupply)
    && new Set(selectedDurations).size === selectedDurations.length
    && groupLabel.trim().length > 0
  );

  const createSupplyGroup = () => {
    if (!canCreateGroup) return;
    const groupId = `supply-${crypto.randomUUID()}`;
    const selectedIndexes = new Set(groupingSelection);
    const replacedGroups = new Set(
      selectedProducts
        .map((product) => product.choiceGroup)
        .filter((choiceGroup): choiceGroup is string => Boolean(choiceGroup?.startsWith("supply-")))
    );
    products.forEach((product, index) => {
      if (
        !selectedIndexes.has(index)
        && product.choiceGroup
        && replacedGroups.has(product.choiceGroup)
      ) {
        onProductFieldChange(index, "choiceGroup", undefined);
        onProductFieldChange(index, "patientLabel", undefined);
      }
    });
    groupingSelection.forEach((index) => {
      onProductFieldChange(index, "choiceGroup", groupId);
      onProductFieldChange(index, "patientLabel", groupLabel.trim());
    });
    setGroupingSelection([]);
    setGroupLabel("");
  };

  const ungroupSelectedProducts = () => {
    const selectedGroups = new Set(
      selectedProducts
        .map((product) => product.choiceGroup)
        .filter((choiceGroup): choiceGroup is string => Boolean(choiceGroup))
    );
    products.forEach((product, index) => {
      if (groupingSelection.includes(index) || (
        product.choiceGroup && selectedGroups.has(product.choiceGroup)
      )) {
        onProductFieldChange(index, "choiceGroup", undefined);
        onProductFieldChange(index, "patientLabel", undefined);
      }
    });
    setGroupingSelection([]);
    setGroupLabel("");
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-900">
          Products to Display
          <Info className="h-3.5 w-3.5 cursor-pointer text-slate-400" />
        </div>
        <span className="text-[11.5px] font-medium text-slate-400">
          {products.length} {products.length === 1 ? "product" : "products"}
        </span>
      </div>
      <div className="text-[11.5px] leading-normal text-slate-400">
        Add one or more products the patient can choose from. Each product is a structured Category / Regimen / Dose combination sourced from the Django product catalog. Use per-product visibility rules to show different products based on the patient&apos;s earlier answers.
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-start gap-2">
          <Layers3 className="mt-0.5 h-4 w-4 text-blue-600" />
          <div className="flex-1">
            <div className="text-[12px] font-bold text-slate-800">
              Show Products as one medication
            </div>
            <p className="mt-0.5 text-[10.5px] leading-normal text-slate-500">
              Select two or more Product rows, then enter the medication name patients should see. Each supply duration still uses its exact Product.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={groupLabel}
                onChange={(event) => setGroupLabel(event.target.value)}
                placeholder="Patient-facing name, e.g. Semaglutide 0.25 mg"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] outline-none focus:border-blue-500"
                disabled={selectedProducts.length < 2}
              />
              <button
                type="button"
                onClick={createSupplyGroup}
                disabled={!canCreateGroup}
                className="rounded-lg bg-blue-600 px-3 py-2 text-[11.5px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Group selected
              </button>
              <button
                type="button"
                onClick={ungroupSelectedProducts}
                disabled={!selectedProducts.some((product) => product.choiceGroup)}
                className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11.5px] font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Ungroup className="h-3.5 w-3.5" />
                Ungroup
              </button>
            </div>
            <div className="mt-2 text-[10.5px] font-medium text-slate-500">
              {selectedProducts.length} selected
              {selectedProducts.length >= 2 && !canCreateGroup && groupLabel.trim()
                ? " · Select complete Products with different supply durations"
                : ""}
            </div>
          </div>
        </div>
      </div>
      {catalogError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] font-semibold text-amber-700">
          {catalogError}
        </div>
      )}
      {!catalogError && !catalogLoaded && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11.5px] font-medium text-slate-500">
          Loading product catalog metadata…
        </div>
      )}
      {!catalogError && catalogLoaded && hasCatalogMetadata && catalogProducts.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] font-medium text-amber-700">
          No active catalog Products with a matching Treatment Type are available for this Program yet.
        </div>
      )}
      {!catalogError && catalogLoaded && !hasCatalogMetadata && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] font-medium text-amber-700">
          Product catalog metadata is incomplete. Categories, regimens, or dose mappings are missing.
        </div>
      )}

      <div className="space-y-4">
        {products.map((product, index) => (
          <CheckoutProductRow
            key={product.id}
            product={product}
            index={index}
            productCount={products.length}
            eligibleQuestions={eligibleQuestions}
            categories={categories}
            titrationCategories={titrationCategories}
            doseMappings={doseMappings}
            catalogProducts={catalogProducts}
            onRemoveProduct={onRemoveProduct}
            onProductFieldChange={onProductFieldChange}
            onProductPriceChange={onProductPriceChange}
            onProductVisibilityChange={onProductVisibilityChange}
            selectedForGrouping={groupingSelection.includes(index)}
            onGroupingSelectionChange={(productIndex, selected) =>
              setGroupingSelection((current) =>
                selected
                  ? [...new Set([...current, productIndex])]
                  : current.filter((item) => item !== productIndex)
              )
            }
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onAddProduct}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 py-3 text-[12px] font-bold text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50"
        data-testid="add-checkout-product"
      >
        <Plus className="h-4 w-4" />
        Add another product
      </button>
    </div>
  );
}
