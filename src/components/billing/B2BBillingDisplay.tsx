import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  FileText,
  Loader2,
  Plus,
  Settings,
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
import { subscriptionApi } from "@/api/subscriptionApi";
import type { B2BBillingStatus } from "@/types/b2bBilling";
import { ManageSubscriptionModal } from "@/components/subscriptions/ManageSubscriptionModal";
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
  const [manageModalOpen, setManageModalOpen] = useState(false);
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

  // Fetch available prices
  const { data: prices } = useQuery({
    queryKey: ["stripe-prices"],
    queryFn: subscriptionApi.getPrices,
  });

  const hasSubscription = client?.stripe_subscription_id;
  const priceList = Array.isArray(prices) ? prices : (prices as any)?.prices || [];
  const monthlyPrices = priceList.filter(
    (price: any) => price.recurring?.interval === "month" && price.active
  );
  const basePrice = monthlyPrices.find(
    (price: any) => price.recurring?.usage_type !== "metered"
  );
  const meteredPrice = monthlyPrices.find(
    (price: any) => price.recurring?.usage_type === "metered"
  );

  // Mutation for creating subscription
  const createSubscriptionMutation = useMutation({
    mutationFn: async () => {
      // Get the payment method ID from billing status
      const paymentMethodId = billingStatus?.payment_method?.id;
      if (!paymentMethodId) {
        throw new Error("No payment method found");
      }

      if (!basePrice) {
        throw new Error("No active monthly base plan found");
      }

      return subscriptionApi.create({
        client_id: clientId,
        payment_method_id: paymentMethodId,
        ...(meteredPrice
          ? { base_price_id: basePrice.id, metered_price_id: meteredPrice.id }
          : { price_id: basePrice.id }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      queryClient.invalidateQueries({
        queryKey: ["b2bBillingStatus", clientId],
      });
      toast.success("Subscription created successfully!");
    },
    onError: (error: unknown) => {
      console.error("Subscription creation error:", error);
      const axiosError = error as unknown;
      const message =
        axiosError?.response?.data?.detail ||
        axiosError?.message ||
        "Failed to create subscription";
      toast.error(message);
    },
  });

  const handleCreateSubscription = () => {
    // Check if payment method exists
    if (billingStatus?.payment_method_status !== "active") {
      toast.error(
        "Client must add a payment method before creating a subscription"
      );
      return;
    }

    createSubscriptionMutation.mutate();
  };

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
          <div className="flex items-center justify-between">
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
              <div>
                {hasSubscription ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setManageModalOpen(true)}
                    className="flex items-center gap-2"
                    disabled={createSubscriptionMutation.isPending}
                  >
                    <Settings className="w-4 h-4" />
                    Manage Subscription
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateSubscription}
                    className="flex items-center gap-2"
                    disabled={
                      createSubscriptionMutation.isPending ||
                      billingStatus?.payment_method_status !== "active"
                    }
                  >
                    {createSubscriptionMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Subscription
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subscription Status */}
          {subscriptionStatus && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
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
                  before subscriptions can be created.
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
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-8 bg-white rounded border border-slate-200 flex items-center justify-center">
                    <img
                      src={resolveCardIcon(paymentMethod.brand)}
                      alt={paymentMethod.brand}
                      className="h-5 w-auto"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-900">
                        {paymentMethod.brand.charAt(0).toUpperCase() +
                          paymentMethod.brand.slice(1)}{" "}
                        •••• •••• •••• {paymentMethod.last4}
                      </p>
                      {paymentMethod.is_expired ? (
                        <Badge variant="destructive" className="ml-2">
                          Expired
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="ml-2">
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
                      className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                    >
                      <div className="flex items-center gap-2">
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
                No B2B subscription found. This client may not be set up for
                platform billing yet.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Subscription Modals */}
      {client && (
        <ManageSubscriptionModal
          isOpen={manageModalOpen}
          onOpenChange={setManageModalOpen}
          client={client}
        />
      )}
    </>
  );
}
