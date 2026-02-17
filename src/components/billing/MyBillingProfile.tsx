import { useEffect, useState } from "react";
import billingService, { BillingProfile, BillingSubscriptionStatus } from "@/services/billingService";
// Stripe imports are loaded dynamically at runtime to avoid build-time errors when the
// packages are not installed in some environments. We still list them in package.json
// so a normal dev environment should install them.
import visaIcon from "@/assets/icons/payment-methods/visa.svg";
import mastercardIcon from "@/assets/icons/payment-methods/mastercard.svg";
import amexIcon from "@/assets/icons/payment-methods/american-express.svg";
import discoverIcon from "@/assets/icons/payment-methods/discover.svg";
import dinersIcon from "@/assets/icons/payment-methods/diners-club.svg";
import genericCardIcon from "@/assets/icons/payment-methods/generic-card.svg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function Modal({ children, onClose }: { children: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-xl shadow-xl border w-[92%] max-w-xl max-h-[90vh] overflow-y-auto p-5">
        {children}
        <div className="mt-5 text-right">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MyBillingProfile() {
  const [profile, setProfile] = useState<BillingProfile | null>(null);
  const [paymentMethodStatus, setPaymentMethodStatus] =
    useState<string>("unknown");
  const [paymentMethod, setPaymentMethod] = useState<{
    id?: string;
    brand?: string;
    last4?: string;
    exp_month?: number;
    exp_year?: number;
    is_expired?: boolean;
  } | null>(null);
  const [billingDetails, setBillingDetails] = useState<{
    name?: string;
    email?: string;
    address?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "update">("add");
  const [subscriptionStatus, setSubscriptionStatus] = useState<BillingSubscriptionStatus | null>(null);

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

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const pmData = await billingService.getPaymentMethodStatus();
      const subStatus = await billingService.getSubscriptionStatus();

      if (mounted && pmData) {
        setPaymentMethodStatus(pmData.status);
        
        // Use the new structured response format
        if (pmData.payment_method) {
          setPaymentMethod(pmData.payment_method);
          // Also update the profile for backward compatibility
          setProfile((prev) => ({
            ...(prev ?? {}),
            payment_method: {
              brand: pmData.payment_method?.brand,
              last4: pmData.payment_method?.last4,
              exp_month: pmData.payment_method?.exp_month,
              exp_year: pmData.payment_method?.exp_year,
            },
          }));
        } else {
          setPaymentMethod(null);
          setProfile((prev) => ({
            ...(prev ?? {}),
            payment_method: null,
          }));
        }
        
        if (pmData.billing_details) {
          setBillingDetails(pmData.billing_details);
          setProfile((prev) => ({
            ...(prev ?? {}),
            client_name: pmData.billing_details?.name,
          }));
        }
      } else {
        setPaymentMethodStatus("no_payment_method");
        setPaymentMethod(null);
      }
      if (mounted && subStatus) {
        setSubscriptionStatus(subStatus);
      }
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const subscriptionState = (subscriptionStatus?.subscription_status || "unknown").toLowerCase();
  const hasPaymentMethod = Boolean(paymentMethod?.last4 || profile?.payment_method?.last4);
  const showNoPaymentMethodState =
    paymentMethodStatus === "no_customer" ||
    paymentMethodStatus === "no_payment_method" ||
    !hasPaymentMethod;
  const subscriptionBadgeClass =
    subscriptionState === "active"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : subscriptionState === "past_due" || subscriptionState === "unpaid"
      ? "bg-rose-100 text-rose-800 border-rose-200"
      : "bg-slate-100 text-slate-700 border-slate-200";

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-5xl space-y-4 animate-pulse">
          <div className="h-8 w-64 rounded bg-slate-200" />
          <div className="h-36 rounded-xl bg-slate-200" />
          <div className="h-36 rounded-xl bg-slate-200" />
          <div className="h-28 rounded-xl bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="layout-content-container flex flex-col w-full max-w-5xl space-y-5">
        <div className="flex flex-wrap justify-between items-end gap-3">
          <div>
            <p className="text-3xl font-bold leading-tight">
            My Billing Profile
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Manage payment method, billing identity, and subscription cycle.
            </p>
          </div>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {showNoPaymentMethodState ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="font-semibold text-amber-900">No payment method on file</p>
                <p className="text-sm text-amber-700 mt-1">
                  {paymentMethodStatus === "no_customer"
                    ? "Please add your payment method to enable billing for medication and shipping costs."
                    : "Your billing account is set up, but no payment method has been added yet."}
                </p>
                <Button
                  className="mt-3"
                  onClick={async () => {
                    setModalMode("add");
                    setShowModal(true);
                    setModalContent({ loading: true });
                    const res = await billingService.postSetupIntent();
                    setModalContent(
                      res && res.client_secret
                        ? { loading: false, client_secret: res.client_secret }
                        : { loading: false, error: "Failed to create setup intent" }
                    );
                  }}
                >
                  Add Payment Method
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-slate-50/70 p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={resolveCardIcon(paymentMethod?.brand || profile?.payment_method?.brand)}
                    alt={paymentMethod?.brand || profile?.payment_method?.brand || "card"}
                    className="h-10 w-auto shrink-0"
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {paymentMethod
                        ? `${paymentMethod.brand?.charAt(0).toUpperCase()}${paymentMethod.brand?.slice(1) ?? ""} •••• ${paymentMethod.last4}`
                        : `${profile?.payment_method?.brand ?? "Card"} •••• ${profile?.payment_method?.last4 ?? ""}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {paymentMethod
                        ? `Expires ${paymentMethod.exp_month}/${paymentMethod.exp_year}`
                        : `Expires ${profile?.payment_method?.exp_month ?? "-"} / ${profile?.payment_method?.exp_year ?? "-"}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    setModalMode("update");
                    setShowModal(true);
                    setModalContent({ loading: true });
                    const res = await billingService.postSetupIntent();
                    setModalContent(
                      res && res.client_secret
                        ? { loading: false, client_secret: res.client_secret }
                        : { loading: false, error: "Failed to create setup intent" }
                    );
                  }}
                >
                  Update Payment Method
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Billing Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium text-right">{billingDetails?.name ?? profile?.client_name ?? "-"}</span>
            </div>
            <Separator />
            <div className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-right">{billingDetails?.email ?? "-"}</span>
            </div>
            <Separator />
            <div className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground">Address</span>
              <span className="font-medium text-right">{billingDetails?.address ?? "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Subscription Cycle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Status</span>
              <Badge className={`border ${subscriptionBadgeClass}`}>
                {subscriptionStatus?.subscription_status ?? "unknown"}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Current period: <span className="text-foreground font-medium">{subscriptionStatus?.current_period_start ?? "N/A"} to {subscriptionStatus?.current_period_end ?? "N/A"}</span>
            </p>
            <p className="text-muted-foreground">
              Next billing date: <span className="text-foreground font-medium">{subscriptionStatus?.next_billing_date ?? "N/A"}</span>
            </p>
            {subscriptionStatus?.cancel_at_period_end && (
              <p className="text-amber-700 font-medium">Cancellation is scheduled at period end.</p>
            )}
          </CardContent>
        </Card>
      </div>
      {showModal && (
        <Modal
          onClose={() => {
            setShowModal(false);
            setModalContent(null);
          }}
        >
          {modalContent?.loading ? (
            <div>
              {modalMode === "add"
                ? "Preparing payment method…"
                : "Preparing update…"}
            </div>
          ) : modalContent?.client_secret ? (
            <div>
              <p className="font-medium mb-2">
                {modalMode === "add"
                  ? "Add Payment Method"
                  : "Update Payment Method"}
              </p>
              <div>
                  <StripeSetupForm
                  clientSecret={modalContent.client_secret}
                  onSuccess={async (setupIntentId: string) => {
                    if (setupIntentId) {
                      await billingService.confirmSetupIntent(setupIntentId);
                    }
                    const pmData =
                      await billingService.getPaymentMethodStatus();
                    if (pmData) {
                      setPaymentMethodStatus(pmData.status);
                      if (pmData.payment_method) {
                        setPaymentMethod(pmData.payment_method);
                        setProfile((prev) => ({
                          ...(prev ?? {}),
                          payment_method: {
                            brand: pmData.payment_method?.brand,
                            last4: pmData.payment_method?.last4,
                            exp_month: pmData.payment_method?.exp_month,
                            exp_year: pmData.payment_method?.exp_year,
                          },
                        }));
                      }
                      if (pmData.billing_details) {
                        setBillingDetails(pmData.billing_details);
                        setProfile((prev) => ({
                          ...(prev ?? {}),
                          client_name: pmData.billing_details?.name,
                        }));
                      }
                    }
                    setShowModal(false);
                    setModalContent(null);
                  }}
                  onError={(errMsg: string) =>
                    setModalContent({ loading: false, error: errMsg })
                  }
                />
              </div>
            </div>
          ) : (
            <div className="text-red-600">
              {modalContent?.error ?? "Unknown error"}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function StripeSetupForm({
  clientSecret,
  onSuccess,
  onError,
}: {
  clientSecret: string;
  onSuccess: (setupIntentId: string) => void;
  onError: (msg: string) => void;
}) {
  const publishable = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!publishable) {
    return (
      <div className="p-4 border rounded bg-yellow-50 text-sm">
        <p className="font-semibold text-amber-800 mb-2">
          Stripe Configuration Required
        </p>
        <p className="text-amber-700 mb-3">
          Stripe publishable key is not set (VITE_STRIPE_PUBLISHABLE_KEY).
          Please configure it in your environment to enable the live payment
          element.
        </p>
        <div className="mt-3 bg-amber-100 p-2 rounded">
          <p className="text-xs text-amber-600 mb-1">
            Client Secret (for debugging):
          </p>
          <pre className="text-xs text-amber-800 break-all whitespace-pre-wrap overflow-wrap-anywhere">
            {clientSecret}
          </pre>
        </div>
      </div>
    );
  }

  const StripeLoader = () => {
    const [StripeElements, setStripeElements] = useState<any | null>(null);

    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const [{ loadStripe }, stripeReact] = await Promise.all([
            await import("@stripe/stripe-js"),
            await import("@stripe/react-stripe-js"),
          ]);
          const stripePromise = loadStripe(publishable);
          if (!mounted) return;
          setStripeElements({
            Elements: stripeReact.Elements,
            stripePromise,
            PaymentElement: stripeReact.PaymentElement,
            useStripe: stripeReact.useStripe,
            useElements: stripeReact.useElements,
          });
        } catch (err) {
          console.error("Failed to load stripe libs", err);
          setStripeElements(null);
        }
      })();
      return () => {
        mounted = false;
      };
    }, []);

    if (!StripeElements) return <div>Loading payment UI…</div>;

    const ElementsComp = StripeElements.Elements;
    const PaymentElem = StripeElements.PaymentElement;

    const useStripeHook = StripeElements.useStripe;
    const useElementsHook = StripeElements.useElements;

    return (
      <ElementsComp
        stripe={StripeElements.stripePromise}
        options={{ clientSecret }}
      >
        <DynamicInnerForm
          PaymentElem={PaymentElem}
          useStripeHook={useStripeHook}
          useElementsHook={useElementsHook}
          onSuccess={onSuccess}
          onError={onError}
        />
      </ElementsComp>
    );
  };

  return <StripeLoader />;
}

function DynamicInnerForm({
  PaymentElem,
  useStripeHook,
  useElementsHook,
  onSuccess,
  onError,
}: {
  PaymentElem: any;
  useStripeHook: any;
  useElementsHook: unknown;
  onSuccess: (setupIntentId: string) => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripeHook();
  const elements = useElementsHook();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: unknown) => {
    e.preventDefault();
    if (!stripe || !elements) {
      onError("Stripe has not loaded yet");
      return;
    }
    try {
      setSubmitting(true);
      const res = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });

      if (res.error) {
        onError(res.error.message || "Failed to confirm payment method");
      } else if (
        res.setupIntent &&
        (res.setupIntent.status === "succeeded" ||
          res.setupIntent.status === "requires_capture" ||
          res.setupIntent.status === "requires_confirmation" ||
          res.setupIntent.status === "processing")
      ) {
        // Success - call callback with setup intent id
        onSuccess(res.setupIntent?.id || "");
      } else {
        onError("Unexpected setup intent result");
      }
    } catch (err: unknown) {
      onError(err?.message ?? "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-2 border rounded">
        <PaymentElem />
      </div>
      <div className="text-right">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save payment method"}
        </Button>
      </div>
    </form>
  );
}
