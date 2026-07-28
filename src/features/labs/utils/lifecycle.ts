export const getLabEventTime = (events: any[] | undefined, matchers: string[]) => {
  if (!events) return null;
  const event = events.find((item: any) =>
    matchers.some((matcher) => String(item.status || item.event_type || "").toLowerCase().includes(matcher))
  );
  if (!event) return null;
  return new Date(event.created_at || event.timestamp || event.occurred_at || "").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
