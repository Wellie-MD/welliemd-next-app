import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, CreditCard, Loader2, Play } from "lucide-react";
import visaIcon from "@/assets/icons/payment-methods/visa.svg";
import mastercardIcon from "@/assets/icons/payment-methods/mastercard.svg";
import amexIcon from "@/assets/icons/payment-methods/american-express.svg";
import discoverIcon from "@/assets/icons/payment-methods/discover.svg";
import dinersIcon from "@/assets/icons/payment-methods/diners-club.svg";
import genericCardIcon from "@/assets/icons/payment-methods/generic-card.svg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clientApi, Client } from "@/api/clientApi";
import { toast } from "sonner";

interface B2BBillingDisplayProps {
  clientId: string;
  client?: Client | null;
}

export function B2BBillingDisplay({ clientId, client }: B2BBillingDisplayProps) {
  const queryClient = useQueryClient();

  const resolveCardIcon = (brand?: string) => {
    const normalized = (brand || "").toLowerCase().trim();
    if (normalized.includes("visa")) return visaIcon;
    if (normalized.includes("mastercard") || normalized.includes("master card")) return mastercardIcon;
    if (
      normalized.includes("amex") ||
      normalized.includes("american express") ||
      normalized.includes("americanexpress")
    ) {
      return amexIcon;
    }
    if (normalized.includes("discover")) return discoverIcon;
    if (normalized.includes("diners")) return dinersIcon;
    return genericCardIcon;
  };

  const { data: billingStatus, isLoading, error } = useQuery({
    queryKey: ["b2bBillingStatus", clientId],
    queryFn: () => clientApi.getB2BBillingStatus(clientId),
    enabled: !!clientId,
  });

  const activateBillingMutation = useMutation({
    mutationFn: async () => clientApi.activateBilling(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      queryClient.invalidateQueries({ queryKey: ["b2bBillingStatus", clientId] });
      toast.success("Billing activated and initial charge processed.");
    },
    onError: (error: unknown) => {
      const axiosError = error as any;
      const message =
        axiosError?.response?.data?.detail ||
        axiosError?.response?.data?.error ||
        axiosError?.message ||
        "Failed to activate billing";
      toast.error(message);
    },
  });

  const cancelAtPeriodEndMutation = useMutation({
    mutationFn: async () => clientApi.cancelBilling(clientId, "period_end"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["b2bBillingStatus", clientId] });
      toast.success("Subscription will cancel at period end.");
    },
    onError: (error: unknown) => {
      const axiosError = error as any;
      const message =
        axiosError?.response?.data?.detail ||
        axiosError?.response?.data?.error ||
        axiosError?.message ||
        "Failed to schedule cancellation";
      toast.error(message);
    },
  });

  const cancelNowMutation = useMutation({
    mutationFn: async () => clientApi.cancelBilling(clientId, "immediate"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["b2bBillingStatus", clientId] });
      toast.success("Subscription canceled immediately.");
    },
    onError: (error: unknown) => {
      const axiosError = error as any;
      const message =
        axiosError?.response?.data?.detail ||
        axiosError?.response?.data?.error ||
        axiosError?.message ||
        "Failed to cancel subscription";
      toast.error(message);
    },
  });

  if (isLoading) {
    return (
      <section className="bg-card rounded-2xl border shadow-sm p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            B2B Billing Status
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Platform subscription &amp; billing info</p>
        </div>
        <div className="p-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">Failed to load billing status. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  const hasPaymentMethod = billingStatus?.has_payment_method;
  const paymentMethodStatus = billingStatus?.payment_method_status || "no_customer";
  const paymentMethod = billingStatus?.payment_method;
  const subscriptionStatus = billingStatus?.subscription_status || "inactive";
  const nextBillingDate = billingStatus?.next_billing_date;
  const currentPeriodStart = billingStatus?.current_period_start;
  const currentPeriodEnd = billingStatus?.current_period_end;
  const cancelAtPeriodEnd = !!billingStatus?.cancel_at_period_end;

  const canActivate =
    billingStatus?.payment_method_status === "active" &&
    subscriptionStatus !== "active" &&
    subscriptionStatus !== "past_due";
  const activateLabel = subscriptionStatus === "canceled" ? "Reactivate" : "Activate";

  const canCancel = subscriptionStatus === "active" || subscriptionStatus === "past_due";

  return (
    <section className="bg-card rounded-2xl border shadow-sm overflow-hidden">
      {/* Header with Activate button */}
      <div className="p-4 border-b flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            B2B Billing Status
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Platform subscription &amp; billing info</p>
        </div>
        {client && canActivate && (
          <Button
            type="button"
            size="sm"
            onClick={() => activateBillingMutation.mutate()}
            className="bg-primary hover:bg-primary/90 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm whitespace-nowrap"
            disabled={
              activateBillingMutation.isPending ||
              !canActivate
            }
          >
            {activateBillingMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Activating...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                {activateLabel}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-4 rounded-xl border bg-muted/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Subscription</p>
            <Badge variant={subscriptionStatus === "active" ? "default" : subscriptionStatus === "canceled" ? "destructive" : "secondary"}>
              {subscriptionStatus.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Current access period: {currentPeriodStart || "N/A"} to {currentPeriodEnd || "N/A"}
          </p>
          {subscriptionStatus !== "canceled" ? (
            <p className="text-xs text-muted-foreground">
              Next billing date: {nextBillingDate || "N/A"}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Next billing date: N/A (canceled)</p>
          )}
          {cancelAtPeriodEnd && (
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Cancellation is scheduled at period end{currentPeriodEnd ? ` (${currentPeriodEnd})` : ""}.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!canCancel || cancelAtPeriodEnd || cancelAtPeriodEndMutation.isPending}
              onClick={() => cancelAtPeriodEndMutation.mutate()}
            >
              Cancel At Period End
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={!canCancel || cancelNowMutation.isPending}
              onClick={() => cancelNowMutation.mutate()}
            >
              Cancel Now
            </Button>
          </div>
        </div>

        {/* Payment Method */}
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          Payment Method
        </h3>

        {paymentMethodStatus === "no_customer" && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-700 dark:text-amber-300">Awaiting client payment setup.</p>
          </div>
        )}

        {paymentMethodStatus === "no_payment_method" && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-700 dark:text-blue-300">Payment method pending.</p>
          </div>
        )}

        {paymentMethodStatus === "active" && hasPaymentMethod && paymentMethod ? (
          <div className="bg-muted/50 border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 bg-white dark:bg-gray-200 border border-gray-200 rounded flex items-center justify-center">
                <img
                  src={resolveCardIcon(paymentMethod.brand)}
                  alt={paymentMethod.brand}
                  className="h-3 object-contain opacity-80"
                />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {paymentMethod.brand.charAt(0).toUpperCase() + paymentMethod.brand.slice(1)}{" "}
                  •••• •••• •••• {paymentMethod.last4}
                </p>
                <p className="text-xs text-muted-foreground">
                  Expires: {paymentMethod.exp_month}/{paymentMethod.exp_year}
                </p>
              </div>
            </div>
            {paymentMethod.is_expired ? (
              <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 text-[10px] font-bold px-2 py-1 rounded-full border border-red-200 dark:border-red-600 flex items-center gap-1">
                Expired
              </span>
            ) : (
              <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold px-2 py-1 rounded-full border border-gray-200 dark:border-gray-600 flex items-center gap-1">
                <CheckCircle className="h-2.5 w-2.5" /> Active
              </span>
            )}
          </div>
        ) : (
          paymentMethodStatus === "active" && (
            <div className="bg-muted/50 border rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Payment method details could not be loaded.</p>
            </div>
          )
        )}
      </div>
    </section>
  );
}
