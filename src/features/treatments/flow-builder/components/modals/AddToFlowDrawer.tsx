import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { ConsentForm, Program, CommonSection, CustomProgramBuilderAddItem } from "@/features/treatments/types";

import { FieldLibraryTab } from "../tabs/FieldLibraryTab";
import { QuestionCreatorTab } from "../tabs/QuestionCreatorTab";
import { ProgramLibraryTab } from "../tabs/ProgramLibraryTab";
import { ConsentLibraryTab } from "../tabs/ConsentLibraryTab";
import { CheckoutOptionTab } from "../tabs/CheckoutOptionTab";

interface AddToFlowDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programs: Program[];
  sections: CommonSection[];
  consents: ConsentForm[];
  onAddItem: (item: CustomProgramBuilderAddItem) => void;
  flowItems?: Array<{ kind: string; title: string; sourceId?: string; mappedField?: string }>;
}

type TabKey = "fields" | "question" | "eligibility" | "consent" | "checkout";

export function AddToFlowDrawer({
  open,
  onOpenChange,
  programs,
  sections,
  consents,
  onAddItem,
  flowItems = [],
}: AddToFlowDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("fields");

  const renderTabContent = () => {
    switch (activeTab) {
      case "fields":
        return <FieldLibraryTab sections={sections} onAddItem={onAddItem} flowItems={flowItems} />;
      case "question":
        return <QuestionCreatorTab onAddItem={onAddItem} flowItems={flowItems} />;
      case "eligibility":
        return <ProgramLibraryTab programs={programs} onAddItem={onAddItem} flowItems={flowItems} />;
      case "consent":
        return <ConsentLibraryTab consents={consents} onAddItem={onAddItem} flowItems={flowItems} />;
      case "checkout":
        return <CheckoutOptionTab programs={programs} flowItems={flowItems} />;
      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[540px] flex flex-col p-0 border-l border-slate-200 bg-slate-50 overflow-hidden sm:max-w-none shadow-2xl"
      >
        <SheetHeader className="p-6 pb-4 bg-white border-b border-slate-200">
          <SheetTitle className="text-xl">Add to flow</SheetTitle>
          <SheetDescription className="text-slate-500">
            Click any item to add it to the end of the flow. Drag to reorder afterward.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pt-4 bg-white border-b border-slate-200">
          <div className="flex space-x-6 overflow-x-auto scrollbar-hide pb-[-1px]">
            {[
              { id: "fields", label: "Section Fields" },
              { id: "question", label: "Custom Question" },
              { id: "eligibility", label: "Programs" },
              { id: "consent", label: "Consent" },
              { id: "checkout", label: "Inherited Checkout" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabKey)}
                className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-[#2563eb]"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563eb] rounded-t-full"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {renderTabContent()}
        </div>
      </SheetContent>
    </Sheet>
  );
}
