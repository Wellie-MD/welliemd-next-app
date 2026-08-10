import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Clock3, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CorporateEmployerDashboardPayload } from "./contracts";
import { fetchEmployerDashboard } from "./corporateApi";

export default function CorporateEmployerProgram() {
  const [dashboard, setDashboard] = useState<CorporateEmployerDashboardPayload | null>(null);
  const [error, setError] = useState("");
  const load = async () => { setError(""); try { setDashboard(await fetchEmployerDashboard()); } catch (reason: any) { setError(reason?.response?.data?.error || "Assigned program could not be loaded."); } };
  useEffect(() => { void load(); }, []);
  if (!dashboard && !error) return <div className="flex min-h-[55vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (!dashboard) return <div className="p-8"><Card><CardContent className="p-6"><p className="font-semibold">Program unavailable</p><p className="mt-1 text-sm text-muted-foreground">{error}</p><Button className="mt-4" variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button></CardContent></Card></div>;
  const { context, programs } = dashboard;
  return <div className="space-y-6 p-4 sm:p-6 lg:p-8">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><div className="mb-2 flex gap-2"><Badge>Corporate pilot</Badge><Badge variant="outline">Read-only pilot contract</Badge></div><h1 className="text-2xl font-bold">Assigned program</h1><p className="mt-1 text-sm text-muted-foreground">Program visibility for {context.name}.</p></div><Badge variant="secondary"><ShieldCheck className="mr-1 h-3.5 w-3.5" />Aggregate configuration only</Badge></div>
    {!programs.length ? <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No pilot-ready program is assigned.</CardContent></Card> : programs.map((program) => <Card key={program.id}><CardContent className="p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex items-center gap-3"><BookOpen className="h-6 w-6 text-primary" /><h2 className="text-xl font-bold">{program.name}</h2></div><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{program.description}</p></div><Badge>{program.status_label}</Badge></div><div className="mt-5 grid gap-4 lg:grid-cols-2"><div><p className="mb-2 text-sm font-semibold">Gate model</p>{program.gates.map((gate) => <div key={gate.number} className="mb-2 flex items-start gap-3 rounded-xl border p-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{gate.number}</span><div><p className="font-semibold">{gate.name}</p><p className="text-xs text-muted-foreground">{gate.description}</p></div></div>)}</div><div><p className="mb-2 text-sm font-semibold">Orientation content</p>{program.orientation_modules.map((module) => <div key={module.id} className="mb-2 flex items-start justify-between gap-3 rounded-xl border p-3"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /><div><p className="font-semibold">{module.title}</p><p className="text-xs capitalize text-muted-foreground">{module.kind} · available</p></div></div><span className="flex items-center text-xs text-muted-foreground"><Clock3 className="mr-1 h-3.5 w-3.5" />{module.minutes}m</span></div>)}</div></div></CardContent></Card>)}
  </div>;
}
