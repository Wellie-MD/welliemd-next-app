import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  FileText,
  Loader2,
  Play,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import visaIcon from "@/assets/icons/payment-methods/visa.svg";
import mastercardIcon from "@/assets/icons/payment-methods/mastercard.svg";
import amexIcon from "@/assets/icons/payment-methods/american-express.svg";
import discoverIcon from "@/assets/icons/payment-methods/discover.svg";
import dinersIcon from "@/assets/icons/payment-methods/diners-club.svg";
import genericCardIcon from "@/assets/icons/payment-methods/generic-card.svg";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { clientApi, Client } from "@/api/clientApi";
import type { B2BBillingStatus } from "@/types/b2bBilling";
import { toast } from "sonner";

interface B2BBillingDisplayProps {
  clientId: string;
  client?: Client | null;
}

export function B2BBillingDisplay({
  clientId,
  client,
}: B2BBillingDisplayProps) {
  const resolveCardIcon = (brand?: string) => {
    const normalized = (brand || "").toLowerCase().trim();
    if (normalized.includes("visa")) return visaIcon;
    if (normalized.includes("mastercard") || normalized.includes("master card"))
      return mastercardIcon;
    if (normalized.includes("amex") || normalized.includes("american express") || normalized.includes("americanexpress"))
      return amexIcon;
    if (normalized.includes("discover")) return discoverIcon;
    if (normalized.includes("diners")) return dinersIcon;
    if (normalized.includes("jcb")) return genericCardIcon;
    if (normalized.includes("unionpay") || normalized.includes("union pay"))
      return genericCardIcon;
    return genericCardIcon;
  };
  const queryClient = useQueryClient();

  const {
    data: billingStatus,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["b2bBillingStatus", clientId],
    queryFn: () => clientApi.getB2BBillingStatus(clientId),
    enabled: !!clientId,
  });

  // Mutation for custom billing activation (initial SaaS charge)
  const activateBillingMutation = useMutation({
    mutationFn: async () => {
      return clientApi.activateBilling(clientId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      queryClient.invalidateQueries({
        queryKey: ["b2bBillingStatus", clientId],
      });
      toast.success("Billing activated and initial charge processed.");
    },
    onError: (error: unknown) => {
      console.error("Billing activation error:", error);
      const axiosError = error as unknown;
      const message =
        axiosError?.response?.data?.detail ||
        axiosError?.response?.data?.error ||
        axiosError?.message ||
        "Failed to activate billing";
      toast.error(message);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>B2B Billing Status</CardTitle>
          <CardDescription>
            Platform subscription and billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>B2B Billing Status</CardTitle>
          <CardDescription>
            Platform subscription and billing information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load billing status. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const hasPaymentMethod = billingStatus?.has_payment_method;
  const paymentMethodStatus =
    billingStatus?.payment_method_status || "no_customer";
  const paymentMethod = billingStatus?.payment_method;
  const subscriptionStatus = billingStatus?.subscription_status;
  const totalOutstanding = billingStatus?.total_outstanding || "0.00";

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                B2B Billing Status
              </CardTitle>
              <CardDescription>
                Platform subscription and billing information
              </CardDescription>
            </div>
            {client && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => activateBillingMutation.mutate()}
                  className="flex items-center gap-2"
                  disabled={
                    activateBillingMutation.isPending ||
                    billingStatus?.payment_method_status !== "active"
                  }
                >
                  {activateBillingMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Activate Billing
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subscription Status */}
          {subscriptionStatus && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Subscription Status</span>
              </div>
              <Badge
                variant={
                  subscriptionStatus === "active"
                    ? "default"
                    : subscriptionStatus === "past_due"
                    ? "destructive"
                    : "secondary"
                }
              >
                {subscriptionStatus.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Method
            </h4>

            {paymentMethodStatus === "no_customer" && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>Awaiting client payment setup.</strong> The client
                  needs to add their payment method from the Client Portal
                  before billing can be activated.
                </AlertDescription>
              </Alert>
            )}

            {paymentMethodStatus === "no_payment_method" && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Payment method pending.</strong> Stripe customer
                  created, but the client hasn't completed adding their payment
                  method yet.
                </AlertDescription>
              </Alert>
            )}

            {paymentMethodStatus === "active" &&
            hasPaymentMethod &&
            paymentMethod ? (
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-3">
                  <div className="flex-shrink-0 w-12 h-8 bg-white rounded border border-slate-200 flex items-center justify-center">
                    <img
                      src={resolveCardIcon(paymentMethod.brand)}
                      alt={paymentMethod.brand}
                      className="h-5 w-auto"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-1">
                      <p className="text-sm font-medium text-slate-900 break-words">
                        {paymentMethod.brand.charAt(0).toUpperCase() +
                          paymentMethod.brand.slice(1)}{" "}
                        •••• •••• •••• {paymentMethod.last4}
                      </p>
                      {paymentMethod.is_expired ? (
                        <Badge variant="destructive" className="sm:ml-2">
                          Expired
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="sm:ml-2">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Expires: {paymentMethod.exp_month}/
                      {paymentMethod.exp_year}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              paymentMethodStatus === "active" && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Payment method status is active but details could not be
                    loaded.
                  </AlertDescription>
                </Alert>
              )
            )}
          </div>

          {/* Outstanding Balance */}
          {parseFloat(totalOutstanding) > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Outstanding balance: ${parseFloat(totalOutstanding).toFixed(2)}
              </AlertDescription>
            </Alert>
          )}

          {/* Recent Invoices Summary */}
          {billingStatus?.recent_invoices &&
            billingStatus.recent_invoices.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recent Invoices</h4>
                <div className="space-y-2">
                  {billingStatus.recent_invoices.slice(0, 3).map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-2 bg-muted rounded text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-xs">
                          {invoice.invoice_number}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {invoice.invoice_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          ${parseFloat(invoice.total_amount).toFixed(2)}
                        </span>
                        <Badge
                          variant={
                            invoice.status === "paid"
                              ? "default"
                              : invoice.status === "overdue"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* No Subscription Message */}
          {!subscriptionStatus && !hasPaymentMethod && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                Billing is not activated yet for this client. Set billing config
                and use <strong>Activate Billing</strong> to create the initial charge.
                </AlertDescription>
              </Alert>
          )}
        </CardContent>
      </Card>
    </>
  );
}
