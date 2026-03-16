"use client";

import { useEffect, useState } from "react";
import billingService, { BillingLockStatus } from "@/services/billingService";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, CreditCard } from "lucide-react";

/**
 * BillingSuspendedBanner
 * 
 * Global banner shown when the client's billing account is in locked state.
 * Displays outstanding balance and provides quick access to payment options.
 * 
 * Usage: Add to layout or wrap around pages that should show the warning.
 */
export default function BillingSuspendedBanner() {
    const navigate = useNavigate();
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
        const pollId = window.setInterval(fetchLockStatus, 30000);
        const onFocus = () => {
            void fetchLockStatus();
        };
        window.addEventListener("focus", onFocus);

        return () => {
            mounted = false;
            window.clearInterval(pollId);
            window.removeEventListener("focus", onFocus);
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
    if (
        loading ||
        !lockStatus ||
        lockStatus.lock_state !== "locked" ||
        lockStatus.blocking_invoice_count <= 0
    ) {
        return null;
    }

    const balanceFormatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(parseFloat(lockStatus.blocking_balance));

    return (
        <div className="border-b border-red-200 bg-gradient-to-r from-red-50 to-rose-50">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Warning Icon and Message */}
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 rounded-full bg-red-100 p-1.5">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
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
                                    {payResult.error}
                                </p>
                            )}
                            {payResult?.success && (
                                <p className="text-sm text-green-600 mt-1 font-medium">
                                    Payment successful. Your account is now unlocking.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate("/dashboard/finances/invoices")}
                            className="border-red-300 bg-white/70 text-red-700 hover:bg-red-100"
                        >
                            <ArrowRight className="mr-1 h-4 w-4" />
                            View Invoices
                        </Button>
                        <Button
                            size="sm"
                            onClick={handlePayAll}
                            disabled={paying}
                            className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
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
                                <>
                                    <CreditCard className="mr-1 h-4 w-4" />
                                    {`Pay ${balanceFormatted} Now`}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
