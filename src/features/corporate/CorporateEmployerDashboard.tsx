import { useEffect, useState } from "react";
import { Activity, ArrowLeft, BookOpen, CheckCircle2, CreditCard, Loader2, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CorporateEmployerDashboardPayload } from "./contracts";
import { fetchEmployerDashboard } from "./corporateApi";
import { getCorporateClientMode } from "./config";
import { restoreOperatorContext } from "./handoffAdapter";

const activityLabel = (action: string) => ({ tenant_switch_issued: "Secure handoff issued", tenant_switch_consumed: "Employer context established", pilot_seed_ready: "Pilot data prepared" }[action] || action.replaceAll("_", " "));

export default function CorporateEmployerDashboard() {
  const [dashboard, setDashboard] = useState<CorporateEmployerDashboardPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); setError(""); try { setDashboard(await fetchEmployerDashboard()); } catch (reason: any) { setError(reason?.response?.data?.error || "Employer dashboard data could not be loaded."); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  // Direct employer accounts must not be offered an operator escape hatch.
  // Only a handoff-issued employer session can return to the operator surface.
  const returnToOperator = getCorporateClientMode() === "employer" && Boolean(window.sessionStorage.getItem("corp-operator-access-token"));
  const exitEmployer = () => { if (restoreOperatorContext()) window.location.replace("/dashboard/corporate/workspace"); else window.location.replace("/auth/signin"); };
  if (loading) return <div className="flex min-h-[55vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (!dashboard) return <div className="p-8"><Card className="border-destructive/30"><CardContent className="p-6"><p className="font-semibold">Employer context unavailable</p><p className="mt-1 text-sm text-muted-foreground">{error}</p><div className="mt-4 flex gap-2">{returnToOperator && <Button variant="outline" onClick={exitEmployer}><ArrowLeft className="mr-2 h-4 w-4" />Return to operator</Button>}<Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button></div></CardContent></Card></div>;
  const { context, metrics, programs } = dashboard;
  return <div className="space-y-6 p-4 sm:p-6 lg:p-8">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div>{returnToOperator && <Button variant="ghost" size="sm" onClick={exitEmployer} className="-ml-3 mb-2"><ArrowLeft className="mr-2 h-4 w-4" />Return to operator</Button>}<div className="mb-2 flex items-center gap-2"><Badge>Corporate pilot</Badge><Badge variant="outline">Employer Admin context</Badge></div><h1 className="text-2xl font-bold">Corporate Employer Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">Current tenant: {context.name}</p></div><Badge variant="secondary"><ShieldCheck className="mr-1 h-3.5 w-3.5" />{dashboard.privacy}</Badge></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{[{ label: "Roster", value: metrics.roster, icon: Users }, { label: "Active", value: metrics.active, icon: Users }, { label: "Invited", value: metrics.invited, icon: Users }, { label: "Utilization", value: `${metrics.utilization_percent}%`, icon: Activity }, { label: "Programs", value: metrics.assigned_programs, icon: BookOpen }, { label: "Billing snapshot", value: metrics.billing_snapshot, icon: CreditCard }].map(({ label, value, icon: Icon }) => <Card key={label}><CardContent className="p-4"><Icon className="mb-3 h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></CardContent></Card>)}</div>
    <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]"><Card><CardHeader><CardTitle className="text-base">Assigned programs</CardTitle></CardHeader><CardContent className="space-y-3">{programs.length ? programs.map((program) => <div key={program.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{program.name}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{program.description}</p></div><Badge>{program.status_label}</Badge></div><p className="mt-3 text-xs text-muted-foreground">{program.orientation_modules.length} orientation modules · {program.gates.length} gates</p></div>) : <p className="text-sm text-muted-foreground">No pilot-ready program is assigned.</p>}</CardContent></Card><Card><CardHeader><CardTitle className="text-base">Gate snapshot</CardTitle></CardHeader><CardContent className="space-y-3">{dashboard.gate_snapshot.map((gate) => <div key={gate.number} className="flex items-center justify-between rounded-lg border p-3"><div><p className="font-medium">Gate {gate.number}: {gate.name}</p><p className="text-xs text-muted-foreground">{gate.description}</p></div><span className="text-xl font-bold">{gate.count}</span></div>)}</CardContent></Card></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4" />Audited pilot activity</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{dashboard.activity.map((event) => <div key={event.id} className="flex items-start gap-3 rounded-lg border p-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /><div><p className="text-sm font-medium capitalize">{activityLabel(event.action)}</p><p className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p></div></div>)}</CardContent></Card>
  </div>;
}
