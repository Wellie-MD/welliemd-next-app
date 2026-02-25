"use client";

import { useState } from "react";
import billingService from "@/services/billingService";
import { Button } from "@/components/ui/button";
import { useBillingLock } from "./BillingLockContext";

interface InvoicePayNowButtonProps {
    invoiceId: string;
    amount: string | number;
    status: string;
    disabled?: boolean;
    onSuccess?: () => void;
    className?: string;
}

/**
 * InvoicePayNowButton
 * 
 * Button for paying a specific invoice. Shows on failed/overdue invoices.
 */
export default function InvoicePayNowButton({
    invoiceId,
    amount,
    status,
    disabled = false,
    onSuccess,
    className = "",
}: InvoicePayNowButtonProps) {
    const { refresh } = useBillingLock();
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Only show for unpaid invoices
    const showButton = ["failed", "pending", "overdue", "past_due"].includes(
        status?.toLowerCase() || ""
    );

    if (!showButton || success) {
        if (success) {
            return (
                <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                        />
                    </svg>
                    Paid
                </span>
            );
        }
        return null;
    }

    const handlePay = async () => {
        setPaying(true);
        setError(null);

        try {
            const result = await billingService.payInvoiceNow(invoiceId);

            if (result.success) {
                setSuccess(true);
                await refresh(); // Refresh lock status
                onSuccess?.();
            } else {
                setError(result.error || result.failure_message || "Payment failed");
            }
        } catch (err: any) {
            setError(err?.message || "Payment failed");
        } finally {
            setPaying(false);
        }
    };

    const amountFormatted =
        typeof amount === "number"
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(amount)
            : `$${amount}`;

    return (
        <div className={`inline-flex flex-col items-end gap-1 ${className}`}>
            <Button
                size="sm"
                onClick={handlePay}
                disabled={disabled || paying}
                className="bg-blue-600 hover:bg-blue-700 text-white"
            >
                {paying ? (
                    <span className="flex items-center gap-2">
                        <svg
                            className="animate-spin h-3 w-3"
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
                        Paying...
                    </span>
                ) : (
                    `Pay ${amountFormatted}`
                )}
            </Button>
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}
