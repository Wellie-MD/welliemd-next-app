import { useEffect, useState } from "react";
import billingService, { BillingProfile, BillingSubscriptionStatus } from "@/services/billingService";
// Stripe imports are loaded dynamically at runtime to avoid build-time errors when the
// packages are not installed in some environments. We still list them in package.json
// so a normal dev environment should install them.
import mockData from "@/data/mockData.json";
import visaIcon from "@/assets/icons/payment-methods/visa.svg";
import mastercardIcon from "@/assets/icons/payment-methods/mastercard.svg";
import amexIcon from "@/assets/icons/payment-methods/american-express.svg";
import discoverIcon from "@/assets/icons/payment-methods/discover.svg";
import dinersIcon from "@/assets/icons/payment-methods/diners-club.svg";
import genericCardIcon from "@/assets/icons/payment-methods/generic-card.svg";
import { Button } from "@/components/ui/button";

function Modal({ children, onClose }: { children: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded shadow-lg w-[90%] max-w-lg max-h-[90vh] overflow-y-auto p-4">
        {children}
        <div className="mt-4 text-right">
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
    useState<string>("active");
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
        }
        
        if (pmData.billing_details) {
          setBillingDetails(pmData.billing_details);
          setProfile((prev) => ({
            ...(prev ?? {}),
            client_name: pmData.billing_details?.name,
          }));
        }
      } else {
        // fallback to mock only if API fails completely
        const md: any = mockData as any;
        const mock = md.billingProfile ?? {
          client_name:
            md?.client?.name ??
            md?.dashboard?.payments?.[0]?.merchant ??
            "Acme Health",
          payment_method: {
            brand: "Visa",
            last4: "1383",
            exp_month: 8,
            exp_year: 2026,
          },
          next_invoice_date: "2025-11-26",
        };
        if (mounted) setProfile(mock);
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

  if (loading) return <div>Loading billing profile…</div>;

  return (
    <div className="p-4">
      <div className="layout-content-container flex flex-col w-full max-w-[960px]">
        <div className="flex flex-wrap justify-between gap-3 p-4">
          <p className="text-[#0d171b] tracking-light text-[32px] font-bold leading-tight min-w-72">
            My Billing Profile
          </p>
        </div>
        {!paymentMethod && paymentMethodStatus !== "no_customer" && paymentMethodStatus !== "no_payment_method" && (
          <p className="text-[#0d171b] text-base font-normal leading-normal pb-3 pt-1 px-4">
            This is the Payment method to be charged for medication and shipping
            costs when a prescription is sent to the pharmacy.
          </p>
        )}

        <h3 className="text-[#0d171b] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
          Payment Method
        </h3>

        {paymentMethodStatus === "no_customer" ||
        paymentMethodStatus === "no_payment_method" ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-6 mx-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5"
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
              <div className="flex-1">
                <p className="text-[#0d171b] text-base font-semibold mb-2">
                  No Payment Method on File
                </p>
                <p className="text-[#4c809a] text-sm mb-4">
                  {paymentMethodStatus === "no_customer"
                    ? "Please add your payment method to enable billing for medication and shipping costs."
                    : "Your billing account is set up, but no payment method has been added yet."}
                </p>
                <Button
                  onClick={async () => {
                    setModalMode("add");
                    setShowModal(true);
                    setModalContent({ loading: true });
                    const res = await billingService.postSetupIntent();
                    if (res && res.client_secret) {
                      setModalContent({
                        loading: false,
                        client_secret: res.client_secret,
                      });
                    } else {
                      setModalContent({
                        loading: false,
                        error: "Failed to create setup intent",
                      });
                    }
                  }}
                  className="bg-[#42b6f0] hover:bg-[#3aa5df] text-[#0d171b]"
                >
                  Add Payment Method
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 bg-slate-50 px-4 min-h-[72px] py-2">
            <img
              src={resolveCardIcon(paymentMethod?.brand || profile?.payment_method?.brand)}
              alt={paymentMethod?.brand || profile?.payment_method?.brand || "card"}
              className="h-10 w-auto shrink-0"
            />
            <div className="flex flex-col justify-center">
              <p className="text-[#0d171b] text-base font-medium leading-normal line-clamp-1">
                {paymentMethod
                  ? `Card: ${paymentMethod.brand?.charAt(0).toUpperCase()}${paymentMethod.brand?.slice(1) ?? ''} **** **** **** ${paymentMethod.last4}`
                  : profile?.payment_method
                  ? `Card: ${profile.payment_method.brand} **** **** **** ${profile.payment_method.last4}`
                  : "No payment method"}
              </p>
              <p className="text-[#4c809a] text-sm font-normal leading-normal line-clamp-2">
                {paymentMethod
                  ? `Expires: ${paymentMethod.exp_month}/${paymentMethod.exp_year}`
                  : profile?.payment_method
                  ? `Expires: ${profile.payment_method.exp_month}/${profile.payment_method.exp_year}`
                  : ""}
              </p>
            </div>
          </div>
        )}

        <h3 className="text-[#0d171b] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
          Billing Details
        </h3>
        <div className="p-4 grid grid-cols-[20%_1fr] gap-x-6">
          <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#cfdfe7] py-5">
            <p className="text-[#4c809a] text-sm font-normal leading-normal">
              Name:
            </p>
            <p className="text-[#0d171b] text-sm font-normal leading-normal">
              {billingDetails?.name ?? profile?.client_name ?? "-"}
            </p>
          </div>
          <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#cfdfe7] py-5">
            <p className="text-[#4c809a] text-sm font-normal leading-normal">
              Email:
            </p>
            <p className="text-[#0d171b] text-sm font-normal leading-normal">
              {billingDetails?.email ?? ""}
            </p>
          </div>
          <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#cfdfe7] py-5">
            <p className="text-[#4c809a] text-sm font-normal leading-normal">
              Address:
            </p>
            <p className="text-[#0d171b] text-sm font-normal leading-normal">
              {billingDetails?.address ?? ""}
            </p>
          </div>
        </div>
        {paymentMethodStatus === "active" && (
          <div className="flex px-4 py-3 justify-start">
            <button
              onClick={async () => {
                setModalMode("update");
                setShowModal(true);
                setModalContent({ loading: true });
                const res = await billingService.postSetupIntent();
                if (res && res.client_secret) {
                  setModalContent({
                    loading: false,
                    client_secret: res.client_secret,
                  });
                } else {
                  setModalContent({
                    loading: false,
                    error: "Failed to create setup intent",
                  });
                }
              }}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#42b6f0] text-[#0d171b] text-sm font-bold leading-normal tracking-[0.015em]"
            >
              <span className="truncate">Update Payment Method</span>
            </button>
          </div>
        )}

        <h3 className="text-[#0d171b] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
          Subscription Cycle
        </h3>
        <div className="px-4 py-3 rounded-lg border bg-slate-50">
          <p className="text-sm text-[#0d171b]">
            Status: <span className="font-semibold">{subscriptionStatus?.subscription_status ?? "unknown"}</span>
          </p>
          <p className="text-sm text-[#4c809a] mt-1">
            Current period: {subscriptionStatus?.current_period_start ?? "N/A"} to {subscriptionStatus?.current_period_end ?? "N/A"}
          </p>
          <p className="text-sm text-[#4c809a]">
            Next billing date: {subscriptionStatus?.next_billing_date ?? "N/A"}
          </p>
          {subscriptionStatus?.cancel_at_period_end && (
            <p className="text-sm text-amber-700 mt-1">Cancellation is scheduled at period end.</p>
          )}
        </div>
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
