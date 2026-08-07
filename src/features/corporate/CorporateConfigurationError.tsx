import { AlertTriangle } from "lucide-react";

export default function CorporateConfigurationError() {
  return <div className="flex min-h-screen items-center justify-center bg-amber-50 p-6"><div className="max-w-lg rounded-xl border border-amber-200 bg-white p-6 text-amber-950"><AlertTriangle className="mb-3 h-6 w-6" /><h1 className="text-lg font-semibold">Corporate portal configuration error</h1><p className="mt-2 text-sm text-amber-800">This build has the corporate pilot enabled without the employee portal mode. Access is closed until the deployment configuration is corrected.</p></div></div>;
}
