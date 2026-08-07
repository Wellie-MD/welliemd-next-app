import { Link } from "react-router-dom";
import { Building2, CheckCircle2, Clock3, ExternalLink, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { platformCorporatePilot } from "./fixtures";

const checkpoints = [
  { label: "Navigation and portal shells", status: "Ready", icon: CheckCircle2 },
  { label: "Operator-to-employer handoff", status: "Day 2", icon: Clock3 },
  { label: "Corporate RBAC and audit", status: "Day 2", icon: ShieldCheck },
];

export default function CorporateOverview() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary">Pilot preview</Badge>
            <span className="text-xs text-muted-foreground">Fixture data only</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Corporate</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform checkpoint for operator and employer pilot readiness.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/corporate/operators">
            Review operators <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-700"><Users className="h-5 w-5" /></div>
            <div><p className="text-sm text-muted-foreground">Operators</p><p className="text-2xl font-bold">{platformCorporatePilot.operatorCount}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700"><Building2 className="h-5 w-5" /></div>
            <div><p className="text-sm text-muted-foreground">Employer tenants</p><p className="text-2xl font-bold">{platformCorporatePilot.employerCount}</p></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Launch checkpoints</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {checkpoints.map(({ label, status, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between rounded-lg border p-3">
              <span className="flex items-center gap-3 text-sm font-medium"><Icon className="h-4 w-4 text-muted-foreground" />{label}</span>
              <Badge variant={status === "Ready" ? "default" : "outline"}>{status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
