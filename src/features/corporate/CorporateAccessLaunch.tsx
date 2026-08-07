import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { consumePreviewHandoff } from "./handoffAdapter";

export default function CorporateAccessLaunch() {
  const [params] = useSearchParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [error, setError] = useState("");
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const employerId = params.get("preview_handoff") || "";
    if (!isAuthenticated) { setError("Sign in to the corporate pilot before opening an employer preview."); return; }
    const result = consumePreviewHandoff(employerId);
    window.history.replaceState({}, document.title, "/corporate-access/launch");
    if (result.status !== "preview_ready") { setError("This employer preview link is invalid or unavailable."); return; }
    window.location.replace(result.launchUrl);
  }, [isAuthenticated, params]);
  return <div className="flex min-h-screen items-center justify-center bg-background p-6"><div className="text-center">{error ? <><h1 className="text-xl font-semibold">Unable to open employer workspace</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p></> : <><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /><p className="mt-3 text-sm text-muted-foreground">Preparing employer pilot preview…</p></>}</div></div>;
}
