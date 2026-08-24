import type { Product } from "@/api/products";

let cachedProducts: Product[] | null = null;
let inFlightRequest: Promise<Product[]> | null = null;
let cacheGeneration = 0;

/**
 * Load the catalog once for the current app session. The caller owns the
 * loader so this utility does not make the cache dependent on a timer.
 */
export const loadCatalogProducts = (
  loader: () => Promise<Product[]>,
): Promise<Product[]> => {
  if (cachedProducts) return Promise.resolve(cachedProducts);
  if (inFlightRequest) return inFlightRequest;

  const requestGeneration = cacheGeneration;
  const request = loader()
    .then((products) => {
      const normalizedProducts = products || [];
      if (requestGeneration === cacheGeneration) {
        cachedProducts = normalizedProducts;
        inFlightRequest = null;
      }
      return normalizedProducts;
    })
    .catch((error) => {
      if (requestGeneration === cacheGeneration) inFlightRequest = null;
      throw error;
    });

  inFlightRequest = request;
  return request;
};

/** Clear catalog data after a successful product metadata mutation. */
export const invalidateCatalogProductsCache = (): void => {
  cacheGeneration += 1;
  cachedProducts = null;
  inFlightRequest = null;
};
