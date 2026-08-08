import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { consumeEmployerHandoff } from "./handoffAdapter";

export default function CorporateAccessLaunch() {
  const [params] = useSearchParams();
  const [error, setError] = useState("");
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const handoffCode = params.get("handoff") || "";
    void consumeEmployerHandoff(handoffCode)
      .then((redirect) => {
        window.history.replaceState({}, document.title, "/corporate-access/launch");
        window.location.replace(redirect);
      })
      .catch((reason) => setError(reason?.response?.data?.error || reason?.message || "This employer handoff is invalid or expired."));
  }, [params]);
  return <div className="flex min-h-screen items-center justify-center bg-background p-6"><div className="max-w-md text-center">{error ? <><h1 className="text-xl font-semibold">Unable to open employer workspace</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p><a className="mt-4 inline-block text-sm font-semibold text-primary" href="/dashboard/corporate/workspace">Return to operator workspace</a></> : <><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /><p className="mt-3 text-sm text-muted-foreground">Exchanging a secure, single-use employer handoff…</p></>}</div></div>;
}
