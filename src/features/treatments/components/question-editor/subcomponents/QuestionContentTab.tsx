import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import type { QuestionKind } from "../../types";

interface QuestionContentTabProps {
  kind: QuestionKind;
  choices: string[];
  newChoiceText: string;
  setNewChoiceText: (val: string) => void;
  handleAddChoice: () => void;
  handleRemoveChoice: (idx: number) => void;
  consentText: string;
  setConsentText: (val: string) => void;
}

export function QuestionContentTab({
  kind,
  choices,
  newChoiceText,
  setNewChoiceText,
  handleAddChoice,
  handleRemoveChoice,
  consentText,
  setConsentText,
}: QuestionContentTabProps) {
  const isChoiceType = kind === "choice" || kind === "single_choice" || kind === "multiple_choice";

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Content & Options</h2>
      </div>
      <div className="p-6">
        {isChoiceType && (
          <div className="space-y-4">
            <Label className="block text-sm font-semibold text-slate-900">Configure Choices</Label>
            <div className="space-y-2">
              {choices.map((choice, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm"
                >
                  <span className="font-medium text-slate-800">{choice}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                    onClick={() => handleRemoveChoice(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add new choice..."
                value={newChoiceText}
                onChange={(e) => setNewChoiceText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddChoice()}
              />
              <Button onClick={handleAddChoice} className="bg-[#12517A] text-white hover:bg-[#12517A]/90 shrink-0">
                <Plus className="mr-2 h-4 w-4" /> Add Option
              </Button>
            </div>
          </div>
        )}

        {kind === "consent" && (
          <div className="space-y-3">
            <Label htmlFor="consText" className="block text-sm font-semibold text-slate-900">
              Consent Document Rich Text
            </Label>
            <Textarea
              id="consText"
              placeholder="Insert the legal terms here..."
              value={consentText}
              onChange={(e) => setConsentText(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
        )}

        {kind === "checkout" && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500 text-xs">
            Recommended products from the checkout module configuration are matched dynamically.
            <br />
            Select which Products or categories this step recommends.
          </div>
        )}

        {!isChoiceType && kind !== "consent" && kind !== "checkout" && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500 text-sm">
            No custom sub-configurations required for <strong>{kind}</strong> question type.
          </div>
        )}
      </div>
    </section>
  );
}
