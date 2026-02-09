"use client";

import { useEffect, useState } from "react";
import billingService, { BillingLockStatus } from "@/services/billingService";
import { Button } from "@/components/ui/button";

/**
 * BillingSuspendedBanner
 * 
 * Global banner shown when the client's billing account is in locked state.
 * Displays outstanding balance and provides quick access to payment options.
 * 
 * Usage: Add to layout or wrap around pages that should show the warning.
 */
export default function BillingSuspendedBanner() {
    const [lockStatus, setLockStatus] = useState<BillingLockStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [payResult, setPayResult] = useState<{ success?: boolean; error?: string } | null>(null);

    useEffect(() => {
        let mounted = true;

        const fetchLockStatus = async () => {
            try {
                const status = await billingService.getLockStatus();
                if (mounted) {
                    setLockStatus(status);
                    setLoading(false);
                }
            } catch (err) {
                console.warn("Failed to fetch lock status", err);
                if (mounted) setLoading(false);
            }
        };

        fetchLockStatus();

        return () => {
            mounted = false;
        };
    }, []);

    const handlePayAll = async () => {
        setPaying(true);
        setPayResult(null);

        try {
            const result = await billingService.payAllOutstanding();
            setPayResult(result);

            if (result.success) {
                // Refresh lock status
                const newStatus = await billingService.getLockStatus();
                setLockStatus(newStatus);
            }
        } catch (err: any) {
            setPayResult({ success: false, error: err?.message || "Payment failed" });
        } finally {
            setPaying(false);
        }
    };

    // Don't render if not locked or still loading
    if (loading || !lockStatus || lockStatus.lock_state !== "locked") {
        return null;
    }

    const balanceFormatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(parseFloat(lockStatus.blocking_balance));

    return (
        <div className="bg-red-50 border-b border-red-200">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Warning Icon and Message */}
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            <svg
                                className="w-6 h-6 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-red-800">
                                Billing Suspended
                            </h3>
                            <p className="text-sm text-red-700 mt-0.5">
                                Your account has {lockStatus.blocking_invoice_count} outstanding{" "}
                                {lockStatus.blocking_invoice_count === 1 ? "invoice" : "invoices"}{" "}
                                totaling <strong>{balanceFormatted}</strong>.
                                <span className="text-red-600 font-medium">
                                    {" "}New prescriptions cannot be sent until payment is made.
                                </span>
                            </p>
                            {payResult?.error && (
                                <p className="text-sm text-red-600 mt-1 font-medium">
                                    ⚠️ {payResult.error}
                                </p>
                            )}
                            {payResult?.success && (
                                <p className="text-sm text-green-600 mt-1 font-medium">
                                    ✓ Payment successful! Your account is now unlocked.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = "/dashboard/billing"}
                            className="border-red-300 text-red-700 hover:bg-red-100"
                        >
                            View Invoices
                        </Button>
                        <Button
                            size="sm"
                            onClick={handlePayAll}
                            disabled={paying}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {paying ? (
                                <span className="flex items-center gap-2">
                                    <svg
                                        className="animate-spin h-4 w-4"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                `Pay ${balanceFormatted} Now`
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
