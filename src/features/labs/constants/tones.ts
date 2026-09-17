export function labPillTone(value: string) {
  const v = (value || "").toLowerCase();
  if (/auth|void|fail|failed|error|critical|canceled|cancelled/.test(v)) {
    return "bg-red-50 text-red-700 border-red-200";
  }
  if (/pending|partial/.test(v)) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (/paid|ready|completed|result/.test(v)) {
    return "bg-green-50 text-green-700 border-green-200";
  }
  if (/at lab|sample|requisition|appointment scheduled|booked|shipped|delivered/.test(v)) {
    return "bg-teal-50 text-teal-700 border-teal-200";
  }
  if (/in process|processing|update/.test(v)) {
    return "bg-sky-50 text-sky-700 border-sky-200";
  }
  return "bg-slate-50 text-slate-700 border-slate-200";
}
