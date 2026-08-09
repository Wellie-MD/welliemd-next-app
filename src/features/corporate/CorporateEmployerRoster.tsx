import { useEffect, useState } from "react";
import { Activity, Loader2, RefreshCw, ShieldCheck, UserCheck, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CorporateEmployerDashboardPayload } from "./contracts";
import { fetchEmployerDashboard } from "./corporateApi";

export default function CorporateEmployerRoster() {
  const [dashboard, setDashboard] = useState<CorporateEmployerDashboardPayload | null>(null);
  const [error, setError] = useState("");
  const load = async () => { setError(""); try { setDashboard(await fetchEmployerDashboard()); } catch (reason: any) { setError(reason?.response?.data?.error || "Roster visibility could not be loaded."); } };
  useEffect(() => { void load(); }, []);
  if (!dashboard && !error) return <div className="flex min-h-[55vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (!dashboard) return <div className="p-8"><Card><CardContent className="p-6"><p className="font-semibold">Roster unavailable</p><p className="mt-1 text-sm text-muted-foreground">{error}</p><Button className="mt-4" variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button></CardContent></Card></div>;
  const { context, metrics, gate_snapshot: gates } = dashboard;
  const summaries = [
    { label: "Invited roster", value: metrics.roster, icon: Users },
    { label: "Active employees", value: metrics.active, icon: UserCheck },
    { label: "Awaiting activation", value: metrics.invited, icon: UserPlus },
    { label: "Participation", value: `${metrics.utilization_percent}%`, icon: Activity },
  ];
  return <div className="space-y-6 p-4 sm:p-6 lg:p-8">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><div className="mb-2 flex gap-2"><Badge>Corporate pilot</Badge><Badge variant="outline">Employer Admin</Badge></div><h1 className="text-2xl font-bold">Employee roster</h1><p className="mt-1 text-sm text-muted-foreground">Aggregate participation visibility for {context.name}.</p></div><Badge variant="secondary"><ShieldCheck className="mr-1 h-3.5 w-3.5" />No PHI or individual clinical status</Badge></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{summaries.map(({ label, value, icon: Icon }) => <Card key={label}><CardContent className="p-5"><Icon className="mb-3 h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></CardContent></Card>)}</div>
    <Card><CardHeader><CardTitle className="text-base">Program gate cohorts</CardTitle></CardHeader><CardContent className="space-y-3">{gates.map((gate) => <div key={gate.number} className="grid gap-2 rounded-xl border p-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-semibold">Gate {gate.number}: {gate.name}</p><p className="text-sm text-muted-foreground">{gate.description}</p></div><div className="text-left sm:text-right"><p className="text-2xl font-bold">{gate.count}</p><p className="text-xs text-muted-foreground">employees in aggregate</p></div></div>)}</CardContent></Card>
    <Card className="border-blue-200 bg-blue-50/50"><CardContent className="p-5"><p className="font-semibold text-blue-950">Privacy boundary</p><p className="mt-1 text-sm leading-6 text-blue-900">This pilot roster intentionally exposes counts and program cohorts only. Names, diagnoses, answers, orders, prescriptions, labs, and clinical gate decisions are not available to the employer.</p></CardContent></Card>
  </div>;
}
