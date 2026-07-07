export const eventTime = (
  events: Array<Record<string, unknown>>,
  matcher: (event: Record<string, unknown>) => boolean,
) => {
  const event = events.find(matcher);
  return String(event?.created_at || event?.timestamp || event?.occurred_at || "");
};
