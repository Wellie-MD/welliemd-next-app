import type { ProgramCheckoutProduct } from "@/features/treatments/types";

export function formatCheckoutQuestionText(
  products?: ProgramCheckoutProduct[],
  defaultText?: string
): string {
  if (!products || products.length === 0) {
    if (defaultText && defaultText !== "Checkout Options") {
      return defaultText.startsWith("Product Options - ")
        ? defaultText
        : `Product Options - ${defaultText}`;
    }
    return "Product Options - Checkout Options";
  }

  const optionLabels = products
    .map((product) => {
      const category = product.category?.trim();
      const dose = (product.doseLabel || product.patientLabel)?.trim();

      if (category && dose) {
        return `${category} - ${dose}`;
      }
      return category || dose || "";
    })
    .filter(Boolean);

  const uniqueLabels = Array.from(new Set(optionLabels));

  if (uniqueLabels.length === 0) {
    if (defaultText && defaultText !== "Checkout Options") {
      return defaultText.startsWith("Product Options - ")
        ? defaultText
        : `Product Options - ${defaultText}`;
    }
    return "Product Options - Checkout Options";
  }

  return `Product Options - ${uniqueLabels.join(", ")}`;
}
