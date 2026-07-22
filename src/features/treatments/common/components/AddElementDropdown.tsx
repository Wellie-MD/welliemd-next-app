import {
  ChevronDown,
  FileCheck,
  LayoutTemplate,
  MapPin,
  Plus,
  ShoppingCart,
  CircleHelp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AddElementDropdownProps {
  onAddQuestion: () => void;
  onAddAuth: () => void;
  onAddServiceArea?: () => void;
  onAddSection: () => void;
  onAddConsent: () => void;
  onAddCheckout: () => void;
}

export function AddElementDropdown({
  onAddQuestion,
  onAddAuth: _onAddAuth,
  onAddServiceArea,
  onAddSection,
  onAddConsent,
  onAddCheckout,
}: AddElementDropdownProps) {
  const items = [
    {
      label: "Question",
      description: "Ask the patient something — text, choice, file, etc.",
      onClick: onAddQuestion,
      icon: CircleHelp,
      color: "text-slate-900",
      iconClass: "bg-indigo-100 text-indigo-600 border-indigo-100",
    },
    {
      label: "Service Area Check",
      description: "Patient picks their state up front; blocks if this treatment isn’t offered there.",
      onClick: onAddServiceArea || onAddQuestion,
      icon: MapPin,
      color: "text-slate-900",
      iconClass: "bg-sky-100 text-sky-600 border-sky-100",
    },
    {
      label: "Section",
      description: "Insert a reusable Common Section (Demographics, Medical Baseline...).",
      onClick: onAddSection,
      icon: LayoutTemplate,
      color: "text-slate-900",
      iconClass: "bg-blue-100 text-blue-600 border-blue-100",
    },
    {
      label: "Consent",
      description: "Attach a legal consent the patient must acknowledge.",
      onClick: onAddConsent,
      icon: FileCheck,
      color: "text-slate-900",
      iconClass: "bg-violet-100 text-violet-600 border-violet-100",
    },
    {
      label: "Checkout",
      description: "Show the patient available products and let them pick a regimen.",
      onClick: onAddCheckout,
      icon: ShoppingCart,
      color: "text-slate-900",
      iconClass: "bg-emerald-100 text-emerald-600 border-emerald-100",
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="sm" className="text-[11px] font-medium" data-testid="add-element-button">
          <Plus className="mr-2 h-4 w-4" />
          Add Element
          <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-80" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[255px] rounded-lg border border-slate-200 bg-white p-2 shadow-xl"
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={item.label}
              onClick={item.onClick}
              className="group flex cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 outline-none hover:bg-slate-50 focus:bg-slate-50"
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${item.iconClass}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">
                <span className={`block text-[12px] font-extrabold leading-tight ${item.color}`}>
                  {item.label}
                </span>
                <span className="mt-0.5 block text-[10.5px] font-medium leading-snug text-slate-400">
                  {item.description}
                </span>
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
