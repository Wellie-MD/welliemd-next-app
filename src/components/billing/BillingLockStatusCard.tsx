import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    AlertTriangle,
    Lock,
    Unlock,
    CreditCard,
    Loader2,
    CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { clientApi } from "@/api/clientApi";
import type { BillingLockStatus, BlockingInvoice } from "@/types/b2bBilling";
import { toast } from "sonner";

interface BillingLockStatusCardProps {
    clientId: string;
}

/**
 * BillingLockStatusCard
 * 
 * Admin component showing billing lock state, blocking invoices,
 * and actions to resolve account suspensions.
 * 
 * Styled as a colored banner matching billing_tab.html Section 2.
 */
export function BillingLockStatusCard({ clientId }: BillingLockStatusCardProps) {
    const queryClient = useQueryClient();
    const [payingAll, setPayingAll] = useState(false);
    const [payingInvoice, setPayingInvoice] = useState<string | null>(null);

    const {
        data: lockStatus,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["billingLockStatus", clientId],
        queryFn: () => clientApi.getBillingLockStatus(clientId),
        enabled: !!clientId,
        refetchInterval: 30000,
    });

    const payAllMutation = useMutation({
        mutationFn: () => clientApi.payAllOutstanding(clientId),
        onSuccess: (result) => {
            if (result.success) {
                toast.success("All invoices paid successfully");
                queryClient.invalidateQueries({ queryKey: ["billingLockStatus", clientId] });
                queryClient.invalidateQueries({ queryKey: ["b2bBillingStatus", clientId] });
            } else {
                toast.error(result.error || "Payment failed");
            }
        },
        onError: (err: any) => {
            toast.error(err?.message || "Payment failed");
        },
    });

    const payInvoiceMutation = useMutation({
        mutationFn: (invoiceId: string) => clientApi.payInvoiceNow(clientId, invoiceId),
        onSuccess: (result) => {
            if (result.success) {
                toast.success("Invoice paid successfully");
                queryClient.invalidateQueries({ queryKey: ["billingLockStatus", clientId] });
                queryClient.invalidateQueries({ queryKey: ["b2bBillingStatus", clientId] });
            } else {
                toast.error(result.error || "Payment failed");
            }
        },
        onError: (err: any) => {
            toast.error(err?.message || "Payment failed");
        },
    });

    const handlePayAll = async () => {
        setPayingAll(true);
        try {
            await payAllMutation.mutateAsync();
        } finally {
            setPayingAll(false);
        }
    };

    const handlePayInvoice = async (invoiceId: string) => {
        setPayingInvoice(invoiceId);
        try {
            await payInvoiceMutation.mutateAsync(invoiceId);
        } finally {
            setPayingInvoice(null);
        }
    };

    if (isLoading) {
        return (
            <section className="bg-muted/50 border rounded-xl p-4 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </section>
        );
    }

    if (error) {
        return (
            <section className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                <div className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 p-2 rounded-full">
                    <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-red-700 dark:text-red-400">Error</h3>
                    <p className="text-sm text-red-600 dark:text-red-300">Failed to load billing lock status</p>
                </div>
            </section>
        );
    }

    if (!lockStatus) return null;

    const isLocked = lockStatus.lock_state === "locked";
    const balanceFormatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(parseFloat(lockStatus.blocking_balance || "0"));

    if (isLocked) {
        return (
            <>
                {/* Locked/Suspended Banner */}
                <section className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                    <div className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 p-2 rounded-full">
                        <Lock className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="text-sm font-bold text-red-700 dark:text-red-400">Billing Status</h3>
                            <span className="bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                                Suspended
                            </span>
                        </div>
                        <p className="text-sm text-red-700 dark:text-red-300">
                            Account locked due to {lockStatus.lock_reason_code || "unpaid invoices"}. Prescriptions cannot be sent.
                        </p>
                    </div>
                </section>

                {/* Outstanding Balance & Blocking Invoices */}
                <section className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                    <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                                <p className="text-2xl font-bold text-red-600">{balanceFormatted}</p>
                                <p className="text-xs text-muted-foreground">
                                    {lockStatus.blocking_invoice_count} blocking{" "}
                                    {lockStatus.blocking_invoice_count === 1 ? "invoice" : "invoices"}
                                </p>
                            </div>
                            <Button
                                onClick={handlePayAll}
                                disabled={payingAll || lockStatus.blocking_invoice_count === 0}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg"
                            >
                                {payingAll ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        Pay All Now
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Blocking Invoices List */}
                    {lockStatus.blocking_invoices && lockStatus.blocking_invoices.length > 0 && (
                        <div className="p-4 space-y-2">
                            <h4 className="text-sm font-medium mb-2">Blocking Invoices</h4>
                            {lockStatus.blocking_invoices.map((invoice: BlockingInvoice) => (
                                <div
                                    key={invoice.id}
                                    className="bg-muted/50 border rounded-xl p-3 flex items-center justify-between"
                                >
                                    <div>
                                        <p className="text-sm font-medium">{invoice.invoice_number}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {invoice.invoice_type} • {invoice.status}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">${invoice.total_amount}</span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs"
                                            onClick={() => handlePayInvoice(invoice.id)}
                                            disabled={payingInvoice === invoice.id}
                                        >
                                            {payingInvoice === invoice.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                "Pay"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </>
        );
    }

    // Active / Good Standing Banner
    return (
        <section className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-start gap-3">
            <div className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 p-2 rounded-full">
                <CheckCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-bold text-green-700 dark:text-green-400">Billing Status</h3>
                    <span className="bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                        Active
                    </span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">Billing account is in good standing</p>
            </div>
        </section>
    );
}
