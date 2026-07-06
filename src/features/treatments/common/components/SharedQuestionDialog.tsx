import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { QuestionKind } from "@/features/treatments/types";

export interface SharedQuestionInput {
  questionText: string;
  questionType: QuestionKind;
  answerOptions: string[];
  required: boolean;
}

interface SharedQuestionDialogProps {
  open: boolean;
  programName: string;
  onOpenChange: (open: boolean) => void;
  onSaveQuestion: (input: SharedQuestionInput) => void;
  editingQuestion?: SharedQuestionInput | null;
}

export function SharedQuestionDialog({
  open,
  programName,
  onOpenChange,
  onSaveQuestion,
  editingQuestion,
}: SharedQuestionDialogProps) {
  const isEditing = Boolean(editingQuestion);
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<QuestionKind>("single_choice");
  const [answerOptions, setAnswerOptions] = useState("");
  const [required, setRequired] = useState(true);
  const [questionError, setQuestionError] = useState("");

  useEffect(() => {
    if (open && editingQuestion) {
      setQuestionText(editingQuestion.questionText);
      setQuestionType(editingQuestion.questionType);
      setAnswerOptions(editingQuestion.answerOptions.join("\n"));
      setRequired(editingQuestion.required);
      setQuestionError("");
      return;
    }

    if (open) {
      setQuestionText("");
      setQuestionType("single_choice");
      setAnswerOptions("");
      setRequired(true);
      setQuestionError("");
      return;
    }

    if (!open) {
      setQuestionText("");
      setQuestionType("single_choice");
      setAnswerOptions("");
      setRequired(true);
      setQuestionError("");
    }
  }, [editingQuestion, open]);

  const handleSubmit = () => {
    const trimmedQuestion = questionText.trim();
    if (!trimmedQuestion) {
      setQuestionError("Question text is required.");
      return;
    }

    const parsedAnswerOptions = answerOptions
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean);

    onSaveQuestion({
      questionText: trimmedQuestion,
      questionType,
      answerOptions: parsedAnswerOptions,
      required,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[620px] max-w-[calc(100vw-32px)] gap-0 rounded-xl border-0 bg-white p-6 text-slate-950 shadow-2xl dark:bg-[#171b27] dark:text-slate-50 [&>button]:hidden">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-950 dark:text-slate-50">
                {isEditing ? "Edit your question" : "Add a question"}
              </DialogTitle>
              <DialogDescription className="mt-2 max-w-[430px] text-[12px] font-medium leading-5 text-slate-400 dark:text-slate-500">
                {isEditing
                  ? `${programName} · added by your team`
                  : `${programName} · your team can add questions on top of the WellieMD set`}
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:outline-none focus-visible:ring-0 dark:border-slate-700 dark:bg-[#171b27] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            >
              Cancel
            </button>
          </div>
        </DialogHeader>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-[12px] font-bold text-slate-600 dark:text-slate-400">Question text</span>
            <textarea
              value={questionText}
              onChange={(event) => {
                setQuestionText(event.target.value);
                if (questionError) setQuestionError("");
              }}
              placeholder="e.g., Do you have any dietary restrictions?"
              className="mt-2 min-h-[56px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-500 focus:border-slate-300 focus:ring-0 dark:border-slate-700 dark:bg-[#171b27] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-600"
            />
            {questionError && <span className="mt-1 block text-xs font-semibold text-red-500">{questionError}</span>}
          </label>

          <div className="grid grid-cols-[1fr_auto] items-end gap-4">
            <label className="block">
              <span className="text-[12px] font-bold text-slate-600 dark:text-slate-400">Type</span>
              <select
                value={questionType}
                onChange={(event) => setQuestionType(event.target.value as QuestionKind)}
                className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors focus:border-slate-300 focus:ring-0 dark:border-slate-700 dark:bg-[#171b27] dark:text-slate-100 dark:focus:border-slate-600"
              >
                <option value="single_choice">Single Choice</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="yes_no">Yes / No</option>
                <option value="text">Text</option>
                <option value="textarea">Textarea</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
              </select>
            </label>

            <div className="pb-1">
              <div className="mb-2 text-[12px] font-bold text-slate-600 dark:text-slate-400">Required</div>
              <Switch
                checked={required}
                onCheckedChange={setRequired}
                className="h-6 w-11 border-0 bg-slate-200 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=checked]:bg-blue-600 dark:bg-slate-600 dark:data-[state=checked]:bg-blue-600 [&>span]:h-5 [&>span]:w-5 [&>span]:data-[state=checked]:translate-x-5"
              />
            </div>
          </div>

          <label className="block">
            <span className="text-[12px] font-bold text-slate-600 dark:text-slate-400">
              Answer options <span className="font-medium text-slate-400 dark:text-slate-500">(one per line)</span>
            </span>
            <textarea
              value={answerOptions}
              onChange={(event) => setAnswerOptions(event.target.value)}
              placeholder="One option per line"
              className="mt-2 min-h-[90px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-500 focus:border-slate-300 focus:ring-0 dark:border-slate-700 dark:bg-[#171b27] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-600"
            />
          </label>
        </div>

        <DialogFooter className="mt-5 flex-row justify-end gap-2 space-x-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:outline-none focus-visible:ring-0 dark:border-slate-700 dark:bg-[#171b27] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus-visible:outline-none focus-visible:ring-0 dark:border dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
          >
            {isEditing ? "Save changes" : "Add question"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
