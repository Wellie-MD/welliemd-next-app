import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Play, ChevronLeft, Trash2, Search } from "lucide-react";

export interface QuestionEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (question: { title: string; type: string; choices: string[] }) => void;
  initialQuestion?: { title: string; type: string; choices: string[] } | null;
  existingQuestionsCount: number;
}

export function QuestionEditorDialog({
  open,
  onOpenChange,
  onSave,
  initialQuestion,
  existingQuestionsCount,
}: QuestionEditorDialogProps) {
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("single_choice");
  const [choices, setChoices] = useState<string[]>(["Option 1", "Option 2"]);
  const [newChoice, setNewChoice] = useState("");

  const [required, setRequired] = useState(true);
  const [includeInQA, setIncludeInQA] = useState(true);
  const [hiddenFromPatient, setHiddenFromPatient] = useState(false);
  const [prefill, setPrefill] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialQuestion) {
        setQuestionText(initialQuestion.title);
        setQuestionType(initialQuestion.type === "multiple" ? "multiple_choice" : initialQuestion.type === "text" ? "text" : "single_choice");
        setChoices(initialQuestion.choices || []);
      } else {
        setQuestionText("");
        setQuestionType("single_choice");
        setChoices(["Option 1", "Option 2"]);
      }
    }
  }, [open, initialQuestion]);

  const handleAddChoice = () => {
    if (!newChoice.trim()) return;
    setChoices([...choices, newChoice.trim()]);
    setNewChoice("");
  };

  const handleRemoveChoice = (index: number) => {
    setChoices(choices.filter((_, idx) => idx !== index));
  };

  const handleCreateQuestion = () => {
    onSave({
      title: questionText.trim() || "(untitled question)",
      type: questionType === "multiple_choice" ? "multiple" : questionType === "text" ? "text" : "single",
      choices,
    });
    onOpenChange(false);
  };

  const questionIndex = initialQuestion ? existingQuestionsCount : existingQuestionsCount + 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[1500px] h-[95vh] p-0 flex flex-col overflow-hidden bg-slate-50 border border-slate-200 shadow-2xl">
        {/* Header Panel */}
        <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs text-slate-500 font-semibold border-slate-200 hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">WellieMD Initial Assessment</h2>
              <div className="text-[10px] text-slate-500 font-medium">
                Question {questionIndex} of {questionIndex} {initialQuestion ? "- Edit" : "- New"}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs text-slate-700 bg-white font-semibold">
              <Play className="h-3.5 w-3.5 mr-1.5 text-slate-400 fill-slate-400" />
              Test Patient Flow
            </Button>
            <Button size="sm" onClick={handleCreateQuestion} className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              {initialQuestion ? "Save Changes" : "Add Question"}
            </Button>
          </div>
        </div>

        {/* Main Content Workspace Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px,1fr,360px] overflow-hidden">
          {/* 1. Left Sidebar: Flow layout index */}
          <aside className="border-r border-slate-200 bg-white flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search the flow..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-blue-400"
                  disabled
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
              {/* Active new/editing question element */}
              <div className="flex items-start gap-2.5 p-2 rounded-lg text-blue-800 bg-blue-50/80 border border-blue-200 shadow-sm">
                <span className="text-[10px] font-bold text-blue-400 mt-0.5">{questionIndex}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] leading-snug truncate font-bold">
                    {questionText || "(untitled question)"}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 bg-white">
              <button
                className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-slate-200 rounded-lg text-[11px] font-bold text-slate-500 hover:bg-slate-50"
                disabled
              >
                <Plus className="h-3 w-3" />
                New Question
              </button>
            </div>
          </aside>

          {/* 2. Middle Panel: Setup & Options Config */}
          <main className="overflow-y-auto p-6 bg-slate-50 space-y-5">
            <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Question Setup
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Question Text *</label>
                <textarea
                  rows={2}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Type question here..."
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs outline-none focus:border-blue-400 shadow-inner"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Question Type *</label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none bg-white shadow-sm"
                >
                  <option value="single_choice">Single Choice (Radio)</option>
                  <option value="multiple_choice">Multiple Choice (Checkbox)</option>
                  <option value="text">Short Text (Input)</option>
                  <option value="textarea">Paragraph Text (Textarea)</option>
                </select>
              </div>
            </section>

            {(questionType === "single_choice" || questionType === "multiple_choice") && (
              <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#12517A] uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-[#12517A]"></span>
                  Content
                </div>
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-700">
                    Answer Choices <span className="text-slate-400 font-normal">({choices.length} answers)</span>
                  </div>
                  <div className="space-y-2">
                    {choices.map((choice, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-300 w-4">{idx + 1}</span>
                        <input
                          type="text"
                          value={choice}
                          onChange={(e) => {
                            const updated = [...choices];
                            updated[idx] = e.target.value;
                            setChoices(updated);
                          }}
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-400"
                        />
                        <button type="button" className="h-8 px-2 border border-slate-200 text-slate-400 hover:text-slate-600 rounded-lg text-[10px] font-bold whitespace-nowrap">
                          Mark DQ
                        </button>
                        <button type="button" onClick={() => handleRemoveChoice(idx)} className="p-2 text-slate-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newChoice}
                      onChange={(e) => setNewChoice(e.target.value)}
                      placeholder="Add new choice..."
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-400"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddChoice();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddChoice} variant="outline" size="sm" className="h-8 text-xs font-semibold">
                      + Add Answer
                    </Button>
                  </div>
                </div>
              </section>
            )}

            <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Visibility
              </div>
              <div className="text-[11px] leading-relaxed text-slate-400 font-medium">
                By default, every question shows to every patient. Add rules below to limit when this question appears — e.g. only show it when an earlier question has a specific answer. Combine conditions with AND / OR groups.
              </div>
              <div className="border border-dashed border-slate-200 rounded-lg p-6 text-center text-xs text-slate-400 italic font-medium">
                No visibility rules — this question is always shown.
              </div>
              <button className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-xs font-semibold">
                <Plus className="h-3.5 w-3.5" />
                Add visibility rule
              </button>
            </section>

            <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                Behavior
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-700">Required question</div>
                    <div className="text-[10px] text-slate-400">Patients can't proceed without answering. Turn off for optional questions.</div>
                  </div>
                  <Switch checked={required} onCheckedChange={setRequired} />
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div>
                    <div className="text-xs font-bold text-slate-700">Include in QA section</div>
                    <div className="text-[10px] text-slate-400">Shows in the patient's medical summary and Q&A review screens for the clinician.</div>
                  </div>
                  <Switch checked={includeInQA} onCheckedChange={setIncludeInQA} />
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div>
                    <div className="text-xs font-bold text-slate-700">Hidden from patient</div>
                    <div className="text-[10px] text-slate-400">Internal-only question. Used for system flags or admin-only data. Patients never see it.</div>
                  </div>
                  <Switch checked={hiddenFromPatient} onCheckedChange={setHiddenFromPatient} />
                </div>
              </div>
            </section>

            <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                Prefill
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-700">Prefill from previous answers</div>
                  <div className="text-[10px] text-slate-400">If the patient has answered this (or a matching field) in a prior Intake, prefill the answer here.</div>
                </div>
                <Switch checked={prefill} onCheckedChange={setPrefill} />
              </div>
            </section>
          </main>

          {/* 3. Right Panel: Patient Live Preview */}
          <aside className="border-l border-slate-200 bg-white p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Patient Preview</span>
              <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Updates live</span>
            </div>
            <div className="flex-1 bg-slate-950 rounded-2xl p-2.5 border-4 border-slate-800 shadow-2xl flex flex-col overflow-hidden max-h-[640px]">
              <div className="bg-slate-900 rounded-lg p-2 mb-3 flex items-center gap-2 border border-slate-800">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-500"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                </div>
                <div className="flex-1 text-[8px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded text-center truncate font-mono">
                  welliemd.com/intake
                </div>
              </div>
              <div className="flex-1 bg-white rounded-lg p-4 flex flex-col text-slate-800 overflow-y-auto">
                <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-1">
                  Question {questionIndex} of {questionIndex}
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug mb-4">
                  {questionText || "(Untitled question)"}
                </h4>
                {(questionType === "single_choice" || questionType === "multiple_choice") && (
                  <div className="space-y-2 flex-1">
                    {choices.map((choice, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 p-2.5 border border-slate-100 hover:border-blue-400 rounded-lg text-[10px] font-semibold text-slate-700 bg-slate-50/50 cursor-pointer transition-colors">
                        <span className="h-3 w-3 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                          {questionType === "single_choice" && <span className="h-1.5 w-1.5 rounded-full bg-transparent"></span>}
                        </span>
                        <span>{choice || `Option ${idx + 1}`}</span>
                      </div>
                    ))}
                  </div>
                )}
                {questionType === "text" && (
                  <input type="text" placeholder="Type your answer..." className="w-full border border-slate-200 rounded-lg p-2.5 text-[10px] bg-slate-50/30 outline-none" disabled />
                )}
                {questionType === "textarea" && (
                  <textarea rows={3} placeholder="Type your answer..." className="w-full border border-slate-200 rounded-lg p-2.5 text-[10px] bg-slate-50/30 outline-none" disabled />
                )}
                <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between shrink-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider py-1.5 px-2.5 cursor-not-allowed">Back</span>
                  <span className="text-[9px] font-bold text-white uppercase tracking-wider bg-blue-600 px-4 py-1.5 rounded-lg">Next</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
