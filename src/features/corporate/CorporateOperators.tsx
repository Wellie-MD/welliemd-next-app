import { ArrowLeft, Building2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { platformCorporatePilot } from "./fixtures";

export default function CorporateOperators() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2"><Link to="/dashboard/corporate"><ArrowLeft className="mr-2 h-4 w-4" />Corporate overview</Link></Button>
          <div className="flex items-center gap-2"><h1 className="text-2xl font-bold">Operators</h1><Badge variant="secondary">Pilot preview</Badge></div>
          <p className="mt-1 text-sm text-muted-foreground">Corporate accounts visible to the control plane.</p>
        </div>
        <Button disabled aria-disabled="true"><Plus className="mr-2 h-4 w-4" />Onboard operator — Day 2</Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Corporate operator accounts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {platformCorporatePilot.operators.map((operator) => (
            <div key={operator.id} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
              <div className="flex items-center gap-3"><div className="rounded-lg bg-blue-50 p-2 text-blue-700"><Building2 className="h-5 w-5" /></div><div><p className="font-semibold">{operator.name}</p><p className="text-xs text-muted-foreground">No clinical or employee data in this view</p></div></div>
              <Badge variant="outline">{operator.accountType}</Badge>
              <span className="text-sm text-muted-foreground">{operator.employerCount} employers</span>
              <Badge>{operator.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
