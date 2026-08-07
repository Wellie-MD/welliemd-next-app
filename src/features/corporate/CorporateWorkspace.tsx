import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ChevronRight, DollarSign, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { corporatePilotFixture } from "./fixtures";
import { prepareEmployerHandoff } from "./handoffAdapter";

export default function CorporateWorkspace() {
  const navigate = useNavigate();
  const [employerId, setEmployerId] = useState(corporatePilotFixture.availableEmployers[0].id);
  const [error, setError] = useState("");
  const openPreview = async () => {
    const result = await prepareEmployerHandoff(employerId);
    if (result.status === "preview_ready") navigate(result.launchUrl);
    else setError("Employer workspace preview is unavailable for this selection.");
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div><div className="mb-2 flex items-center gap-2"><Badge>Pilot preview</Badge><Badge variant="outline">Operator Admin</Badge></div><h1 className="text-2xl font-bold">Corporate Workspace</h1><p className="mt-1 text-sm text-muted-foreground">{corporatePilotFixture.operator.name} · control-plane portfolio view</p></div>
      <Card className="border-primary/20 bg-primary/5"><CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-end"><div className="min-w-0 flex-1"><p className="mb-2 text-sm font-medium">Current employer context</p><Select value={employerId} onValueChange={setEmployerId}><SelectTrigger className="max-w-md bg-background"><SelectValue /></SelectTrigger><SelectContent>{corporatePilotFixture.availableEmployers.map((employer) => <SelectItem key={employer.id} value={employer.id}>{employer.name} · {employer.status}</SelectItem>)}</SelectContent></Select>{error && <p className="mt-2 text-sm text-destructive">{error}</p>}</div><div className="flex flex-col gap-2 sm:items-end"><Button onClick={openPreview}>View employer preview <ChevronRight className="ml-2 h-4 w-4" /></Button><Button variant="outline" disabled aria-disabled="true">Open employer workspace — Day 2</Button></div></CardContent></Card>
      <div className="grid gap-4 md:grid-cols-3">
        {[{ label: "Employer tenants", value: corporatePilotFixture.operator.employerCount, icon: Building2 }, { label: "Fee summary", value: corporatePilotFixture.operator.monthlyFeeSummary, icon: DollarSign }, { label: "Tenant boundary", value: "Verified", icon: ShieldCheck }].map(({ label, value, icon: Icon }) => <Card key={label}><CardContent className="flex items-center gap-4 p-5"><div className="rounded-lg bg-muted p-3"><Icon className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">{label}</p><p className="text-xl font-bold">{value}</p></div></CardContent></Card>)}
      </div>
      <Card><CardHeader><CardTitle className="text-base">Employer portfolio</CardTitle></CardHeader><CardContent className="space-y-3">{corporatePilotFixture.availableEmployers.map((employer) => <div key={employer.id} className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><div className="rounded-lg bg-blue-50 p-2 text-blue-700"><Users className="h-5 w-5" /></div><div><p className="font-semibold">{employer.name}</p><p className="text-xs text-muted-foreground">{employer.invitedEmployees} invited · {employer.activeEmployees} active</p></div></div><Badge variant={employer.status === "Ready" ? "default" : "secondary"}>{employer.status}</Badge></div>)}</CardContent></Card>
    </div>
  );
}
