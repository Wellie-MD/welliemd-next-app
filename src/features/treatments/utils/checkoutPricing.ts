import type { ProgramCheckoutProduct } from "@/features/treatments/types";

/**
 * Mock monthly pricing keyed by Category → Dose label.
 * Ported from the client prototype's `_ftGetPrice` so the Patient Flow Test
 * cart totals match the prototype until a real pricing API is wired in.
 *
 * Adapter boundary: an admin-configured `product.price` always wins; this map
 * is only the fallback when a checkout product has no explicit price.
 */
const CHECKOUT_PRICE_MAP: Record<string, Record<string, number>> = {
  Semaglutide: {
    "Wegovy 0.25mg": 249,
    "Wegovy 0.5mg": 269,
    "Wegovy 1.0mg": 289,
    "Semaglutide 0.2mg": 199,
    "Semaglutide 0.2mg Microdosing": 179,
  },
  Tirzepatide: {
    "Zepbound 2.5mg": 299,
    "Zepbound 5mg": 329,
    "Tirzepatide 1.5mg": 259,
    "Tirzepatide 1.5mg Microdosing": 219,
  },
  Sildenafil: {
    "Sildenafil 20mg": 89,
    "Sildenafil Citrate 20mg": 89,
  },
  Tadalafil: {
    "Tadalafil 2.5mg": 99,
    "Tadalafil 5mg": 109,
  },
  TRT: {
    "Testosterone Cypionate 200mg": 159,
    TRT: 149,
  },
  Sertraline: {
    "Sertraline 50mg": 49,
    "Sertraline 100mg": 59,
  },
  "NAD+": {
    "NAD+ 100mg": 129,
    "NAD+ 250mg": 199,
    "NAD+": 159,
  },
  Sermorelin: {
    "Sermorelin 3mg": 179,
    "Sermorelin 5mg": 229,
    Sermorelin: 199,
  },
  Enclomiphene: {
    "Enclomiphene 12.5mg": 129,
  },
  Estradiol: {
    "Estradiol 0.5mg": 79,
    "Estradiol 1.0mg": 89,
  },
  Progesterone: {
    "Progesterone 100mg": 69,
  },
  Glutathione: {
    "Glutathione 200mg": 99,
    Glutathione: 89,
  },
};

/**
 * Resolve a checkout product's price. Returns the explicit configured price
 * when present, otherwise the structured map fallback, otherwise null when
 * the product is not priced.
 */
export const getCheckoutProductPrice = (
  product: Pick<ProgramCheckoutProduct, "category" | "doseLabel" | "price">
): number | null => {
  if (typeof product.price === "number" && Number.isFinite(product.price)) {
    return product.price;
  }
  const mapped = CHECKOUT_PRICE_MAP[product.category]?.[product.doseLabel];
  return mapped ?? null;
};

export const formatCheckoutMoney = (value: number | null): string =>
  value == null ? "$—" : `$${value.toFixed(2)}`;
