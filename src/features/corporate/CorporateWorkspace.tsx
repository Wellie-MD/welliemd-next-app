import { useEffect, useMemo, useState } from "react";
import { Activity, Building2, ChevronRight, DollarSign, Loader2, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CorporatePilotContext } from "./contracts";
import { fetchOperatorContext } from "./corporateApi";
import { prepareEmployerHandoff } from "./handoffAdapter";

const activityLabel = (action: string) => ({
  tenant_switch_issued: "Secure employer handoff issued",
  tenant_switch_consumed: "Employer context established",
  tenant_switch_replay_rejected: "Replay attempt blocked",
  pilot_seed_ready: "Pilot seed data prepared",
}[action] || action.replaceAll("_", " "));

export default function CorporateWorkspace() {
  const [context, setContext] = useState<CorporatePilotContext | null>(null);
  const [employerId, setEmployerId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchOperatorContext();
      setContext(data);
      setEmployerId((current) => current || data.available_employers.find((item) => item.status === "ready")?.id || data.available_employers[0]?.id || "");
    } catch (reason: any) {
      setError(reason?.response?.data?.error || "The corporate operator context could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);
  const selected = useMemo(() => context?.available_employers.find((item) => item.id === employerId), [context, employerId]);

  const openEmployer = async () => {
    setOpening(true);
    setError("");
    const result = await prepareEmployerHandoff(employerId);
    setOpening(false);
    if (result.status === "handoff_ready") window.location.assign(result.launchUrl);
    else if (result.status === "forbidden") setError("This employer is not ready or does not belong to the current operator.");
    else setError("The secure employer handoff could not be prepared. Please retry.");
  };

  if (loading) return <div className="flex min-h-[55vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (!context) return <div className="p-8"><Card className="border-destructive/30"><CardContent className="p-6"><p className="font-semibold">Corporate workspace unavailable</p><p className="mt-1 text-sm text-muted-foreground">{error}</p><Button className="mt-4" variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button></CardContent></Card></div>;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start"><div><div className="mb-2 flex items-center gap-2"><Badge>Corporate pilot</Badge><Badge variant="outline">Corporate Operator Admin</Badge></div><h1 className="text-2xl font-bold">Corporate Workspace</h1><p className="mt-1 text-sm text-muted-foreground">{context.operator.name} · authenticated employer portfolio</p></div><Badge variant="secondary" className="w-fit"><ShieldCheck className="mr-1 h-3.5 w-3.5" />Role and tenant scoped</Badge></div>
      <Card className="border-primary/20 bg-primary/5"><CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-end"><div className="min-w-0 flex-1"><p className="mb-2 text-sm font-medium">Employer tenant handoff</p><Select value={employerId} onValueChange={setEmployerId}><SelectTrigger className="max-w-md bg-background"><SelectValue placeholder="Choose an employer" /></SelectTrigger><SelectContent>{context.available_employers.map((employer) => <SelectItem key={employer.id} value={employer.id}>{employer.name} · {employer.status_label}</SelectItem>)}</SelectContent></Select><p className="mt-2 text-xs text-muted-foreground">The launch code expires in 60 seconds and can be consumed once.</p>{error && <p className="mt-2 text-sm text-destructive">{error}</p>}</div><Button onClick={() => void openEmployer()} disabled={!selected || selected.status !== "ready" || opening}>{opening ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{opening ? "Preparing handoff" : "Open employer workspace"}<ChevronRight className="ml-2 h-4 w-4" /></Button></CardContent></Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[{ label: "Employer tenants", value: context.operator.employer_count, detail: `${context.available_employers.filter((item) => item.status === "ready").length} ready`, icon: Building2 }, { label: "Active workforce", value: context.operator.active_employee_count, detail: "Across employer tenants", icon: Users }, { label: "Monthly fee view", value: context.operator.monthly_fee_summary, detail: "Aggregate pilot estimate", icon: DollarSign }, { label: "Tenant boundary", value: "Verified", detail: "No employer PHI", icon: ShieldCheck }].map(({ label, value, detail, icon: Icon }) => <Card key={label}><CardContent className="p-5"><div className="mb-4 flex items-start justify-between"><div className="rounded-lg bg-muted p-2.5"><Icon className="h-5 w-5 text-primary" /></div><Badge variant="outline" className="text-[10px]">Backend</Badge></div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>)}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]"><Card><CardHeader><CardTitle className="text-base">Employer portfolio</CardTitle></CardHeader><CardContent className="space-y-3">{context.available_employers.map((employer) => <button type="button" key={employer.id} onClick={() => setEmployerId(employer.id)} className={`flex w-full flex-col justify-between gap-3 rounded-xl border p-4 text-left transition sm:flex-row sm:items-center ${employer.id === employerId ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}><div className="flex items-center gap-3"><div className="rounded-lg bg-blue-50 p-2 text-blue-700"><Users className="h-5 w-5" /></div><div><p className="font-semibold">{employer.name}</p><p className="text-xs text-muted-foreground">{employer.invited_employees} rostered · {employer.active_employees} active · {employer.utilization_percent}% utilization</p></div></div><div className="flex items-center gap-2"><span className="text-sm font-semibold">{employer.monthly_fee_summary}</span><Badge variant={employer.status === "ready" ? "default" : "secondary"}>{employer.status_label}</Badge></div></button>)}</CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4" />Handoff telemetry</CardTitle></CardHeader><CardContent className="space-y-3">{context.recent_activity.length ? context.recent_activity.map((event) => <div key={event.id} className="border-l-2 border-primary/30 pl-3"><p className="text-sm font-medium capitalize">{activityLabel(event.action)}</p><p className="text-xs text-muted-foreground">{event.outcome} · {new Date(event.created_at).toLocaleString()}</p></div>) : <p className="text-sm text-muted-foreground">The first secure handoff will appear here.</p>}</CardContent></Card></div>
    </div>
  );
}
