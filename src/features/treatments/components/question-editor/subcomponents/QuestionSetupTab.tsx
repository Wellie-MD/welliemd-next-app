import { Settings2 } from "lucide-react";
import type { QuestionKind } from "../../types";

interface QuestionSetupTabProps {
  text: string;
  setText: (val: string) => void;
  kind: QuestionKind;
  setKind: (val: QuestionKind) => void;
}

export function QuestionSetupTab({
  text,
  setText,
  kind,
  setKind,
}: QuestionSetupTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center h-5 w-5 rounded bg-blue-100 text-blue-600">
          <Settings2 className="h-3 w-3" />
        </div>
        <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-800">
          QUESTION SETUP
        </h3>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-1.5">
            Question Text <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all min-h-[80px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What was the highest weight that you have reached?"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-900 mb-1.5">
            Question Type <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white h-10 font-medium"
            value={kind}
            onChange={(e) => setKind(e.target.value as QuestionKind)}
          >
            <optgroup label="Basic Inputs">
              <option value="text">Short Text</option>
              <option value="textarea">Long Text</option>
              <option value="single_choice">Single Choice</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="number">Number</option>
              <option value="yes_no">Yes / No</option>
            </optgroup>
            <optgroup label="Specialized">
              <option value="checkout">Checkout (Product Display)</option>
              <option value="consent">Consent Document</option>
              <option value="auth">Patient Authentication</option>
            </optgroup>
          </select>
        </div>
      </div>
    </div>
  );
}
