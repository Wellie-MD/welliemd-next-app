import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { titrationCategoryApi, TitrationCategory } from "@/api/titrationCategories";

interface TitrationCategorySelectorProps {
  value: number | null;
  onChange: (categoryId: number | null) => void;
  disabled?: boolean;
}

export function TitrationCategorySelector({
  value,
  onChange,
  disabled = false,
}: TitrationCategorySelectorProps) {
  const [categories, setCategories] = useState<TitrationCategory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await titrationCategoryApi.listCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch titration categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <Select
      value={value?.toString() || "none"}
      onValueChange={(val) => onChange(val === "none" ? null : parseInt(val))}
      disabled={disabled || loading}
    >
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Loading..." : "Select regimen (optional)"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No Regimen</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id.toString()}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
