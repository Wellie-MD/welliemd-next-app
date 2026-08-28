import { FlaskConical, ShoppingCart } from "lucide-react";

export type CheckoutOfferMode = "medicine" | "lab";

interface CheckoutOfferTypeSectionProps {
  mode: CheckoutOfferMode;
  onChange: (mode: CheckoutOfferMode) => void;
  disabled?: boolean;
}

export function CheckoutOfferTypeSection({ mode, onChange, disabled = false }: CheckoutOfferTypeSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-wide text-slate-900">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-100 text-violet-700">
          <ShoppingCart className="h-3.5 w-3.5" />
        </span>
        What does this step offer?
      </div>
      <p className="text-[11.5px] text-slate-500">
        Choose whether this checkout step lets the patient pick a medicine or order labs.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {(["medicine", "lab"] as const).map((option) => {
          const selected = mode === option;
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option)}
              className={`h-9 rounded-lg border text-[12px] font-bold transition-colors ${
                selected
                  ? "border-violet-600 bg-violet-50 text-violet-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
              data-testid={`checkout-offer-${option}`}
            >
              {option === "lab" && <FlaskConical className="mr-1.5 inline h-3.5 w-3.5" />}
              {option === "medicine" ? "Medicine" : "Lab"}
            </button>
          );
        })}
      </div>
    </section>
  );
}
