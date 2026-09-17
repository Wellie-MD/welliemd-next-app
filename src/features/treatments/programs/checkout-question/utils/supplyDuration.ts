export const normalizedRefills = (refills?: number | string | null): number => {
  const value = Number(refills);
  return Number.isInteger(value) && value > 0 ? value : 0;
};

export const effectiveSupplyDuration = (
  daysSupply?: number | string | null,
  refills?: number | string | null,
): number | undefined => {
  const days = Number(daysSupply);
  if (!Number.isInteger(days) || days <= 0) return undefined;
  return days * (normalizedRefills(refills) + 1);
};

export const supplyDurationLabel = (
  daysSupply?: number | string | null,
  refills?: number | string | null,
): string => {
  const days = Number(daysSupply);
  if (!Number.isInteger(days) || days <= 0) return "Supply duration missing";
  const count = normalizedRefills(refills);
  return `${days}-day supply${count > 0 ? ` + ${count} refill${count === 1 ? "" : "s"}` : ""}`;
};
