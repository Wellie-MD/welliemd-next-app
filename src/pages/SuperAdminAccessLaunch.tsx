import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import { useAuthStore } from "@/store/useAuthStore";

const SuperAdminAccessLaunch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const exchangeStartedRef = useRef(false);

  useEffect(() => {
    if (exchangeStartedRef.current) return;
    exchangeStartedRef.current = true;

    const waitForInFlightExchange = async (handoffKey: string) => {
      for (let attempt = 0; attempt < 40; attempt += 1) {
        if (window.sessionStorage.getItem(handoffKey) === "completed") {
          return true;
        }
        await new Promise(resolve => window.setTimeout(resolve, 100));
      }
      return false;
    };

    const exchange = async () => {
      const handoffCode = searchParams.get("handoff_code");
      if (!handoffCode) {
        setError("Missing access handoff code.");
        return;
      }
      const handoffKey = `superadmin-handoff:${handoffCode.length}:${handoffCode.slice(-8)}`;

      try {
        const handoffState = window.sessionStorage.getItem(handoffKey);
        if (handoffState === "completed") {
          navigate("/dashboard", { replace: true });
          return;
        }
        if (handoffState === "in-flight" && await waitForInFlightExchange(handoffKey)) {
          navigate("/dashboard", { replace: true });
          return;
        }
        window.sessionStorage.setItem(handoffKey, "in-flight");

        const exchangeApiUrl = searchParams.get("exchange_api_url");
        const normalizedExchangeApiUrl = exchangeApiUrl?.replace(/\/+$/, "") || "";
        const exchangePath = "/superadmin-access/handoff/exchange/";
        const exchangeUrl = normalizedExchangeApiUrl
          ? `${normalizedExchangeApiUrl}${exchangePath}`
          : exchangePath;

        await axiosInstance.post(
          exchangeUrl,
          { handoff_code: handoffCode },
          { skipAuthRedirect: true }
        );
        if (normalizedExchangeApiUrl) {
          useAuthStore.getState().setSuperAdminSession(normalizedExchangeApiUrl);
        }

        const mePath = "/auth/me/";
        const meUrl = normalizedExchangeApiUrl ? `${normalizedExchangeApiUrl}${mePath}` : mePath;
        const { data: user } = await axiosInstance.get(meUrl, { skipAuthRedirect: true });
        useAuthStore.getState().setUser(user);
        useAuthStore.getState().setAccessToken("");

        window.sessionStorage.setItem(handoffKey, "completed");
        window.history.replaceState({}, document.title, "/superadmin-access/launch");
        navigate("/dashboard", { replace: true });
      } catch (error) {
        console.error("Super Admin access handoff exchange failed:", error);
        window.sessionStorage.removeItem(handoffKey);
        setError("This Super Admin access link is invalid or expired.");
      }
    };

    void exchange();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center space-y-3">
        {error ? (
          <>
            <h1 className="text-xl font-semibold">Access link expired</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Opening Super Admin client access...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default SuperAdminAccessLaunch;
