import { Plus } from "lucide-react";
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
  onAddSection: () => void;
  onAddConsent: () => void;
  onAddCheckout: () => void;
}

export function AddElementDropdown({
  onAddQuestion,
  onAddAuth,
  onAddSection,
  onAddConsent,
  onAddCheckout,
}: AddElementDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          className="h-9 bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
          data-testid="add-element-button"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Element
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px] p-2 bg-white border border-slate-200 rounded-xl shadow-xl">
        <DropdownMenuItem
          onClick={onAddQuestion}
          className="flex flex-col items-start gap-1 p-3 rounded-lg hover:bg-slate-50 cursor-pointer"
        >
          <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
            <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">?</span>
            Question
          </div>
          <div className="text-[10px] text-slate-400 leading-normal">
            Ask the patient something — text, choice, file, etc.
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onAddAuth}
          className="flex flex-col items-start gap-1 p-3 rounded-lg hover:bg-slate-50 cursor-pointer border-t border-slate-100"
        >
          <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
            <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">🔒</span>
            Patient Authentication
          </div>
          <div className="text-[10px] text-slate-400 leading-normal">
            Email, SMS code, photo ID, or account creation requirements.
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onAddSection}
          className="flex flex-col items-start gap-1 p-3 rounded-lg hover:bg-slate-50 cursor-pointer border-t border-slate-100"
        >
          <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
            <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">📋</span>
            Section
          </div>
          <div className="text-[10px] text-slate-400 leading-normal">
            Insert a reusable Common Section (Demographics, Medical Baseline...).
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onAddConsent}
          className="flex flex-col items-start gap-1 p-3 rounded-lg hover:bg-slate-50 cursor-pointer border-t border-slate-100"
        >
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
            <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">✍️</span>
            Consent
          </div>
          <div className="text-[10px] text-slate-400 leading-normal">
            Attach a legal consent the patient must acknowledge.
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onAddCheckout}
          className="flex flex-col items-start gap-1 p-3 rounded-lg hover:bg-slate-50 cursor-pointer border-t border-slate-100"
        >
          <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
            <span className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center">🛒</span>
            Checkout
          </div>
          <div className="text-[10px] text-slate-400 leading-normal">
            Show the patient available products and let them pick a regimen.
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
