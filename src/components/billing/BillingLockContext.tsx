"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import billingService, { BillingLockStatus } from "@/services/billingService";

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

/**
 * BillingLockProvider
 * 
 * Provides billing lock state to all child components.
 * Wrap your app or billing-related pages with this provider.
 */
export function BillingLockProvider({ children }: { children: ReactNode }) {
    const [lockStatus, setLockStatus] = useState<BillingLockStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
    }, [refresh]);

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
