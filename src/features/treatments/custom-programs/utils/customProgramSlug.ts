import { slugify } from "../../api/mappers";

const MAX_SLUG_LENGTH = 200;

const fitSlug = (value: string): string => value
  .slice(0, MAX_SLUG_LENGTH)
  .replace(/-+$/g, "");

/**
 * Suggest a readable slug that is not already used by another custom program.
 * The API remains authoritative because another admin can create the same
 * slug concurrently, but this prevents the normal duplicate-name path.
 */
export const suggestUniqueCustomProgramSlug = (
  name: string,
  existingSlugs: readonly string[],
): string => {
  const base = fitSlug(slugify(name) || "custom-program");
  const used = new Set(existingSlugs.map((slug) => slugify(slug)));

  if (!used.has(base)) return base;

  for (let suffix = 2; ; suffix += 1) {
    const suffixText = `-${suffix}`;
    const candidate = `${fitSlug(base.slice(0, MAX_SLUG_LENGTH - suffixText.length))}${suffixText}`;
    if (!used.has(candidate)) return candidate;
  }
};
