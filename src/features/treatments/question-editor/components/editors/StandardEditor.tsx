import { useState, useEffect } from "react";
import { QuestionEditorHeader } from "@/features/treatments/question-editor/components/shell/QuestionEditorHeader";
import { QuestionSetupTab } from "@/features/treatments/question-editor/components/tabs/QuestionSetupTab";
import { QuestionContentTab } from "@/features/treatments/question-editor/components/tabs/QuestionContentTab";
import { QuestionVisibilityTab } from "@/features/treatments/question-editor/components/tabs/QuestionVisibilityTab";
import { QuestionPreviewTab } from "@/features/treatments/question-editor/components/tabs/QuestionPreviewTab";
import { Switch } from "@/components/ui/switch";
import { Activity, RefreshCcw } from "lucide-react";
import type { ProgramQuestion, QuestionKind, VisibilityRuleGroup } from "@/features/treatments/types";

interface StandardEditorProps {
  activeQuestion?: ProgramQuestion;
  questions: ProgramQuestion[];
  programName?: string;
  sidebar: React.ReactNode;
  onSave: (question: ProgramQuestion) => void;
  onClose: () => void;
  onTestFlow?: () => void;
}

export function StandardEditor({
  activeQuestion,
  questions,
  programName = "WellieMD Initial Assessment",
  sidebar,
  onSave,
  onClose,
  onTestFlow,
}: StandardEditorProps) {
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<QuestionKind>("single_choice");
  const [choices, setChoices] = useState<string[]>(["Option 1", "Option 2"]);
  const [dqChoices, setDqChoices] = useState<string[]>([]);
  const [newChoiceText, setNewChoiceText] = useState("");

  const [visibilityRuleGroup, setVisibilityRuleGroup] = useState<VisibilityRuleGroup | undefined>(undefined);

  const [required, setRequired] = useState(true);
  const [includeInQa, setIncludeInQa] = useState(true);
  const [hiddenFromPatient, setHiddenFromPatient] = useState(false);
  const [lockClientChanges, setLockClientChanges] = useState(true);
  const [prefillFromPrevious, setPrefillFromPrevious] = useState(false);
  const [consentText, setConsentText] = useState("");

  useEffect(() => {
    if (activeQuestion) {
      setQuestionText(activeQuestion.text || "");
      setQuestionType(activeQuestion.kind || "text");
      setRequired(activeQuestion.required !== false);
      setIncludeInQa(activeQuestion.includeInQa !== false);
      setHiddenFromPatient(!!activeQuestion.hiddenFromPatient);
      setLockClientChanges(activeQuestion.lockClientChanges !== false);
      setPrefillFromPrevious(!!activeQuestion.prefillFromPrevious);
      setChoices(activeQuestion.choices || []);
      setDqChoices(activeQuestion.dqChoices || []);
      setConsentText(activeQuestion.consentText || "");

      if (activeQuestion.visibilityRuleGroup) {
        setVisibilityRuleGroup(activeQuestion.visibilityRuleGroup);
      } else if (activeQuestion.visibilityRule) {
        setVisibilityRuleGroup({
          mode: "simple",
          rules: [
            {
              questionId: activeQuestion.visibilityRule.questionId,
              operator: "equals",
              value: activeQuestion.visibilityRule.value,
            },
          ],
        });
      } else {
        setVisibilityRuleGroup(undefined);
      }
    } else {
      setQuestionText("");
      setQuestionType("single_choice");
      setChoices(["Option 1", "Option 2"]);
      setDqChoices([]);
      setConsentText("");
      setVisibilityRuleGroup(undefined);
      setRequired(true);
      setIncludeInQa(true);
      setHiddenFromPatient(false);
      setLockClientChanges(true);
      setPrefillFromPrevious(false);
    }
  }, [activeQuestion]);

  const handleAddChoice = () => {
    const label = newChoiceText.trim() || `Option ${choices.length + 1}`;
    setChoices([...choices, label]);
    setNewChoiceText("");
  };

  const handleUpdateChoice = (index: number, value: string) => {
    const previousChoice = choices[index];
    const updatedChoices = choices.map((choice, choiceIndex) => (
      choiceIndex === index ? value : choice
    ));

    setChoices(updatedChoices);
    if (dqChoices.includes(previousChoice)) {
      setDqChoices(dqChoices.map((choice) => (choice === previousChoice ? value : choice)));
    }
  };

  const handleRemoveChoice = (index: number) => {
    const updated = [...choices];
    const removed = updated.splice(index, 1)[0];
    setChoices(updated);
    if (dqChoices.includes(removed)) {
      setDqChoices(dqChoices.filter((c) => c !== removed));
    }
  };

  const handleToggleDqChoice = (choice: string) => {
    if (dqChoices.includes(choice)) {
      setDqChoices(dqChoices.filter((c) => c !== choice));
    } else {
      setDqChoices([...dqChoices, choice]);
    }
  };

  const handleSaveClick = () => {
    const isChoiceType = questionType === "single_choice" || questionType === "multiple_choice";
    const updatedQuestion: ProgramQuestion = {
      id: activeQuestion?.id || `q-new-${Date.now()}`,
      order: activeQuestion?.order || questions.length + 1,
      text: questionText.trim() || "(untitled question)",
      kind: questionType,
      section: activeQuestion?.section || "General Intake",
      required,
      includeInQa,
      hiddenFromPatient,
      lockClientChanges,
      prefillFromPrevious,
      choices: isChoiceType ? choices : undefined,
      dqChoices: isChoiceType ? dqChoices : undefined,
      consentText: questionType === "consent" ? consentText : undefined,
      visibilityRuleGroup: visibilityRuleGroup,
    };
    onSave(updatedQuestion);
    onClose();
  };

  const questionOrder = activeQuestion ? activeQuestion.order : questions.length + 1;
  const isEditMode = !!activeQuestion;

  return (
    <div className="flex flex-col h-full w-full bg-slate-50">
      <QuestionEditorHeader
        title={programName}
        subtitle={`Question ${questionOrder} of ${questions.length || 1} ${isEditMode ? "- Edit" : "- Draft"}`}
        isEditMode={isEditMode}
        activeQuestion={activeQuestion}
        onClose={onClose}
        onSave={handleSaveClick}
        onTestFlow={onTestFlow}
      />
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)_380px]">
        {sidebar}
        <main className="overflow-y-auto p-8 bg-white relative">
          <div className="max-w-2xl mx-auto space-y-10 pb-12">
            <QuestionSetupTab text={questionText} setText={setQuestionText} kind={questionType} setKind={setQuestionType} />
            <div className="h-px bg-slate-100 w-full" />
            <QuestionContentTab
              kind={questionType}
              choices={choices}
              dqChoices={dqChoices}
              newChoiceText={newChoiceText}
              setNewChoiceText={setNewChoiceText}
              handleAddChoice={handleAddChoice}
              handleUpdateChoice={handleUpdateChoice}
              handleRemoveChoice={handleRemoveChoice}
              handleToggleDqChoice={handleToggleDqChoice}
              consentText={consentText}
              setConsentText={setConsentText}
            />
            <div className="h-px bg-slate-100 w-full" />
            <QuestionVisibilityTab
              visibilityRuleGroup={visibilityRuleGroup}
              setVisibilityRuleGroup={setVisibilityRuleGroup}
              questions={questions}
              currentQuestionId={activeQuestion?.id || ""}
            />
            <div className="h-px bg-slate-100 w-full" />
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center h-5 w-5 rounded bg-indigo-100 text-indigo-600">
                  <Activity className="h-3 w-3" />
                </div>
                <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-800">BEHAVIOR</h3>
              </div>
              <div className="space-y-6 pl-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Required question</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Patients can't proceed without answering. Turn off for optional questions.</p>
                  </div>
                  <Switch checked={required} onCheckedChange={setRequired} />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Include in QA section</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Shows in the patient's medical summary and QA review screens for the clinician.</p>
                  </div>
                  <Switch checked={includeInQa} onCheckedChange={setIncludeInQa} />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Hidden from patient</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Internal-only question. Used for system flags or admin-only data. Patients never see it.</p>
                  </div>
                  <Switch checked={hiddenFromPatient} onCheckedChange={setHiddenFromPatient} />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Lock client changes</h4>
                    <p className="text-xs text-slate-500 mt-0.5">When on, client brands can't edit, reorder, or remove this question in their portal — it stays exactly as configured here.</p>
                  </div>
                  <Switch checked={lockClientChanges} onCheckedChange={setLockClientChanges} />
                </div>
              </div>
            </div>
            <div className="h-px bg-slate-100 w-full" />
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center h-5 w-5 rounded bg-orange-100 text-orange-600">
                  <RefreshCcw className="h-3 w-3" />
                </div>
                <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-800">PREFILL</h3>
              </div>
              <div className="space-y-6 pl-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Prefill from previous answers</h4>
                    <p className="text-xs text-slate-500 mt-0.5">If the patient has answered this (or a matching field) in a prior intake, prefill the answer here. They can still edit it.</p>
                  </div>
                  <Switch checked={prefillFromPrevious} onCheckedChange={setPrefillFromPrevious} />
                </div>
              </div>
            </div>
          </div>
        </main>
        <QuestionPreviewTab
          text={questionText}
          kind={questionType}
          choices={choices}
          dqChoices={dqChoices}
          consentText={consentText}
          order={questionOrder}
          totalQuestions={questions.length || 1}
        />
      </div>
    </div>
  );
}
