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
  regimen?: string;
  regimen_name?: string;
  dose_mapping?: number;  // Dose mapping ID
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

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (value?.category) {
      fetchRegimens(value.category);
    } else {
      setRegimens([]);
    }
  }, [value?.category]);

  useEffect(() => {
    if (value?.category) {
      fetchDoseMappings(value.category);
    } else {
      setDoseMappings([]);
    }
  }, [value?.category]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await axiosInstance.get("/products/categories/");
      const cats = response.data.results || response.data || [];
      setCategories(cats);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchRegimens = async (medication: string) => {
    setLoadingRegimens(true);
    try {
      // We don't pass client_id here, so backend will return all available regimens for this medication
      const response = await axiosInstance.get("/products/available-regimens/", {
        params: { medication },
      });
      setRegimens(response.data.regimens || []);
    } catch (error) {
      console.error("Failed to fetch regimens:", error);
      setRegimens([]);
    } finally {
      setLoadingRegimens(false);
    }
  };

  const fetchDoseMappings = async (medication: string) => {
    setLoadingDoseMappings(true);
    try {
      // First, get the category for this medication
      const categories = await productCategoryApi.listCategories();
      const category = categories.find(c => 
        c.name.toLowerCase().includes(medication.toLowerCase())
      );
      
      if (category) {
        const response = await listDoseMappings({
          category: category.id,
          page_size: 100,
        });
        setDoseMappings(response.results || []);
      } else {
        setDoseMappings([]);
      }
    } catch (error) {
      console.error("Failed to fetch dose mappings:", error);
      setDoseMappings([]);
    } finally {
      setLoadingDoseMappings(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    const selectedCategory = categories.find(c => c.id === categoryId);
    // Reset regimen and dose when category changes
    onChange({
      medication_base_name: selectedCategory?.name || '',
      product_name: selectedCategory?.name || '', // Fallback name
      has_hierarchy: false,
    });
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
          value={value?.category || ""}
          onValueChange={(categoryName) => {
            // Find the category to get its full details if needed
            const selectedCategory = categories.find(c => c.name === categoryName);
            onChange({
              category: categoryName,
              product_name: categoryName,
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
            value={value.dose_mapping?.toString() || ""}
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
        Generic category name without pharmacy suffix. The questionnaire app will dynamically match products based on patient selections.
      </p>

      {/* Selected Configuration Display */}
      {value?.category && value?.regimen && value?.dose_mapping && (
        <div className="flex items-center justify-between rounded-md border p-3 text-sm bg-green-50 border-green-200">
          <div className="space-y-1">
            <div className="font-medium text-green-900">
              {value.category}
            </div>
            <div className="text-xs text-green-700">
              Regimen: {value.regimen_name || value.regimen}
            </div>
            <div className="text-xs text-green-700">
              Dose: {value.dose_mapping_label}
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
