"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import billingService, { BillingLockStatus } from "@/services/billingService";
import { useAuthStore } from "@/store/useAuthStore";

interface BillingLockContextType {
    lockStatus: BillingLockStatus | null;
    isLocked: boolean;
    isLoading: boolean;
    refresh: () => Promise<void>;
}

const BillingLockContext = createContext<BillingLockContextType>({
    lockStatus: null,
    isLocked: false,
    isLoading: true,
    refresh: async () => { },
});

const getWsUrl = () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://knysysapi.welliemd.com/api/v1";
    let wsProto = "wss:";
    let host = "";
    if (apiBaseUrl.startsWith("http://")) {
        wsProto = "ws:";
        host = apiBaseUrl.substring(7);
    } else if (apiBaseUrl.startsWith("https://")) {
        wsProto = "wss:";
        host = apiBaseUrl.substring(8);
    } else {
        const loc = window.location;
        wsProto = loc.protocol === "https:" ? "wss:" : "ws:";
        host = loc.host + (apiBaseUrl.startsWith("/") ? apiBaseUrl : "/" + apiBaseUrl);
    }
    // Strip trailing /api/v1 or just /api/v1/
    let cleanHost = host.replace(/\/api\/v1\/?$/, "");
    cleanHost = cleanHost.replace(/\/$/, "");
    return `${wsProto}//${cleanHost}/ws/client/notifications/`;
};

/**
 * BillingLockProvider
 * 
 * Provides billing lock state to all child components.
 * Wrap your app or billing-related pages with this provider.
 */
export function BillingLockProvider({ children }: { children: ReactNode }) {
    const [lockStatus, setLockStatus] = useState<BillingLockStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const user = useAuthStore((state) => state.user);
    const userId = user?.id;
    const accessToken = useAuthStore((state) => state.accessToken);

    const refresh = useCallback(async () => {
        try {
            const status = await billingService.getLockStatus();
            setLockStatus(status);
        } catch (err) {
            console.warn("Failed to refresh lock status", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 5 * 60 * 1000); // 5 minutes fallback polling
        const onFocus = () => {
            void refresh();
        };
        window.addEventListener("focus", onFocus);
        return () => {
            clearInterval(interval);
            window.removeEventListener("focus", onFocus);
        };
    }, [refresh]);

    useEffect(() => {
        if (!userId || !accessToken) return;

        let socket: WebSocket | null = null;
        let reconnectTimeout: NodeJS.Timeout | null = null;
        let isDisposed = false;

        const connect = () => {
            if (isDisposed) return;
            try {
                const wsUrl = `${getWsUrl()}?token=${accessToken}`;
                console.log("Connecting to WebSocket:", wsUrl);
                socket = new WebSocket(wsUrl);

                socket.onmessage = (event) => {
                    try {
                        const msg = JSON.parse(event.data);
                        console.log("WS message received in BillingLockContext:", msg);
                        if (
                            msg.type === "lock_state_changed" ||
                            msg.notification_type === "lock_state_changed" ||
                            (msg.data && msg.data.notification_type === "lock_state_changed")
                        ) {
                            console.log("Lock state changed via WS notification. Refreshing context...");
                            void refresh();
                        }
                    } catch (e) {
                        console.error("Error parsing WS message:", e);
                    }
                };

                socket.onclose = () => {
                    console.log("WebSocket connection closed in BillingLockContext. Reconnecting...");
                    if (!isDisposed) {
                        reconnectTimeout = setTimeout(connect, 5000);
                    }
                };

                socket.onerror = (err) => {
                    console.error("WebSocket error in BillingLockContext:", err);
                };
            } catch (err) {
                console.error("Failed to connect WebSocket:", err);
                if (!isDisposed) {
                    reconnectTimeout = setTimeout(connect, 5000);
                }
            }
        };

        connect();

        return () => {
            isDisposed = true;
            if (socket) {
                socket.close();
            }
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
            }
        };
    }, [userId, accessToken, refresh]);

    const isLocked = lockStatus?.lock_state === "locked";

    return (
        <BillingLockContext.Provider value={{ lockStatus, isLocked, isLoading, refresh }}>
            {children}
        </BillingLockContext.Provider>
    );
}

/**
 * useBillingLock
 * 
 * Hook to access billing lock state from any component.
 */
export function useBillingLock() {
    return useContext(BillingLockContext);
}

/**
 * useBillingGuard
 * 
 * Hook that returns whether a cost-incurring operation should be blocked.
 * Use this to conditionally disable buttons or show warnings.
 */
export function useBillingGuard() {
    const { isLocked, isLoading, lockStatus } = useBillingLock();

    return {
        isBlocked: isLocked,
        isLoading,
        blockingBalance: lockStatus?.blocking_balance,
        blockingCount: lockStatus?.blocking_invoice_count,
        reason: lockStatus?.lock_reason_code,
    };
}
