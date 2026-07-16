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
}

export function QuestionListHeader(props: QuestionListHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={props.onBack} className="h-8 w-8 text-slate-500 border-slate-200 hover:bg-slate-50 rounded-lg">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">{props.title}</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">{props.subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {props.extraActions}
        <Button
          variant={props.reorderActive ? "secondary" : "outline"}
          onClick={props.onToggleReorder}
          className={`h-9 px-4 text-[13px] font-semibold shadow-sm rounded-lg ${
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
        />
      </div>
    </header>
  );
}
