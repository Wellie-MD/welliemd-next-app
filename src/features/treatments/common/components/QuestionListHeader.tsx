import { ArrowLeft, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddElementDropdown } from "@/features/treatments/common/components/AddElementDropdown";

interface QuestionListHeaderProps {
  title: string;
  subtitle: string;
  extraActions?: React.ReactNode;
  reorderActive: boolean;
  onBack: () => void;
  onToggleReorder: () => void;
  onAddQuestion: () => void;
  onAddAuth: () => void;
  onAddServiceArea: () => void;
  onAddSection: () => void;
  onAddConsent: () => void;
  onAddCheckout: () => void;
  /** Disables the Patient Authentication item once the Program already has it. */
  hasAuthentication?: boolean;
}

export function QuestionListHeader(props: QuestionListHeaderProps) {
  return (
    <header className="flex items-center justify-between bg-transparent">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={props.onBack} className="h-8 w-8 rounded-md border-slate-200 bg-white text-slate-500 shadow-none hover:bg-slate-50">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-[20px] font-semibold leading-tight tracking-[-0.02em] text-slate-950">{props.title}</h1>
          <p className="mt-1 text-[11px] text-slate-400">{props.subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {props.extraActions}
        <Button
          variant={props.reorderActive ? "secondary" : "outline"}
          onClick={props.onToggleReorder}
          className={`h-9 rounded-md border-0 px-3 text-[11px] font-medium shadow-none ${
            props.reorderActive
              ? "bg-slate-100 text-slate-900 border-slate-300"
              : "text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <ArrowUpDown className="h-4 w-4 mr-2 text-slate-400" />
          {props.reorderActive ? "Done Reordering" : "Reorder"}
        </Button>
        <AddElementDropdown
          onAddQuestion={props.onAddQuestion}
          onAddAuth={props.onAddAuth}
          onAddServiceArea={props.onAddServiceArea}
          onAddSection={props.onAddSection}
          onAddConsent={props.onAddConsent}
          onAddCheckout={props.onAddCheckout}
          hasAuthentication={props.hasAuthentication}
        />
      </div>
    </header>
  );
}
