import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosInstance from "@/api/axiosInstance";
import { listDoseMappings, ProductDoseMapping } from "@/api/productDoseMappings";
import { productCategoryApi } from "@/api/productCategories";

interface MedicationConfig {
  category: string;
  category_id?: number;
  medication_base_name?: string;
  regimen?: string;
  regimen_name?: string;
  dose_mapping?: number | string; // Dose mapping ID; older saved configs may contain non-numeric values
  dose_mapping_id?: number | string;
  dose_mapping_name?: string;
  dose_mapping_label?: string; // Patient-facing label
  dose_level?: number | string;
  dose_level_id?: number | string;
  dose_label?: string;
  dose?: string;
  // These are kept for compatibility but might be empty for generic selection
  product_id?: string;
  product_name?: string;
  has_hierarchy?: boolean;
}

interface ProductSelectorProps {
  value?: MedicationConfig | null;
  onChange: (config: MedicationConfig | null) => void;
  disabled?: boolean;
}

interface Regimen {
  code: string;
  name: string;
  description: string;
}

interface DisplaySnapshot {
  category: string;
  regimen: string;
  dose: string;
}

export function ProductSelector({
  value,
  onChange,
  disabled,
}: ProductSelectorProps) {
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const [regimens, setRegimens] = useState<Regimen[]>([]);
  const [doseMappings, setDoseMappings] = useState<ProductDoseMapping[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingRegimens, setLoadingRegimens] = useState(false);
  const [loadingDoseMappings, setLoadingDoseMappings] = useState(false);
  const [displaySnapshot, setDisplaySnapshot] = useState<DisplaySnapshot>({
    category: "",
    regimen: "",
    dose: "",
  });

  const getNumericValue = (...values: Array<number | string | undefined>) => {
    for (const currentValue of values) {
      if (currentValue === undefined || currentValue === null || currentValue === "") continue;
      const numericValue = Number(currentValue);
      if (Number.isFinite(numericValue) && numericValue > 0) return numericValue;
    }
    return undefined;
  };

  const getTextValue = (...values: Array<number | string | undefined>) => {
    for (const currentValue of values) {
      if (currentValue === undefined || currentValue === null) continue;
      const textValue = String(currentValue).trim();
      if (!textValue || textValue.toLowerCase() === "nan") continue;
      if (Number.isFinite(Number(textValue))) continue;
      return textValue;
    }
    return "";
  };

  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const savedCategoryName = String(
    value?.category || value?.medication_base_name || value?.product_name || ""
  ).trim();
  const selectedCategory = categories.find((category) => {
    if (value?.category_id && Number(category.id) === Number(value.category_id)) return true;
    return normalizeText(category.name) === normalizeText(savedCategoryName);
  });
  const selectedCategoryValue = selectedCategory?.name || savedCategoryName;
  const savedDoseMappingId = getNumericValue(
    value?.dose_mapping,
    value?.dose_mapping_id,
    value?.dose_level_id,
    value?.dose_level
  );
  const savedDoseLabel = getTextValue(
    value?.dose_mapping_label,
    value?.dose_mapping_name,
    value?.dose_label,
    value?.dose,
    value?.dose_mapping,
    value?.dose_level
  );
  const normalizedSavedDoseLabel = normalizeText(savedDoseLabel);
  const selectedDoseMapping = doseMappings.find((mapping) => {
    if (savedDoseMappingId && mapping.id === savedDoseMappingId) return true;
    const labels = [mapping.patient_label, mapping.name].filter(Boolean).map(normalizeText);
    return normalizedSavedDoseLabel
      ? labels.some((label) => (
          label === normalizedSavedDoseLabel ||
          label.includes(normalizedSavedDoseLabel) ||
          normalizedSavedDoseLabel.includes(label)
        ))
      : false;
  });
  const savedDoseFallbackValue = savedDoseLabel
    ? "__saved_dose_mapping__"
    : "";
  const selectedDoseMappingValue = selectedDoseMapping?.id.toString() || savedDoseFallbackValue;
  const selectedDoseDisplayLabel =
    selectedDoseMapping?.patient_label ||
    selectedDoseMapping?.name ||
    savedDoseLabel;
  const categoryDisplayLabel = selectedCategoryValue || displaySnapshot.category;
  const regimenDisplayLabel = value?.regimen_name || value?.regimen || displaySnapshot.regimen;
  const doseDisplayLabel = selectedDoseDisplayLabel || displaySnapshot.dose;
  const hasUnresolvedSavedDose =
    !!value?.category &&
    !!value?.regimen &&
    !!savedDoseMappingId &&
    !selectedDoseMapping &&
    !savedDoseLabel;

  useEffect(() => {
    setDisplaySnapshot((previousSnapshot) => ({
      category: selectedCategoryValue || previousSnapshot.category,
      regimen: value?.regimen_name || value?.regimen || previousSnapshot.regimen,
      dose: selectedDoseDisplayLabel || previousSnapshot.dose,
    }));
  }, [selectedCategoryValue, value?.regimen_name, value?.regimen, selectedDoseDisplayLabel]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const categoryName = selectedCategory?.name || savedCategoryName;
    if (categoryName) {
      fetchRegimens(categoryName);
    } else {
      setRegimens([]);
    }
  }, [selectedCategory?.name, savedCategoryName]);

  useEffect(() => {
    const categoryId = selectedCategory?.id || value?.category_id;
    if (categoryId) {
      fetchDoseMappings(Number(categoryId));
    } else {
      setDoseMappings([]);
    }
  }, [selectedCategory?.id, value?.category_id]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const cats = await productCategoryApi.listCategories();
      setCategories(cats.map((category) => ({
        id: String(category.id),
        name: category.name,
      })));
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchRegimens = async (category: string) => {
    setLoadingRegimens(true);
    try {
      // We don't pass client_id here, so backend will return all available regimens for this category
      const response = await axiosInstance.get("/products/available-regimens/", {
        params: { category },
      });
      setRegimens(response.data.regimens || []);
    } catch (error) {
      console.error("Failed to fetch regimens:", error);
      setRegimens([]);
    } finally {
      setLoadingRegimens(false);
    }
  };

  const fetchDoseMappings = async (categoryId: number) => {
    setLoadingDoseMappings(true);
    try {
      const response = await listDoseMappings({
        category: categoryId,
        page_size: 100,
      });
      setDoseMappings(response.results || []);
    } catch (error) {
      console.error("Failed to fetch dose mappings:", error);
      setDoseMappings([]);
    } finally {
      setLoadingDoseMappings(false);
    }
  };

  const handleRegimenSelect = (regimenCode: string) => {
    if (!savedCategoryName) return;

    const selectedRegimen = regimens.find((r) => r.code === regimenCode);
    
    onChange({
      ...value,
      category: selectedCategory?.name || savedCategoryName,
      category_id: selectedCategory ? Number(selectedCategory.id) : value?.category_id,
      regimen: regimenCode,
      regimen_name: selectedRegimen?.name,
      // Reset dose_mapping when regimen changes
      dose_mapping: undefined,
      dose_mapping_label: undefined,
    });
  };

  const handleClear = () => {
    setDisplaySnapshot({ category: "", regimen: "", dose: "" });
    onChange(null);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>
          Select Category <span className="text-red-500">*</span>
        </Label>
        <Select
          value={selectedCategoryValue}
          onValueChange={(categoryName) => {
            const selectedCategory = categories.find(c => c.name === categoryName);
            onChange({
              category_id: selectedCategory ? Number(selectedCategory.id) : undefined,
              category: selectedCategory?.name || "",
              medication_base_name: selectedCategory?.name || "",
              product_name: selectedCategory?.name || "",
              has_hierarchy: false,
            });
          }}
            disabled={disabled || loadingCategories}
        >
          <SelectTrigger>
            {categoryDisplayLabel ? (
              <span>{categoryDisplayLabel}</span>
            ) : (
              <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select category..."} />
            )}
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {savedCategoryName || displaySnapshot.category ? (
        <div className="space-y-2">
          <Label>
            Select Titration Category / Regimen <span className="text-red-500">*</span>
          </Label>
          <Select
            value={value.regimen || ""}
            onValueChange={handleRegimenSelect}
            disabled={disabled || loadingRegimens}
          >
            <SelectTrigger>
              {regimenDisplayLabel ? (
                <span>{regimenDisplayLabel}</span>
              ) : (
                <SelectValue placeholder={loadingRegimens ? "Loading regimens..." : "Select regimen..."} />
              )}
            </SelectTrigger>
            <SelectContent>
              {regimens.map((regimen) => (
                <SelectItem key={regimen.code} value={regimen.code}>
                  {regimen.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {(savedCategoryName || displaySnapshot.category) &&
        (value?.regimen || displaySnapshot.regimen) && (
        <div className="space-y-2">
          <Label>
            Select Dose Level <span className="text-red-500">*</span>
          </Label>
          <Select
            value={selectedDoseMappingValue}
            onValueChange={(doseMappingId) => {
              if (doseMappingId === "__saved_dose_mapping__") return;
              const selectedDoseMapping = doseMappings.find(
                (dm) => dm.id.toString() === doseMappingId
              );
              onChange({
                ...value,
                category: selectedCategory?.name || savedCategoryName,
                category_id: selectedCategory ? Number(selectedCategory.id) : value?.category_id,
                dose_mapping: parseInt(doseMappingId),
                dose_mapping_id: parseInt(doseMappingId),
                dose_mapping_label: selectedDoseMapping?.patient_label,
                dose_mapping_name: selectedDoseMapping?.name,
              });
            }}
            disabled={disabled || loadingDoseMappings}
          >
            <SelectTrigger>
              {doseDisplayLabel ? (
                <span>{doseDisplayLabel}</span>
              ) : (
                <SelectValue
                  placeholder={
                    loadingDoseMappings
                      ? "Loading dose levels..."
                      : "Select dose level..."
                  }
                />
              )}
            </SelectTrigger>
            <SelectContent>
              {!selectedDoseMapping && savedDoseLabel && (
                <SelectItem value="__saved_dose_mapping__">
                  {savedDoseLabel}
                </SelectItem>
              )}
              {doseMappings.map((doseMapping) => (
                <SelectItem key={doseMapping.id} value={doseMapping.id.toString()}>
                  {doseMapping.patient_label}
                </SelectItem>
              ))}
              {doseMappings.length === 0 && !loadingDoseMappings && (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No dose levels found for this medication
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Checkout config is structured: Category, Regimen, and Dose Mapping.
        Product names may remain official/messy; matching uses structured fields.
      </p>

      {/* Selected Configuration Display */}
      {value?.category && value?.regimen && hasUnresolvedSavedDose && (
        <div className="rounded-md border p-3 text-sm bg-muted/30 text-muted-foreground">
          Loading saved dose mapping...
        </div>
      )}

      {(savedCategoryName || displaySnapshot.category) &&
        (value?.regimen || displaySnapshot.regimen) &&
        (selectedDoseMapping || savedDoseLabel || displaySnapshot.dose) && (
        <div className="flex items-center justify-between rounded-md border p-3 text-sm bg-green-50 border-green-200">
          <div className="space-y-1">
            <div className="font-medium text-green-900">
              {categoryDisplayLabel}
            </div>
            <div className="text-xs text-green-700">
              Regimen: {regimenDisplayLabel}
            </div>
            <div className="text-xs text-green-700">
              Dose: {doseDisplayLabel}
            </div>
            <div className="text-xs text-green-700">
              ✓ Patients will select duration at checkout
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
