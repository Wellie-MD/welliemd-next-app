import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Play,
  Save,
  ChevronLeft,
  ShieldCheck,
  FileText,
  ShoppingCart,
  MessageSquare,
  LayoutTemplate,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import type { ProgramQuestion, QuestionKind } from "../../types";
import { PatientFlowTestModal } from "../builder/PatientFlowTestModal";
import { useSaveProgramQuestion } from "../../hooks/useTreatmentLibraries";

import { QuestionSetupTab } from "./subcomponents/QuestionSetupTab";
import { QuestionContentTab } from "./subcomponents/QuestionContentTab";
import { QuestionVisibilityTab } from "./subcomponents/QuestionVisibilityTab";
import { QuestionPreviewTab } from "./subcomponents/QuestionPreviewTab";

interface QuestionEditorShellProps {
  programId: string;
  programName: string;
  questions: ProgramQuestion[];
  activeQuestion?: ProgramQuestion;
}

export function QuestionEditorShell({
  programId,
  programName,
  questions,
  activeQuestion,
}: QuestionEditorShellProps) {
  const currentQuestion = activeQuestion ?? questions[0];
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Controlled states for active question settings
  const [text, setText] = useState("");
  const [kind, setKind] = useState<QuestionKind>("text");
  const [required, setRequired] = useState(false);

  // Controlled states for Choices configuration (type-specific)
  const [choices, setChoices] = useState<string[]>([]);
  const [newChoiceText, setNewChoiceText] = useState("");

  // Controlled state for Consent configuration (type-specific)
  const [consentText, setConsentText] = useState("");

  // Controlled states for Visibility Rules
  const [hasVisibilityRule, setHasVisibilityRule] = useState(false);
  const [visQuestionId, setVisQuestionId] = useState("");
  const [visValue, setVisValue] = useState("");

  // Save mutation
  const { mutate: saveQuestion, isPending } = useSaveProgramQuestion(programId);

  // Sync state when active question changes
  useEffect(() => {
    if (currentQuestion) {
      setText(currentQuestion.text || "");
      setKind(currentQuestion.kind || "text");
      setRequired(!!currentQuestion.required);
      setChoices(currentQuestion.choices || []);
      setConsentText(currentQuestion.consentText || "");
      if (currentQuestion.visibilityRule) {
        setHasVisibilityRule(true);
        setVisQuestionId(currentQuestion.visibilityRule.questionId || "");
        setVisValue(currentQuestion.visibilityRule.value || "");
      } else {
        setHasVisibilityRule(false);
        setVisQuestionId("");
        setVisValue("");
      }
    }
  }, [currentQuestion]);

  const handleAddChoice = () => {
    if (!newChoiceText.trim()) return;
    if (choices.includes(newChoiceText.trim())) {
      toast({
        title: "Duplicate Choice",
        description: "This choice already exists.",
        variant: "destructive",
      });
      return;
    }
    setChoices([...choices, newChoiceText.trim()]);
    setNewChoiceText("");
  };

  const handleRemoveChoice = (index: number) => {
    const updated = [...choices];
    updated.splice(index, 1);
    setChoices(updated);
  };

  const handleSave = () => {
    if (!text.trim()) {
      toast({
        title: "Validation Error",
        description: "Question text is required.",
        variant: "destructive",
      });
      return;
    }

    const updatedQuestion: ProgramQuestion = {
      ...currentQuestion,
      text,
      kind,
      required,
      choices: kind === "choice" || kind === "single_choice" || kind === "multiple_choice" ? choices : undefined,
      consentText: kind === "consent" ? consentText : undefined,
      visibilityRule: hasVisibilityRule && visQuestionId
        ? { questionId: visQuestionId, value: visValue }
        : undefined,
    };

    saveQuestion(updatedQuestion, {
      onSuccess: () => {
        toast({
          title: "Changes Saved",
          description: "Question configuration has been updated.",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to save changes.",
          variant: "destructive",
        });
      },
    });
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case "auth":
        return <ShieldCheck className="h-4 w-4" />;
      case "section":
        return <LayoutTemplate className="h-4 w-4" />;
      case "consent":
        return <FileText className="h-4 w-4" />;
      case "checkout":
        return <ShoppingCart className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="h-screen max-h-screen flex flex-col bg-[#f8fafc] overflow-hidden">
      {/* Header */}
      <div className="shrink-0 z-20 border-b border-slate-200 bg-white px-6 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon" className="shrink-0 h-9 w-9 text-slate-500">
            <Link to={`/dashboard/treatments/programs/${programId}`}>
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 leading-none">{programName}</h1>
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Draft
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              Question {currentQuestion?.order ?? 1} of {questions.length}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-white" onClick={() => setIsTestModalOpen(true)}>
            <Play className="mr-2 h-4 w-4" />
            Test Patient Flow
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-[#12517A] text-white hover:bg-[#12517A]/90"
          >
            <Save className="mr-2 h-4 w-4" />
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <PatientFlowTestModal
        open={isTestModalOpen}
        onOpenChange={setIsTestModalOpen}
        previewContext={{
          mode: "program",
          id: programId,
          title: programName,
        }}
      />

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px,1fr,360px] overflow-hidden">
        {/* Left Column: Flow Sidebar */}
        <aside className="border-r border-slate-200 bg-white overflow-y-auto">
          <div className="sticky top-0 bg-white/95 backdrop-blur z-10 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Flow Layout</span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
              {questions.length}
            </span>
          </div>
          <div className="p-3 space-y-1.5">
            {questions.map((question) => {
              const isActive = question.id === currentQuestion?.id;
              return (
                <Link
                  key={question.id}
                  to={`/dashboard/treatments/programs/${programId}/questions/${question.id}`}
                  className={`flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-blue-50/50 text-[#12517A] shadow-sm ring-1 ring-blue-200"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                  }`}
                >
                  <div className={`shrink-0 mt-0.5 ${isActive ? "text-[#12517A]" : "text-slate-400"}`}>
                    {renderIcon(question.kind)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`font-semibold text-[10px] mb-0.5 ${
                        isActive ? "text-[#12517A]" : "text-slate-500"
                      }`}
                    >
                      Step {question.order}
                    </div>
                    <div className={`line-clamp-2 leading-tight text-xs ${isActive ? "font-semibold" : "font-medium"}`}>
                      {question.text}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Middle Column: Configuration Editor */}
        <main className="overflow-y-auto p-8 relative">
          <div className="max-w-3xl mx-auto space-y-8 pb-12">
            <QuestionSetupTab
              text={text}
              setText={setText}
              kind={kind}
              setKind={setKind}
              required={required}
              setRequired={setRequired}
            />

            <QuestionContentTab
              kind={kind}
              choices={choices}
              newChoiceText={newChoiceText}
              setNewChoiceText={setNewChoiceText}
              handleAddChoice={handleAddChoice}
              handleRemoveChoice={handleRemoveChoice}
              consentText={consentText}
              setConsentText={setConsentText}
            />

            <QuestionVisibilityTab
              hasVisibilityRule={hasVisibilityRule}
              setHasVisibilityRule={setHasVisibilityRule}
              visQuestionId={visQuestionId}
              setVisQuestionId={setVisQuestionId}
              visValue={visValue}
              setVisValue={setVisValue}
              questions={questions}
              currentQuestionId={currentQuestion?.id || ""}
            />
          </div>
        </main>

        {/* Right Column: Live Patient Preview */}
        <QuestionPreviewTab
          text={text}
          kind={kind}
          choices={choices}
          consentText={consentText}
        />
      </div>
    </div>
  );
}
