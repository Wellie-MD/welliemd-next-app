import { useEffect, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Info, Plus } from "lucide-react";
import { productCategoryApi, type ProductCategory } from "@/api/productCategories";
import { titrationCategoryApi, type TitrationCategory } from "@/api/titrationCategories";
import { listDoseMappings, type ProductDoseMapping } from "@/api/productDoseMappings";
import { productApi, type Product } from "@/api/products";
import type { ProgramCheckoutProduct, ProgramQuestion, VisibilityRuleGroup } from "@/features/treatments/types";
import { CheckoutProductRow } from "./CheckoutProductRow";
import { catalogProductsForCheckoutPreview } from "../utils/catalogOptions";
import { treatmentConfigurationApi } from "@/features/treatments/api/configurationApi";
import { treatmentQueryKeys } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { isPersistedUuid } from "@/features/treatments/api/mappers";
import { buildLabVisibilityQuestions } from "../utils/labVisibilityQuestions";

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
  onCompatibilityChange?: (incompatibleProductNames: string[]) => void;
  onCatalogProductsChange?: (products: Product[]) => void;
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
  onCompatibilityChange,
  onCatalogProductsChange,
}: CheckoutProductsSectionProps) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [titrationCategories, setTitrationCategories] = useState<TitrationCategory[]>([]);
  const [doseMappings, setDoseMappings] = useState<ProductDoseMapping[]>([]);
  const [allCatalogProducts, setAllCatalogProducts] = useState<Product[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const sectionQuestions = useMemo(
    () => eligibleQuestions.filter((question) => question.kind === "section"),
    [eligibleQuestions],
  );
  const sectionFieldQueries = useQueries({
    queries: sectionQuestions.map((question) => {
      const sectionId = String(
        question.elementConfig?.sourceSectionId || question.elementConfig?.sourceId || "",
      );
      return {
        queryKey: treatmentQueryKeys.sectionFields(sectionId),
        queryFn: () => treatmentConfigurationApi.listSectionFields(sectionId),
        enabled: isPersistedUuid(sectionId),
        staleTime: 60_000,
      };
    }),
  });
  const visibilityQuestions = useMemo(
    () => buildLabVisibilityQuestions(
      eligibleQuestions,
      sectionFieldQueries.map((query) => query.data || []),
    ),
    [eligibleQuestions, sectionFieldQueries],
  );
  const incompatibleProducts = useMemo(() => {
    if (!catalogLoaded || !programTreatmentTypeKey) return [];
    return products
      .map((selected) => {
        if (!selected.productId) return null;
        const catalogProduct = allCatalogProducts.find(
          (product) => String(product.id) === String(selected.productId),
        );
        const label = selected.patientLabel || selected.doseLabel || "Selected Product";
        if (!catalogProduct) return `${label} is no longer available in the Product catalog`;
        if (catalogProduct.treatment_type_key !== programTreatmentTypeKey) {
          return `${label} belongs to ${catalogProduct.treatment_type_name || "another Treatment Type"}`;
        }
        if (!catalogProducts.some((product) => String(product.id) === String(selected.productId))) {
          return `${label} has incomplete Category, regimen, or dose configuration`;
        }
        return null;
      })
      .filter((message): message is string => Boolean(message));
  }, [allCatalogProducts, catalogLoaded, catalogProducts, products, programTreatmentTypeKey]);

  useEffect(() => {
    onCompatibilityChange?.(incompatibleProducts);
  }, [incompatibleProducts, onCompatibilityChange]);

  useEffect(() => {
    onCatalogProductsChange?.(catalogProducts);
  }, [catalogProducts, onCatalogProductsChange]);

  useEffect(() => {
    let cancelled = false;
    setCatalogLoaded(false);
    setAllCatalogProducts([]);
    setCatalogProducts([]);

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
        setAllCatalogProducts(nextProducts || []);
        setCatalogProducts(catalogProductsForCheckoutPreview(nextProducts || [], programTreatmentTypeKey));
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
      {incompatibleProducts.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11.5px] font-semibold text-red-700">
          Remove or repair these checkout products before saving:{" "}
          {incompatibleProducts.join(", ")}.
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
            visibilityQuestions={visibilityQuestions}
            categories={categories}
            titrationCategories={titrationCategories}
            doseMappings={doseMappings}
            catalogProducts={catalogProducts}
            onRemoveProduct={onRemoveProduct}
            onProductFieldChange={onProductFieldChange}
            onProductPriceChange={onProductPriceChange}
            onProductVisibilityChange={onProductVisibilityChange}
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
