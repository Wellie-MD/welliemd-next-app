import { toast } from "@/components/ui/use-toast";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const collectErrorMessages = (value: unknown): string[] => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectErrorMessages);
  if (!isRecord(value)) return [];
  return Object.values(value).flatMap(collectErrorMessages);
};

const isSlugUpdateEndpoint = (url: unknown) =>
  typeof url === "string" &&
  /treatments\/(programs|custom-programs)\/[^/]+\/slug\/?$/.test(url);

const isProgramSaveEndpoint = (url: unknown) =>
  typeof url === "string" &&
  /treatments\/(programs|custom-programs)\/[^/]+\/?$/.test(url);

const requestPayloadHasSlug = (payload: unknown) => {
  if (typeof payload !== "string") return false;

  try {
    const parsed = JSON.parse(payload) as unknown;
    return isRecord(parsed) && typeof parsed.slug === "string";
  } catch {
    return false;
  }
};

export const isDuplicateSlugError = (error: unknown) => {
  if (!isRecord(error) || !isRecord(error.response)) return false;

  const status = error.response.status;
  const data = error.response.data;
  if (status !== 400 || !isRecord(data)) return false;

  const slugMessages = collectErrorMessages(data.slug);
  const nonFieldMessages = collectErrorMessages(data.non_field_errors);
  const allMessages = collectErrorMessages(data);
  const messagesToInspect =
    slugMessages.length > 0 || nonFieldMessages.length > 0
      ? [...slugMessages, ...nonFieldMessages]
      : allMessages;

  if (
    messagesToInspect.some((message) => {
      const normalized = message.toLowerCase();
      return (
        normalized.includes("unique slug") ||
        normalized.includes("already in use") ||
        normalized.includes("already exists") ||
        normalized.includes("with this slug")
      );
    })
  ) {
    return true;
  }

  const genericMessage = typeof data.error === "string" ? data.error.toLowerCase() : "";
  const requestUrl = isRecord(error.config) ? error.config.url : undefined;
  const requestData = isRecord(error.config) ? error.config.data : undefined;

  return (
    genericMessage === "invalid request. please check your input." &&
    (isSlugUpdateEndpoint(requestUrl) ||
      (isProgramSaveEndpoint(requestUrl) && requestPayloadHasSlug(requestData)))
  );
};

export const showDuplicateSlugToast = () => {
  toast({
    title: "Please enter a unique slug",
    variant: "destructive",
  });
};
