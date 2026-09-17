interface QuestionnaireRuntimeUrlInput {
  baseUrl: string;
  platformClientId?: string;
  route: "start" | "visit";
  slug: string;
}

export function buildQuestionnaireRuntimeUrl({
  baseUrl,
  platformClientId,
  route,
  slug,
}: QuestionnaireRuntimeUrlInput) {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const encodedSlug = encodeURIComponent(slug);

  try {
    const parsed = new URL(normalizedBase);
    const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(
      parsed.hostname,
    );
    if (isLocalHost && platformClientId) {
      return `${normalizedBase}/${encodeURIComponent(platformClientId)}/${route}/${encodedSlug}`;
    }
  } catch {
    // Preserve relative or tenant-proxied bases supplied by deployment config.
  }

  return `${normalizedBase}/${route}/${encodedSlug}`;
}
