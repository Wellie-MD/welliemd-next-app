import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { productApi, Product } from "@/api/products";
import {
  PRODUCT_TYPE_OPTIONS,
  PURCHASE_TYPE_OPTIONS,
  RX_OTC_OPTIONS,
  RX_DRUG_FORM_OPTIONS,
} from "@/api/products";
import { CategorySelector } from "./CategorySelector";
import { TitrationCategoryManager } from "./TitrationCategoryManager";
import { pharmacyApi } from "@/api/pharmacyApi";
import { listDoseMappings, ProductDoseMapping } from "@/api/productDoseMappings";
import { templateApi } from "@/api/questionnaires";
import { useTreatmentTypes } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { ServiceStatesSelector } from "@/components/shared/ServiceStatesSelector";

type TreatmentOption = {
  value: string;  // slug, e.g. "branded_weight_loss"
  label: string;  // original text, e.g. "Branded Weight Loss"
};

/**
 * Convert a free-text treatment label (e.g. "Branded Weight Loss") to a slug
 * (e.g. "branded_weight_loss") suitable for storing in Product.treatment.
 */
const labelToSlug = (label: string): string =>
  label
    .trim()
    .toLowerCase()
    .replace(/\+/g, "_plus")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSuccess: () => void;
  defaultProductType?: "single" | "bundle" | "supply";
}

type LinkedSupplyRow = {
  supply_product_id: number;
  quantity: number;
  is_included: boolean;
};

export function ProductFormModal({
  open,
  onOpenChange,
  product,
  onSuccess,
  defaultProductType = "single",
}: ProductFormModalProps) {
  const { data: treatmentTypes = [] } = useTreatmentTypes();
  const [loading, setLoading] = useState(false);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [doseMappings, setDoseMappings] = useState<ProductDoseMapping[]>([]);
  const [supplyProducts, setSupplyProducts] = useState<Product[]>([]);
  const [linkedSupplies, setLinkedSupplies] = useState<LinkedSupplyRow[]>([]);
  const [treatmentOptions, setTreatmentOptions] = useState<TreatmentOption[]>([]);
  const [loadingTreatmentOptions, setLoadingTreatmentOptions] = useState(false);
  const [loadingDoseMappings, setLoadingDoseMappings] = useState(false);
  // Track the category for which dose mappings were loaded
  const doseMappingsLoadedForCategoryRef = useRef<number | null>(null);
  // Track if we're in initial form load (to prevent premature validation)
  const isInitialLoadRef = useRef(true);
  const [formData, setFormData] = useState({
    name: "",
    beluga_internal_product_name: "",
    base_medication_name: "",
    description: "",
    application_directions: "",
    category: null as number | null,
    dose_mapping: null as number | null,
    titration_category: null as number | null,
    pharmacy: null as string | null,
    service_states: [] as string[],
    product_type: defaultProductType,
    purchase_type: "one_time",
    treatment: "weight_loss",
    treatment_type_id: null as string | null,
    rx_or_otc: "rx",
    base_price: "0.00",
    cost_to_client: "0.00",
    cost_to_welliemd: "0.00",
    shipping_cost_to_client: "0.00",
    shipping_cost_to_welliemd: "0.00",
    manufacturer_name: "",
    ndc_number: "",
    rx_drug_form: "tablet",
    rx_quantity: "30",
    rx_drug_strength: "",
    rx_days_supply: 30,
    refills: 0,
    beluga_medicine_id: "",
    provider_network: "welliemd",
    followup_days_after: 30,
    quantity: "100",
    is_active: true,
    requires_video_visit: false,
    allow_client_modifications: true,
    sync_to_tenants: false,
    allowed_visit_types: [] as string[],
    restrict_visit_types: false,
  });

  const visitTypeOptions = (() => {
    const options = new Map<string, string>();
    treatmentTypes.forEach((t) => {
      if (t.intakeVisitType) {
        options.set(t.intakeVisitType, `${t.name} Intake (${t.intakeVisitType})`);
      }
      if (t.followupVisitType) {
        options.set(
          t.followupVisitType,
          `${t.name} Follow-up (${t.followupVisitType})`,
        );
      }
    });
    return Array.from(options.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  })();
  const selectedTreatmentType = treatmentTypes.find(
    (type) => String(type.id) === String(formData.treatment_type_id),
  );

  // Fetch pharmacies on mount
  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        const data = await pharmacyApi.list({ page_size: 100, is_active: true });
        setPharmacies(data || []);
      } catch (error) {
        console.error("Failed to fetch pharmacies:", error);
      }
    };
    if (open) {
      fetchPharmacies();
    }
  }, [open]);

  useEffect(() => {
    const fetchSupplyProducts = async () => {
      try {
        const supplies = await productApi.listProducts({
          product_type: "supply",
          is_active: true,
          page_size: 300,
        });
        setSupplyProducts((supplies || []) as Product[]);
      } catch (error) {
        console.error("Failed to fetch supply products:", error);
        setSupplyProducts([]);
      }
    };
    if (open) {
      fetchSupplyProducts();
    }
  }, [open]);

  // Load treatment options from questionnaire treatment_type values.
  // Uses a simple slug-derivation approach so ANY free-text value is supported:
  //   label = original text (e.g. "Branded Weight Loss")
  //   value = slugified version (e.g. "branded_weight_loss") stored in Product.treatment
  // Backwards compat: if the current product's treatment slug is not in the
  // questionnaire list, it is appended as an extra option so the select isn't blank.
  useEffect(() => {
    const fetchTreatmentOptions = async () => {
      setLoadingTreatmentOptions(true);
      try {
        const templates = await templateApi.listTemplates();
        const uniqueLabels = Array.from(
          new Set(
            (templates || [])
              .map((t) => (t.treatment_type || "").trim())
              .filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b));

        const derivedMap = new Map<string, string>();
        uniqueLabels.forEach((label) => {
          const value = labelToSlug(label);
          if (!derivedMap.has(value)) {
            derivedMap.set(value, label);
          }
        });

        const derived: TreatmentOption[] = Array.from(derivedMap.entries()).map(([value, label]) => ({
          value,
          label,
        }));

        // Backwards-compat: if editing a product whose treatment slug isn't in
        // the derived list, add it so the existing value still shows as selected.
        if (product?.treatment) {
          const existingSlug = product.treatment;
          const alreadyPresent = derived.some((o) => o.value === existingSlug);
          if (!alreadyPresent) {
            let label = existingSlug.replace(/_plus$/g, "+").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            if (existingSlug === "nad_plus") label = "NAD+";
            if (existingSlug === "ed") label = "ED";

            derived.push({
              value: existingSlug,
              label: label,
            });
          }
        }

        setTreatmentOptions(derived);
      } catch (error) {
        console.error("Failed to fetch questionnaire treatment types:", error);
        setTreatmentOptions([]);
      } finally {
        setLoadingTreatmentOptions(false);
      }
    };

    if (open) {
      fetchTreatmentOptions();
    }
  }, [open, product?.treatment]);

  // Fetch dose mappings when category changes
  useEffect(() => {
    // Set loading state synchronously BEFORE the async call
    // This ensures the validation useEffect sees this state change in the same render
    if (open && formData.category) {
      setLoadingDoseMappings(true);
    }

    const fetchDoseMappings = async () => {
      if (!formData.category) {
        setDoseMappings([]);
        setLoadingDoseMappings(false);
        doseMappingsLoadedForCategoryRef.current = null;
        return;
      }
      try {
        const response = await listDoseMappings({
          category: formData.category,
          page_size: 100,
        });
        const fetchedMappings = response.results || [];
        setDoseMappings(fetchedMappings);
        // Track which category we loaded dose mappings for
        doseMappingsLoadedForCategoryRef.current = formData.category;
      } catch (error) {
        console.error("Failed to fetch dose mappings:", error);
        setDoseMappings([]);
        doseMappingsLoadedForCategoryRef.current = formData.category;
      } finally {
        setLoadingDoseMappings(false);
      }
    };

    if (open) {
      fetchDoseMappings();
    }
  }, [formData.category, open]);

  // Reset dose_mapping when category changes if it doesn't belong to new category
  // Only validate after dose mappings have been fully loaded for the CURRENT category
  useEffect(() => {
    // Skip validation if we're still loading dose mappings
    if (loadingDoseMappings) {
      return;
    }

    // Skip validation during initial form load
    if (isInitialLoadRef.current) {
      return;
    }

    // Only validate when dose mappings are loaded for the current category
    // This prevents premature validation while waiting for API response
    if (doseMappingsLoadedForCategoryRef.current !== formData.category) {
      return;
    }

    // Only reset if we have a dose_mapping selected and dose mappings have been loaded
    if (formData.dose_mapping && doseMappings.length > 0) {
      const isValid = doseMappings.some(dm => dm.id === formData.dose_mapping);
      if (!isValid) {
        setFormData(prev => ({ ...prev, dose_mapping: null }));
      }
    }
    // If category is set but no dose mappings exist for it, and we have a dose_mapping selected, reset it
    else if (formData.dose_mapping && formData.category && doseMappings.length === 0) {
      setFormData(prev => ({ ...prev, dose_mapping: null }));
    }
  }, [doseMappings, formData.dose_mapping, formData.category, loadingDoseMappings]);

  // Mark initial load as complete once dose mappings are loaded for the product's category
  useEffect(() => {
    if (isInitialLoadRef.current &&
      !loadingDoseMappings &&
      product &&
      doseMappingsLoadedForCategoryRef.current === formData.category) {
      isInitialLoadRef.current = false;
    }
  }, [loadingDoseMappings, formData.category, product]);

  useEffect(() => {
    // Reset refs when modal opens/closes
    if (!open) {
      isInitialLoadRef.current = true;
      doseMappingsLoadedForCategoryRef.current = null;
    }

    if (product) {
      setFormData({
        name: product.name || "",
        beluga_internal_product_name: product.beluga_internal_product_name || "",
        base_medication_name: (product as any).base_medication_name || "",
        description: product.description || "",
        application_directions: product.application_directions || "",
        category: (product as unknown).category || null,
        dose_mapping: (product as any).dose_mapping || null,
        titration_category: (product as unknown).titration_category || null,
        pharmacy: product.pharmacy ? String(product.pharmacy) : null,
        service_states: Array.isArray((product as any).service_states)
          ? (product as any).service_states
              .map((state: string) => String(state || "").toUpperCase())
              .filter(Boolean)
          : [],
        product_type: product.product_type || "single",
        purchase_type: product.purchase_type || "one_time",
        treatment: product.treatment || "weight_loss",
        treatment_type_id: product.treatment_type_id
          ? String(product.treatment_type_id)
          : null,
        rx_or_otc: product.rx_or_otc || "rx",
        base_price: product.base_price?.toString() || "0.00",
        cost_to_client: product.cost_to_client?.toString() || "0.00",
        cost_to_welliemd: product.cost_to_welliemd?.toString() || "0.00",
        shipping_cost_to_client: product.shipping_cost_to_client?.toString() || "0.00",
        shipping_cost_to_welliemd: product.shipping_cost_to_welliemd?.toString() || "0.00",
        manufacturer_name: product.manufacturer_name || "",
        ndc_number: product.ndc_number || "",
        rx_drug_form: product.rx_drug_form || "tablet",
        rx_quantity: product.rx_quantity?.toString() || "30",
        rx_drug_strength: product.rx_drug_strength || "",
        rx_days_supply: product.rx_days_supply || 30,
        refills: product.refills || 0,
        beluga_medicine_id: product.beluga_medicine_id || "",
        provider_network: product.provider_network || "welliemd",
        followup_days_after: product.followup_days_after || 30,
        quantity: product.quantity?.toString() || "100",
        is_active: product.is_active !== undefined ? product.is_active : true,
        requires_video_visit: product.requires_video_visit || false,
        allow_client_modifications: product.allow_client_modifications !== undefined ? product.allow_client_modifications : true,
        sync_to_tenants: product.sync_to_tenants || false,
        allowed_visit_types: product.allowed_visit_types || [],
        restrict_visit_types: product.restrict_visit_types || false,
      });
      const existingLinks = ((product as any).linked_supplies || []) as any[];
      setLinkedSupplies(
        existingLinks.map((row) => ({
          supply_product_id: Number(row.supply_product_id),
          quantity: Number(row.quantity || 1),
          is_included: Boolean(row.is_included),
        }))
      );
    } else {
      // Reset form for new product
      setFormData({
        name: "",
        beluga_internal_product_name: "",
        base_medication_name: "",
        description: "",
        application_directions: "",
        category: null,
        dose_mapping: null,
        titration_category: null,
        pharmacy: null,
        service_states: [],
        product_type: defaultProductType,
        purchase_type: "one_time",
        treatment: "weight_loss",
        treatment_type_id: null,
        rx_or_otc: "rx",
        base_price: "0.00",
        cost_to_client: "0.00",
        cost_to_welliemd: "0.00",
        shipping_cost_to_client: "0.00",
        shipping_cost_to_welliemd: "0.00",
        manufacturer_name: "",
        ndc_number: "",
        rx_drug_form: "tablet",
        rx_quantity: "30",
        rx_drug_strength: "",
        rx_days_supply: 30,
        refills: 0,
        beluga_medicine_id: "",
        provider_network: "welliemd",
        followup_days_after: 30,
        quantity: "100",
        is_active: true,
        requires_video_visit: false,
        allow_client_modifications: true,
        sync_to_tenants: false,
        allowed_visit_types: [],
        restrict_visit_types: false,
      });
      setLinkedSupplies([]);
    }
  }, [product, open, defaultProductType]);

  useEffect(() => {
    if (formData.product_type === "supply" && linkedSupplies.length > 0) {
      setLinkedSupplies([]);
    }
  }, [formData.product_type, linkedSupplies.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.beluga_medicine_id.trim()) {
      toast({
        title: "Validation Error",
        description: "Beluga Medicine ID is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.beluga_internal_product_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Beluga Internal Product Name is required",
        variant: "destructive",
      });
      return;
    }

    if (
      formData.restrict_visit_types &&
      (!formData.allowed_visit_types || formData.allowed_visit_types.length === 0)
    ) {
      toast({
        title: "Validation Error",
        description:
          "Please select at least one allowed visit type, or turn off restrictions.",
        variant: "destructive",
      });
      return;
    }

    if (formData.product_type !== "supply") {
      if (!formData.titration_category) {
        toast({
          title: "Validation Error",
          description: "Titration Category / Regimen is required",
          variant: "destructive",
        });
        return;
      }

      if (!formData.dose_mapping) {
        toast({
          title: "Validation Error",
          description: "Dose Level is required",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        base_price: parseFloat(formData.base_price),
        cost_to_client: parseFloat(formData.cost_to_client),
        cost_to_welliemd: parseFloat(formData.cost_to_welliemd),
        shipping_cost_to_client: parseFloat(formData.shipping_cost_to_client),
        shipping_cost_to_welliemd: parseFloat(formData.shipping_cost_to_welliemd),
        rx_quantity: parseFloat(formData.rx_quantity),
        quantity: parseInt(formData.quantity),
        service_states: formData.service_states,
        linked_supplies_payload:
          formData.product_type === "supply"
            ? []
            : linkedSupplies.map((row) => ({
                supply_product_id: row.supply_product_id,
                quantity: row.quantity,
                is_included: row.is_included,
              })),
      };

      if (product && !String(payload.treatment || "").trim()) {
        delete (payload as Partial<typeof payload>).treatment;
      }

      if (product) {
        await productApi.updateProduct(product.id, payload);
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        await productApi.createProduct(payload);
        toast({
          title: "Success",
          description: "Product created successfully",
        });
      }

      onSuccess();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error.response?.data?.error || `Failed to ${product ? "update" : "create"} product`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle>
            {product ? "Edit Product" : "Create New Product"}
          </DialogTitle>
          <DialogDescription>
            {product
              ? "Update product details below."
              : "Fill in the product information to create a new product."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Semaglutide 2.5mg"
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="beluga_internal_product_name">
                  Beluga Internal Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="beluga_internal_product_name"
                  value={formData.beluga_internal_product_name}
                  onChange={(e) => setFormData({ ...formData, beluga_internal_product_name: e.target.value })}
                  placeholder="e.g., Tirzepatide/B12 6mg (1 Month)"
                />
              </div>

              {/*
              <div className="col-span-2">
                <Label htmlFor="base_medication_name">Medication Family (Base Name)</Label>
                <Input
                  id="base_medication_name"
                  value={formData.base_medication_name}
                  onChange={(e) => setFormData({ ...formData, base_medication_name: e.target.value })}
                  placeholder="e.g., Semaglutide/B6"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used for grouping and prefill when applicable.
                </p>
              </div>
              */}

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product description"
                  rows={3}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="category">Product Category</Label>
                <CategorySelector
                  value={formData.category}
                  onChange={(categoryId) => setFormData({ ...formData, category: categoryId })}
                  disabled={loading}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="product_treatment_type">
                  Treatment Type{" "}
                  <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-sky-700">
                    New
                  </span>
                </Label>
                <Select
                  value={
                    formData.product_type === "supply"
                      ? "none"
                      : formData.treatment_type_id || "none"
                  }
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      treatment_type_id: value === "none" ? null : value,
                    })
                  }
                  disabled={loading || formData.product_type === "supply"}
                >
                  <SelectTrigger id="product_treatment_type">
                    <SelectValue
                      placeholder={
                        formData.product_type === "supply"
                          ? "Supplies do not have a clinical Treatment Type"
                          : "Select Treatment Type"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {formData.product_type === "supply"
                        ? "Not applicable"
                        : "Select Treatment Type"}
                    </SelectItem>
                    {treatmentTypes.map((type) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  New clinical relationship used by Programs and derived
                  routing. It is separate from the legacy controls below and is
                  optional while existing Products are migrated.
                </p>
                {formData.product_type !== "supply" && selectedTreatmentType && (
                  <div className="grid gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3 sm:grid-cols-2">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                        Derived intake Visit Type
                      </div>
                      <code className="mt-1 block text-sm text-slate-800">
                        {selectedTreatmentType.intakeVisitType || "Not configured"}
                      </code>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                        Derived follow-up Visit Type
                      </div>
                      <code className="mt-1 block text-sm text-slate-800">
                        {selectedTreatmentType.followupVisitType || "Not configured"}
                      </code>
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-2">
                <Label htmlFor="pharmacy">Pharmacy</Label>
                <Select
                  value={formData.pharmacy || "none"}
                  onValueChange={(value) => setFormData({ ...formData, pharmacy: value === "none" ? null : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pharmacy (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Pharmacy</SelectItem>
                    {pharmacies.map((pharmacy) => (
                      <SelectItem key={pharmacy.id} value={String(pharmacy.id)}>
                        {pharmacy.store_name || pharmacy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <ServiceStatesSelector
                  value={formData.service_states}
                  onChange={(states) => setFormData((prev) => ({ ...prev, service_states: states }))}
                  description="Leave empty to inherit pharmacy coverage. Set product-specific states only when a formulation has different licensing rules."
                />
              </div>

              <div>
                <Label htmlFor="product_type">Product Type</Label>
                <Select
                  value={formData.product_type}
                  onValueChange={(value) => setFormData({ ...formData, product_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="purchase_type">Purchase Type</Label>
                <Select
                  value={formData.purchase_type}
                  onValueChange={(value) => setFormData({ ...formData, purchase_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PURCHASE_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.product_type !== "supply" && (
              <div>
                <Label htmlFor="treatment">
                  Treatment{" "}
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                    Legacy
                  </span>
                </Label>
                <Select
                  value={formData.treatment}
                  onValueChange={(value) => setFormData({ ...formData, treatment: value })}
                  disabled={loadingTreatmentOptions}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingTreatmentOptions
                          ? "Loading treatments..."
                          : treatmentOptions.length === 0
                            ? "No treatments found"
                            : "Select treatment"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {treatmentOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                    {treatmentOptions.length === 0 && !loadingTreatmentOptions && (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No treatment types found in questionnaires
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Existing questionnaire classification retained unchanged for
                  compatibility.
                </p>
              </div>
              )}

              {formData.product_type !== "supply" && (
              <div>
                <Label htmlFor="rx_or_otc">RX/OTC</Label>
                <Select
                  value={formData.rx_or_otc}
                  onValueChange={(value) => setFormData({ ...formData, rx_or_otc: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RX_OTC_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pricing</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="base_price">
                  Patient Price ($)
                </Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  The amount shown to and charged to the patient. For a billed-separately supply, this is its patient price.
                </p>
              </div>

              <div>
                <Label htmlFor="cost_to_client">Medication Cost to Client ($)</Label>
                <Input
                  id="cost_to_client"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_to_client}
                  onChange={(e) => setFormData({ ...formData, cost_to_client: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="cost_to_welliemd">Cost to WellieMD ($)</Label>
                <Input
                  id="cost_to_welliemd"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_to_welliemd}
                  onChange={(e) => setFormData({ ...formData, cost_to_welliemd: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="shipping_cost_to_client">Shipping Cost to Client ($)</Label>
                <Input
                  id="shipping_cost_to_client"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.shipping_cost_to_client}
                  onChange={(e) => setFormData({ ...formData, shipping_cost_to_client: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="shipping_cost_to_welliemd">Shipping Cost to WellieMD ($)</Label>
                <Input
                  id="shipping_cost_to_welliemd"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.shipping_cost_to_welliemd}
                  onChange={(e) => setFormData({ ...formData, shipping_cost_to_welliemd: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Product Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ndc_number">NDC Number</Label>
                <Input
                  id="ndc_number"
                  value={formData.ndc_number}
                  onChange={(e) => setFormData({ ...formData, ndc_number: e.target.value })}
                  placeholder="National Drug Code"
                />
              </div>

              {formData.product_type !== "supply" && (
              <div>
                <Label htmlFor="rx_drug_form">Drug Form</Label>
                <Select
                  value={formData.rx_drug_form}
                  onValueChange={(value) => setFormData({ ...formData, rx_drug_form: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RX_DRUG_FORM_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              )}

              {formData.product_type !== "supply" && (
              <div>
                <Label htmlFor="rx_quantity">RX Quantity</Label>
                <Input
                  id="rx_quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.rx_quantity}
                  onChange={(e) => setFormData({ ...formData, rx_quantity: e.target.value })}
                />
              </div>
              )}

              {formData.product_type !== "supply" && (
              <div>
                <Label htmlFor="rx_drug_strength">Drug Strength</Label>
                <Input
                  id="rx_drug_strength"
                  value={formData.rx_drug_strength}
                  onChange={(e) => setFormData({ ...formData, rx_drug_strength: e.target.value })}
                  placeholder="e.g., 5mg/ml, 10mg"
                />
              </div>
              )}

              {formData.product_type !== "supply" && (
              <div>
                <Label htmlFor="rx_days_supply">Days Supply</Label>
                <Input
                  id="rx_days_supply"
                  type="number"
                  min="1"
                  value={formData.rx_days_supply}
                  onChange={(e) => setFormData({ ...formData, rx_days_supply: parseInt(e.target.value) })}
                />
              </div>
              )}

              {formData.product_type !== "supply" && (
              <div>
                <Label htmlFor="refills">Refills</Label>
                <Input
                  id="refills"
                  type="number"
                  min="0"
                  value={formData.refills}
                  onChange={(e) => setFormData({ ...formData, refills: parseInt(e.target.value) })}
                />
              </div>
              )}

              {formData.product_type !== "supply" && (
              <div>
                <Label htmlFor="followup_days_after">Follow-up Days After</Label>
                <Input
                  id="followup_days_after"
                  type="number"
                  min="0"
                  value={formData.followup_days_after}
                  onChange={(e) => setFormData({ ...formData, followup_days_after: parseInt(e.target.value) })}
                />
              </div>
              )}
            </div>
          </div>

          {/* Integration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Integration</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="beluga_medicine_id">
                  Beluga Medicine ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="beluga_medicine_id"
                  value={formData.beluga_medicine_id}
                  onChange={(e) => setFormData({ ...formData, beluga_medicine_id: e.target.value })}
                  placeholder="Beluga system ID"
                  required
                />
              </div>

              <div>
                <Label htmlFor="provider_network">Provider Network</Label>
                <Input
                  id="provider_network"
                  value={formData.provider_network}
                  onChange={(e) => setFormData({ ...formData, provider_network: e.target.value })}
                  placeholder="e.g., welliemd"
                />
              </div>
            </div>
          </div>

          {/* Simplified Product Configuration */}
          {formData.product_type !== "supply" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Product Configuration</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="titration_category">Titration Category / Regimen <span className="text-red-500">*</span></Label>
                <TitrationCategoryManager
                  value={formData.titration_category}
                  onChange={(categoryId) => setFormData({ ...formData, titration_category: categoryId })}
                  disabled={loading}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Select the regimen type (e.g., Alternative, Rapid, Twice Weekly)
                </p>
              </div>

              <div className="col-span-2">
                <Label htmlFor="dose_mapping">Dose Level <span className="text-red-500">*</span></Label>
                <Select
                  key={`dose-select-${doseMappings.length}-${formData.category}`}
                  value={formData.dose_mapping !== null ? formData.dose_mapping.toString() : "none"}
                  onValueChange={(value) => setFormData({ ...formData, dose_mapping: value === "none" ? null : parseInt(value) })}
                  disabled={!formData.category || loadingDoseMappings}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !formData.category
                        ? "Select a category first"
                        : loadingDoseMappings
                          ? "Loading dose levels..."
                          : "Select dose level (optional)"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Dose Level</SelectItem>
                    {doseMappings.map((doseMapping) => (
                      <SelectItem key={doseMapping.id} value={doseMapping.id.toString()}>
                        {doseMapping.patient_label}
                      </SelectItem>
                    ))}
                    {doseMappings.length === 0 && formData.category && !loadingDoseMappings && (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No dose levels found for this category
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Strongly recommended for reliable prefill and option matching.
                </p>
              </div>
            </div>
          </div>
          )}

          {/* Linked Required Supplies */}
          {formData.product_type !== "supply" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Linked Required Supplies</h3>
              <p className="text-sm text-muted-foreground">
                Attach supply SKUs to this medication. Mark a supply as included when the patient should not be charged for that item or its shipping.
              </p>

              <div className="space-y-3">
                {linkedSupplies.map((row, idx) => {
                  const selectedSupply = supplyProducts.find(
                    (p) => Number(p.id) === Number(row.supply_product_id)
                  );
                  const patientPrice = Number(selectedSupply?.base_price ?? 0);
                  const unitCost = Number(selectedSupply?.cost_to_client ?? 0);
                  const unitShipping = Number(selectedSupply?.shipping_cost_to_client ?? 0);
                  const qty = Number(row.quantity || 1);
                  const totalCharge = (unitCost + unitShipping) * qty;
                  return (
                    <div key={`${row.supply_product_id}-${idx}`} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <Select
                          value={String(row.supply_product_id)}
                          onValueChange={(value) => {
                            const next = [...linkedSupplies];
                            next[idx] = {
                              ...next[idx],
                              supply_product_id: Number(value),
                            };
                            setLinkedSupplies(next);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select supply product" />
                          </SelectTrigger>
                          <SelectContent>
                            {supplyProducts
                              .filter((p) => Number(p.id) !== Number(product?.id))
                              .map((supply) => (
                              <SelectItem key={String(supply.id)} value={String(supply.id)}>
                                {supply.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={(e) => {
                            const next = [...linkedSupplies];
                            next[idx] = {
                              ...next[idx],
                              quantity: Math.max(1, parseInt(e.target.value || "1", 10)),
                            };
                            setLinkedSupplies(next);
                          }}
                        />
                      </div>
                      <div className="col-span-3 flex items-center gap-2">
                        <Switch
                          checked={row.is_included}
                          onCheckedChange={(checked) => {
                            const next = [...linkedSupplies];
                            next[idx] = {
                              ...next[idx],
                              is_included: checked,
                            };
                            setLinkedSupplies(next);
                          }}
                        />
                        <span className="text-sm">
                          {row.is_included ? "Included (no extra charge)" : "Billed separately"}
                        </span>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setLinkedSupplies(linkedSupplies.filter((_, i) => i !== idx))}
                        >
                          Remove
                        </Button>
                      </div>
                      {selectedSupply && (
                        <div className="col-span-12 text-xs text-muted-foreground">
                          {row.is_included
                            ? `${selectedSupply.name} • Qty ${qty} • Included supply • No extra admin charge • No patient charge`
                            : `${selectedSupply.name} • Qty ${qty} • Patient price $${patientPrice.toFixed(2)} • Cost to Client $${unitCost.toFixed(2)} • Shipping $${unitShipping.toFixed(2)} • Admin charge: $${totalCharge.toFixed(2)} • Patient charge: billed separately`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!!linkedSupplies.length && (
                <div className="text-xs text-muted-foreground border rounded-md px-3 py-2 bg-muted/30">
                  Included supplies: {linkedSupplies.filter((row) => row.is_included).length} •
                  Billable supplies: {linkedSupplies.filter((row) => !row.is_included).length}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!supplyProducts.length) return;
                  const firstAvailable = supplyProducts.find((s) =>
                    !linkedSupplies.some((row) => Number(row.supply_product_id) === Number(s.id))
                  );
                  if (!firstAvailable) return;
                  setLinkedSupplies([
                    ...linkedSupplies,
                    {
                      supply_product_id: Number(firstAvailable.id),
                      quantity: 1,
                      is_included: false,
                    },
                  ]);
                }}
              >
                Add Supply
              </Button>
            </div>
          )}

          {/* Legacy availability filter; never clinical Treatment Type routing. */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Visit Type Restrictions{" "}
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                    Legacy
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Existing checkout recommendation availability behavior is
                  retained unchanged. This does not define the new Product
                  Treatment Type relationship.
                </p>
              </div>
              <Switch
                id="restrict_visit_types"
                checked={formData.restrict_visit_types}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, restrict_visit_types: checked })
                }
              />
            </div>

            {formData.restrict_visit_types && (
              <div className="bg-slate-50 border rounded-xl p-4 space-y-3 mt-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Select Allowed Visit Types
                </Label>
                {visitTypeOptions.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {visitTypeOptions.map((option) => {
                      const isChecked = formData.allowed_visit_types.includes(
                        option.value,
                      );
                      return (
                        <label
                          key={option.value}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-white shadow-sm cursor-pointer hover:bg-slate-50/50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const allowedVisitTypes = isChecked
                                ? formData.allowed_visit_types.filter(
                                    (value) => value !== option.value,
                                  )
                                : [
                                    ...formData.allowed_visit_types,
                                    option.value,
                                  ];
                              setFormData({
                                ...formData,
                                allowed_visit_types: allowedVisitTypes,
                              });
                            }}
                            className="rounded border-slate-300 text-[#12517A] focus:ring-[#12517A] h-4 w-4"
                          />
                          <span className="text-sm font-medium text-slate-700">
                            {option.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Create treatment types before restricting this product.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Settings</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="requires_video_visit">Requires Video Visit</Label>
                <Switch
                  id="requires_video_visit"
                  checked={formData.requires_video_visit}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_video_visit: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="allow_client_modifications">Allow Client Modifications</Label>
                <Switch
                  id="allow_client_modifications"
                  checked={formData.allow_client_modifications}
                  onCheckedChange={(checked) => setFormData({ ...formData, allow_client_modifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sync_to_tenants">Sync to Tenants</Label>
                <Switch
                  id="sync_to_tenants"
                  checked={formData.sync_to_tenants}
                  onCheckedChange={(checked) => setFormData({ ...formData, sync_to_tenants: checked })}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : product ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
