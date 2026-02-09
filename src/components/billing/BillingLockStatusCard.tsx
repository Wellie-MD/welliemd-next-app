import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    AlertTriangle,
    Lock,
    Unlock,
    DollarSign,
    CreditCard,
    Loader2,
    CheckCircle,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Failed to load billing lock status</AlertDescription>
            </Alert>
        );
    }

    if (!lockStatus) return null;

    const isLocked = lockStatus.lock_state === "locked";
    const balanceFormatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(parseFloat(lockStatus.blocking_balance || "0"));

    return (
        <Card className={isLocked ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isLocked ? (
                            <Lock className="h-5 w-5 text-red-600" />
                        ) : (
                            <Unlock className="h-5 w-5 text-green-600" />
                        )}
                        <CardTitle className="text-lg">Billing Status</CardTitle>
                    </div>
                    <Badge variant={isLocked ? "destructive" : "default"}>
                        {isLocked ? "Suspended" : "Active"}
                    </Badge>
                </div>
                {isLocked && (
                    <CardDescription className="text-red-700">
                        Account locked due to {lockStatus.lock_reason_code || "unpaid invoices"}.
                        Prescriptions cannot be sent.
                    </CardDescription>
                )}
            </CardHeader>

            {isLocked && (
                <CardContent className="space-y-4">
                    {/* Summary */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
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
                            className="bg-red-600 hover:bg-red-700"
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

                    {/* Blocking Invoices List */}
                    {lockStatus.blocking_invoices && lockStatus.blocking_invoices.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Blocking Invoices</h4>
                            <div className="space-y-2">
                                {lockStatus.blocking_invoices.map((invoice: BlockingInvoice) => (
                                    <div
                                        key={invoice.id}
                                        className="flex items-center justify-between p-2 bg-white rounded border"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">{invoice.invoice_number}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {invoice.invoice_type} • {invoice.status}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">
                                                ${invoice.total_amount}
                                            </span>
                                            <Button
                                                size="sm"
                                                variant="outline"
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
                        </div>
                    )}
                </CardContent>
            )}

            {!isLocked && (
                <CardContent>
                    <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Billing account is in good standing</span>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
