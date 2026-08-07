import { ArrowLeft, BookOpen, CreditCard, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clearEmployerPreview, corporatePilotConfig } from "./config";
import { corporatePilotFixture, defaultPilotEmployer } from "./fixtures";

export default function CorporateEmployerDashboard() {
  const selectedId = window.sessionStorage.getItem("corp-preview-employer");
  const employer = corporatePilotFixture.availableEmployers.find((item) => item.id === selectedId) || defaultPilotEmployer;
  const returnToOperator = corporatePilotConfig.declaredMode === "corporate_operator";
  const exitPreview = () => { clearEmployerPreview(); window.location.assign("/dashboard/corporate/workspace"); };
  const gateRows = [{ gate: "Gate 0", value: employer.invitedEmployees, status: "Education" }, { gate: "Gate 1", value: 37, status: "Intake" }, { gate: "Gate 2", value: 18, status: "Clinical approval" }];
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div>{returnToOperator && <Button variant="ghost" size="sm" onClick={exitPreview} className="-ml-3 mb-2"><ArrowLeft className="mr-2 h-4 w-4" />Return to operator</Button>}<div className="mb-2 flex items-center gap-2"><Badge>Pilot preview</Badge><Badge variant="outline">Employer Admin</Badge></div><h1 className="text-2xl font-bold">Corporate Employer Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">Current tenant: {employer.name}</p></div><Badge variant="secondary">Aggregate data only · no PHI</Badge></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[{ label: "Roster", value: employer.invitedEmployees, icon: Users }, { label: "Active", value: employer.activeEmployees, icon: Users }, { label: "Assigned program", value: "1", icon: BookOpen }, { label: "Billing snapshot", value: "$—", icon: CreditCard }].map(({ label, value, icon: Icon }) => <Card key={label}><CardContent className="p-5"><Icon className="mb-3 h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></CardContent></Card>)}</div>
      <div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle className="text-base">Assigned program</CardTitle></CardHeader><CardContent><p className="font-semibold">{corporatePilotFixture.program.name}</p><p className="mt-1 text-sm text-muted-foreground">Program configuration is read-only during the pilot preview.</p><Badge className="mt-4">{corporatePilotFixture.program.status}</Badge></CardContent></Card><Card><CardHeader><CardTitle className="text-base">Gate snapshot</CardTitle></CardHeader><CardContent className="space-y-3">{gateRows.map((row) => <div key={row.gate} className="flex items-center justify-between rounded-lg border p-3"><div><p className="font-medium">{row.gate}</p><p className="text-xs text-muted-foreground">{row.status}</p></div><span className="text-xl font-bold">{row.value}</span></div>)}</CardContent></Card></div>
      <Card><CardHeader><CardTitle className="text-base">Pilot activity</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">{["Employer preview opened", "Program assignment shell ready", "Roster integration pending Day 2"].map((item, index) => <div key={item} className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">{index + 1}</span>{item}</div>)}</CardContent></Card>
    </div>
  );
}
