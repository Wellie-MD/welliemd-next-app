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

export function labOrderToneStyles(status: string): [string, string, string] {
  const t = (status || "").toLowerCase();
  if (/cancel|fail|declin/.test(t)) return ["#fee2e2", "#991b1b", "#fecaca"];
  if (/partially/.test(t)) return ["#ffedd5", "#9a3412", "#fed7aa"];
  if (/not started|draft/.test(t)) return ["#f1f5f9", "#64748b", "#e2e8f0"];
  if (/paid|shipped|delivered|completed|results ready|prescribed/.test(t)) return ["#dcfce7", "#166534", "#bbf7d0"];
  if (/authorized|beluga|rx sent|at lab|in process/.test(t)) return ["#dbeafe", "#1e40af", "#bfdbfe"];
  return ["#fef3c7", "#92400e", "#fde68a"];
}
