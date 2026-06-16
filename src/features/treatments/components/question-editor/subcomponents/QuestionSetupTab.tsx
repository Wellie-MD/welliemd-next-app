import { Label } from "@/components/ui/label";
import { Settings2 } from "lucide-react";
import type { QuestionKind } from "../../types";

interface QuestionSetupTabProps {
  text: string;
  setText: (val: string) => void;
  kind: QuestionKind;
  setKind: (val: QuestionKind) => void;
  required: boolean;
  setRequired: (val: boolean) => void;
}

export function QuestionSetupTab({
  text,
  setText,
  kind,
  setKind,
  required,
  setRequired,
}: QuestionSetupTabProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-slate-500" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Question Setup</h2>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <Label htmlFor="qText" className="block text-sm font-semibold text-slate-900 mb-1.5">
            Question Text <span className="text-red-500">*</span>
          </Label>
          <textarea
            id="qText"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all min-h-[80px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter the question text here..."
          />
          <p className="mt-1.5 text-xs text-slate-400">This text will be shown directly to the patient.</p>
        </div>

        <div>
          <Label htmlFor="qType" className="block text-sm font-semibold text-slate-900 mb-1.5">
            Question Type <span className="text-red-500">*</span>
          </Label>
          <select
            id="qType"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white h-10"
            value={kind}
            onChange={(e) => setKind(e.target.value as QuestionKind)}
          >
            <optgroup label="Basic Inputs">
              <option value="text">Text (Short Answer)</option>
              <option value="choice">Multiple Choice (Single/Multiple)</option>
              <option value="single_choice">Single Choice</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="number">Number</option>
              <option value="yes_no">Yes / No</option>
            </optgroup>
            <optgroup label="Specialized">
              <option value="checkout">Checkout (Product Display)</option>
              <option value="consent">Consent Checkbox</option>
              <option value="auth">Patient Authentication</option>
              <option value="section">Section Placeholder</option>
            </optgroup>
          </select>
        </div>

        <div className="h-px bg-slate-100 my-4"></div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">Required Question</div>
              <div className="text-xs text-slate-500">Patient must provide an answer to continue.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#12517A]"></div>
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
