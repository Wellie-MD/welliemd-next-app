import { useEffect, useState } from "react";
import { ArrowLeft, Building2, Loader2, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CorporatePilotContext } from "./contracts";
import { fetchCorporatePlatformOverview } from "./corporateApi";

export default function CorporateOperators() {
  const [overview, setOverview] = useState<CorporatePilotContext | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); setError(""); try { setOverview(await fetchCorporatePlatformOverview()); } catch (reason: any) { setError(reason?.response?.data?.detail || reason?.response?.data?.error || "Operator accounts could not be loaded."); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  return <div className="space-y-6 p-4 sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><Button variant="ghost" size="sm" asChild className="-ml-3 mb-2"><Link to="/dashboard/corporate"><ArrowLeft className="mr-2 h-4 w-4" />Corporate overview</Link></Button><div className="flex items-center gap-2"><h1 className="text-2xl font-bold">Operators</h1><Badge>Day 2 live</Badge></div><p className="mt-1 text-sm text-muted-foreground">Corporate accounts classified in the control plane.</p></div><Button disabled aria-disabled="true"><Plus className="mr-2 h-4 w-4" />Onboard operator — deferred</Button></div>
    <Card><CardHeader><CardTitle className="flex items-center justify-between text-base"><span>Corporate operator accounts</span><Badge variant="secondary"><ShieldCheck className="mr-1 h-3.5 w-3.5" />No clinical data</Badge></CardTitle></CardHeader><CardContent>{loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : error ? <div className="py-8 text-center"><p className="text-sm text-destructive">{error}</p><Button className="mt-4" variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button></div> : <div className="space-y-3">{overview?.operators.map((operator) => <div key={operator.id} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"><div className="flex items-center gap-3"><div className="rounded-lg bg-blue-50 p-2 text-blue-700"><Building2 className="h-5 w-5" /></div><div><p className="font-semibold">{operator.name}</p><p className="text-xs text-muted-foreground">Account ID: {operator.id.slice(0, 8)}…</p></div></div><Badge variant="outline">{operator.account_type}</Badge><span className="text-sm text-muted-foreground">{operator.employer_count} employers</span><Badge variant={operator.status === "Ready" ? "default" : "secondary"}>{operator.status}</Badge></div>)}</div>}</CardContent></Card>
  </div>;
}
