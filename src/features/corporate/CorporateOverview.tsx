import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CheckCircle2, ExternalLink, Loader2, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CorporatePilotContext } from "./contracts";
import { fetchCorporatePlatformOverview } from "./corporateApi";

export default function CorporateOverview() {
  const [overview, setOverview] = useState<CorporatePilotContext | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); setError(""); try { setOverview(await fetchCorporatePlatformOverview()); } catch (reason: any) { setError(reason?.response?.data?.detail || reason?.response?.data?.error || "Corporate platform data could not be loaded."); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  if (loading) return <div className="flex min-h-[55vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (!overview) return <div className="p-6"><Card className="border-destructive/30"><CardContent className="p-6"><p className="font-semibold">Corporate platform context unavailable</p><p className="mt-1 text-sm text-muted-foreground">{error}</p><Button className="mt-4" variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button></CardContent></Card></div>;
  const checkpoints = [{ label: "Navigation and portal shells", status: overview.checkpoints.navigation, icon: CheckCircle2 }, { label: "Operator-to-employer handoff", status: overview.checkpoints.handoff, icon: ExternalLink }, { label: "Corporate RBAC and audit", status: overview.checkpoints.rbac_audit, icon: ShieldCheck }];
  return <div className="space-y-6 p-4 sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><div className="mb-2 flex items-center gap-2"><Badge>Day 2 live</Badge><span className="text-xs text-muted-foreground">Backend control-plane data</span></div><h1 className="text-2xl font-bold text-foreground">Corporate</h1><p className="mt-1 text-sm text-muted-foreground">Platform checkpoint for operator and employer pilot readiness.</p></div><Button asChild><Link to="/dashboard/corporate/operators">Review operators <ExternalLink className="ml-2 h-4 w-4" /></Link></Button></div>
    <div className="grid gap-4 sm:grid-cols-2"><Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-lg bg-blue-50 p-3 text-blue-700"><Users className="h-5 w-5" /></div><div><p className="text-sm text-muted-foreground">Corporate operators</p><p className="text-2xl font-bold">{overview.operator_count}</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-lg bg-emerald-50 p-3 text-emerald-700"><Building2 className="h-5 w-5" /></div><div><p className="text-sm text-muted-foreground">Employer tenants</p><p className="text-2xl font-bold">{overview.employer_count}</p></div></CardContent></Card></div>
    <Card><CardHeader><CardTitle className="text-base">Launch checkpoints</CardTitle></CardHeader><CardContent className="space-y-3">{checkpoints.map(({ label, status, icon: Icon }) => <div key={label} className="flex items-center justify-between rounded-lg border p-3"><span className="flex items-center gap-3 text-sm font-medium"><Icon className="h-4 w-4 text-muted-foreground" />{label}</span><Badge variant={status === "ready" ? "default" : "outline"} className="capitalize">{status}</Badge></div>)}</CardContent></Card>
  </div>;
}
