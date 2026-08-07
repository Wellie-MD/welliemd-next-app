import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { corporatePilotConfig } from "./config";

export default function CorporateUnavailable() {
  return <div className="mx-auto flex min-h-[60vh] max-w-xl items-center p-6"><Card className="w-full border-amber-200 bg-amber-50"><CardContent className="p-6 text-amber-950"><AlertTriangle className="mb-3 h-6 w-6" /><h1 className="text-lg font-semibold">Corporate route unavailable</h1><p className="mt-2 text-sm text-amber-800">{corporatePilotConfig.enabled ? "This route does not apply to the configured corporate context." : "The corporate pilot is disabled for this deployment."}</p></CardContent></Card></div>;
}
