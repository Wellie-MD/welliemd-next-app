import { useEffect, useState } from "react";
import billingService, { BillingProfile } from "@/services/billingService";
// Stripe imports are loaded dynamically at runtime to avoid build-time errors when the
// packages are not installed in some environments. We still list them in package.json
// so a normal dev environment should install them.
import mockData from "@/data/mockData.json";
import visaIcon from "@/assets/icons/payment-methods/visa.svg";
import { Button } from "@/components/ui/button";

function Modal({ children, onClose }: { children: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded shadow-lg w-[90%] max-w-lg p-4">
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
  const [paymentMethodText, setPaymentMethodText] = useState<string | null>(
    null
  );
  const [paymentMethodStatus, setPaymentMethodStatus] =
    useState<string>("active");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<any | null>(null);

  // Parse billing fields from the API text when available
  const parseBillingFromText = (text?: string) => {
    if (!text) return null;
    const extract = (label: string) => {
      // match 'Label: value' on same line or Label:\n\nvalue
      const re = new RegExp(label + "\\s*:\\s*(?:\\n\\s*)*([^\\n]+)", "i");
      const m = text.match(re);
      if (m && m[1]) return m[1].trim();
      return "";
    };

    const name = extract("Name");
    const email = extract("Email");
    const address = extract("Address");

    // card details
    const cardLineMatch = text.match(/Card:\s*([^\n]+)/i);
    const last4Match = text.match(/(\d{4})/g);
    const expMatch = text.match(/Expires:\s*([^\n]+)/i);

    const payment_method: any = {};
    if (cardLineMatch) {
      const brandMatch = cardLineMatch[1].match(/(\w+)/);
      if (brandMatch) payment_method.brand = brandMatch[1];
    }
    if (last4Match && last4Match.length > 0)
      payment_method.last4 = last4Match[last4Match.length - 1];
    if (expMatch) {
      const exp = expMatch[1];
      const [m, y] = exp.split("/").map((s) => s.trim());
      const exp_month = Number(m) || undefined;
      const exp_year = Number(y) || undefined;
      if (exp_month) payment_method.exp_month = exp_month;
      if (exp_year) payment_method.exp_year = exp_year;
    }

    const result: any = {};
    if (name) result.client_name = name;
    if (email) result.email = email;
    if (address) result.address = address;
    if (Object.keys(payment_method).length)
      result.payment_method = payment_method;
    return result as Partial<BillingProfile> | null;
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const pmData = await billingService.getPaymentMethodStatus();

      if (mounted && pmData) {
        setPaymentMethodStatus(pmData.status);
        setPaymentMethodText(pmData.text);
        const parsed = parseBillingFromText(pmData.text);
        if (parsed) {
          setProfile((prev) => ({ ...(prev ?? {}), ...parsed }));
        }
      } else {
        // fallback to mock
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
        {!paymentMethodText && (
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
            <img src={visaIcon} alt="card" className="h-10 w-auto shrink-0" />
            <div className="flex flex-col justify-center">
              <p className="text-[#0d171b] text-base font-medium leading-normal line-clamp-1">
                {paymentMethodText
                  ? (() => {
                      const m = paymentMethodText.match(/Card:\s*([^\n]+)/i);
                      return m ? m[1] : "Card: —";
                    })()
                  : profile?.payment_method
                  ? `Card: ${profile.payment_method.brand} **** **** **** ${profile.payment_method.last4}`
                  : "No payment method"}
              </p>
              <p className="text-[#4c809a] text-sm font-normal leading-normal line-clamp-2">
                {paymentMethodText
                  ? (() => {
                      const m = paymentMethodText.match(/Expires:\s*([^\n]+)/i);
                      return m ? `Expires: ${m[1]}` : "";
                    })()
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
              {profile?.client_name ?? "-"}
            </p>
          </div>
          <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#cfdfe7] py-5">
            <p className="text-[#4c809a] text-sm font-normal leading-normal">
              Email:
            </p>
            <p className="text-[#0d171b] text-sm font-normal leading-normal">
              {(profile as any)?.email ?? ""}
            </p>
          </div>
          <div className="col-span-2 grid grid-cols-subgrid border-t border-t-[#cfdfe7] py-5">
            <p className="text-[#4c809a] text-sm font-normal leading-normal">
              Address:
            </p>
            <p className="text-[#0d171b] text-sm font-normal leading-normal">
              {(profile as any)?.address ?? ""}
            </p>
          </div>
        </div>
        {paymentMethodStatus === "active" && (
          <div className="flex px-4 py-3 justify-start">
            <button
              onClick={async () => {
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
      </div>
      {showModal && (
        <Modal
          onClose={() => {
            setShowModal(false);
            setModalContent(null);
          }}
        >
          {modalContent?.loading ? (
            <div>Preparing update flow…</div>
          ) : modalContent?.client_secret ? (
            <div>
              <p className="font-medium mb-2">Update Payment Method</p>
              <div>
                <StripeSetupForm
                  clientSecret={modalContent.client_secret}
                  onSuccess={async () => {
                    const pmData =
                      await billingService.getPaymentMethodStatus();
                    if (pmData) {
                      setPaymentMethodStatus(pmData.status);
                      setPaymentMethodText(pmData.text);
                      const parsed = parseBillingFromText(pmData.text);
                      if (parsed)
                        setProfile((prev) => ({ ...(prev ?? {}), ...parsed }));
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
  onSuccess: () => void;
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
  onSuccess: () => void;
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
          res.setupIntent.status === "requires_confirmation")
      ) {
        // Success - call callback
        onSuccess();
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
