import {
  isToday,
  isYesterday,
  isThisWeek,
  format,
  formatISO,
} from "date-fns";

export function getMessageGroupLabel(dateStr: string) {
  const date = new Date(dateStr);

  if (isToday(date)) {
    return "Today";
  }
  if (isYesterday(date)) {
    return "Yesterday";
  }
  if (isThisWeek(date)) {
    return format(date, "EEEE"); // Monday, Tuesday...
  }
  return format(date, "MMM d, yyyy"); // Sep 12, 2025
}

export function groupMessagesByDate<T extends { timestamp: string }>(messages: T[]) {
  const groups: Record<string, T[]> = {};

  messages.forEach((msg) => {
    const date = formatISO(new Date(msg.timestamp), { representation: "date" });
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
  });

  return groups;
}
