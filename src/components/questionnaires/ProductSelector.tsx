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
  regimen?: string;
  regimen_name?: string;
  dose_mapping?: number | string;  // Dose mapping ID; older saved configs may contain non-numeric values
  dose_mapping_label?: string;  // Patient-facing label
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
  const selectedCategory = categories.find((category) => {
    if (value?.category_id && Number(category.id) === Number(value.category_id)) return true;
    return category.name.toLowerCase() === String(value?.category || "").toLowerCase();
  });
  const selectedCategoryValue = selectedCategory?.name || value?.category || "";
  const savedDoseMappingId = Number(value?.dose_mapping);
  const hasValidSavedDoseMappingId = Number.isFinite(savedDoseMappingId) && savedDoseMappingId > 0;
  const rawSavedDoseLabel = String(
    value?.dose_mapping_label ||
      (!hasValidSavedDoseMappingId ? value?.dose_mapping : "") ||
      ""
  ).trim();
  const savedDoseLabel = rawSavedDoseLabel.toLowerCase() === "nan" ? "" : rawSavedDoseLabel;
  const selectedDoseMapping = doseMappings.find((mapping) => {
    if (hasValidSavedDoseMappingId && mapping.id === savedDoseMappingId) return true;
    const labels = [mapping.patient_label, mapping.name].filter(Boolean).map((label) => label.toLowerCase());
    return savedDoseLabel ? labels.includes(savedDoseLabel.toLowerCase()) : false;
  });
  const savedDoseFallbackValue = savedDoseLabel
    ? "__saved_dose_mapping__"
    : "";
  const selectedDoseMappingValue = selectedDoseMapping?.id.toString() || savedDoseFallbackValue;
  const hasUnresolvedSavedDose =
    !!value?.category &&
    !!value?.regimen &&
    hasValidSavedDoseMappingId &&
    !selectedDoseMapping &&
    !savedDoseLabel;

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const categoryName = selectedCategory?.name || value?.category;
    if (categoryName) {
      fetchRegimens(categoryName);
    } else {
      setRegimens([]);
    }
  }, [selectedCategory?.name, value?.category]);

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
    if (!value?.category) return;

    const selectedRegimen = regimens.find((r) => r.code === regimenCode);
    
    onChange({
      ...value,
      regimen: regimenCode,
      regimen_name: selectedRegimen?.name,
      // Reset dose_mapping when regimen changes
      dose_mapping: undefined,
      dose_mapping_label: undefined,
    });
  };

  const handleClear = () => {
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
              product_name: selectedCategory?.name || "",
              has_hierarchy: false,
            });
          }}
          disabled={disabled || loadingCategories}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select category..."} />
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

      {value?.category && (
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
              <SelectValue placeholder={loadingRegimens ? "Loading regimens..." : "Select regimen..."} />
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
      )}

      {value?.category && value?.regimen && (
        <div className="space-y-2">
          <Label>
            Select Dose Level <span className="text-red-500">*</span>
          </Label>
          <Select
            value={selectedDoseMappingValue}
            onValueChange={(doseMappingId) => {
              const selectedDoseMapping = doseMappings.find(
                (dm) => dm.id.toString() === doseMappingId
              );
              onChange({
                ...value,
                dose_mapping: parseInt(doseMappingId),
                dose_mapping_label: selectedDoseMapping?.patient_label,
              });
            }}
            disabled={disabled || loadingDoseMappings}
          >
            <SelectTrigger>
              <SelectValue 
                placeholder={
                  loadingDoseMappings 
                    ? "Loading dose levels..." 
                    : "Select dose level..."
                } 
              />
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

      {value?.category && value?.regimen && (selectedDoseMapping || savedDoseLabel) && (
        <div className="flex items-center justify-between rounded-md border p-3 text-sm bg-green-50 border-green-200">
          <div className="space-y-1">
            <div className="font-medium text-green-900">
              {value.category}
            </div>
            <div className="text-xs text-green-700">
              Regimen: {value.regimen_name || value.regimen}
            </div>
            <div className="text-xs text-green-700">
              Dose: {selectedDoseMapping?.patient_label || selectedDoseMapping?.name || savedDoseLabel}
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
