export const formatLabTimelineDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).replace(",", " •");
};

export const formatLabOrderDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatLabCollectionMethod = (method?: string) => {
  if (!method) return "Collection method unavailable";
  const labels: Record<string, string> = {
    testkit: "At-home test kit",
    walk_in_test: "Walk-in lab draw",
    at_home_phlebotomy: "At-home phlebotomy",
    on_site_collection: "On-site collection",
  };
  return labels[method] || method.replace(/_/g, " ");
};

/** Convert a payment processor identifier into staff-facing payment text. */
export const formatLabPaymentProvider = (provider?: string) => {
  const normalized = provider?.trim().toLowerCase();
  if (!normalized) return "—";
  const labels: Record<string, string> = {
    stripe: "Stripe",
    nmi: "NMI",
    authorizenet: "Authorize.net",
    zero_total: "Not applicable — no payment required",
  };

  return labels[normalized]
    || normalized.replace(/_/g, " ").replace(/^./, (character) => character.toUpperCase());
};
