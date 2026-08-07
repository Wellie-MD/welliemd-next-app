import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { corporatePilotConfig, isCorporatePlatformPreview } from "./config";

export function CorporateRouteGuard({ children }: { children: ReactNode }) {
  if (isCorporatePlatformPreview) return <>{children}</>;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center px-6">
      <div className="w-full rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <AlertTriangle className="mb-3 h-6 w-6" />
        <h1 className="text-lg font-semibold">Corporate workspace unavailable</h1>
        <p className="mt-2 text-sm text-amber-800">
          {corporatePilotConfig.enabled
            ? "This deployment is not configured for the Platform Admin corporate context."
            : "The corporate pilot is disabled for this deployment."}
        </p>
      </div>
    </div>
  );
}
