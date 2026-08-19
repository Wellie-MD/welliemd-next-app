import { useState, useEffect, useMemo, useCallback } from "react";
import { QuestionEditorHeader } from "@/features/treatments/question-editor/components/shell/QuestionEditorHeader";
import { QuestionSetupTab } from "@/features/treatments/question-editor/components/tabs/QuestionSetupTab";
import { QuestionContentTab } from "@/features/treatments/question-editor/components/tabs/QuestionContentTab";
import { QuestionVisibilityTab } from "@/features/treatments/question-editor/components/tabs/QuestionVisibilityTab";
import { QuestionPreviewTab } from "@/features/treatments/question-editor/components/tabs/QuestionPreviewTab";
import { Switch } from "@/components/ui/switch";
import { Activity, RefreshCcw } from "lucide-react";
import type { ProgramQuestion, QuestionKind, VisibilityRuleGroup } from "@/features/treatments/types";
import { toBuilderGroup } from "@/features/treatments/utils/visibilityBuilderAdapters";
import {
  validateVisibilityGroup,
  type VisibilityValidationIssue,
} from "@/components/questionnaires/visibilityRuleValidation";

interface StandardEditorProps {
  activeQuestion?: ProgramQuestion;
  questions: ProgramQuestion[];
  programName?: string;
  sidebar: React.ReactNode;
  onSave: (question: ProgramQuestion) => Promise<void>;
  onClose: () => void;
  onTestFlow?: () => void;
}

const SUPPORTED_UPLOAD_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];

const focusVisibilityIssue = (issue: VisibilityValidationIssue) => {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const path = issue.path.join(".");
      const selector = issue.field === "group"
        ? `[data-visibility-group-path="${path}"]`
        : `[data-visibility-condition-path="${path}"]`;
      const issueContainer = document.querySelector<HTMLElement>(selector);
      const focusTarget = issue.field === "group"
        ? issueContainer?.querySelector<HTMLElement>("button")
        : issueContainer?.querySelector<HTMLElement>(`[data-visibility-field="${issue.field}"]`);

      issueContainer?.scrollIntoView({ behavior: "smooth", block: "center" });
      focusTarget?.focus({ preventScroll: true });
    });
  });
};

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
  const [uploadConfig, setUploadConfig] = useState({
    upload_type: "general",
    max_file_size_mb: 5,
    allowed_extensions: SUPPORTED_UPLOAD_EXTENSIONS,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [visibilityValidationAttempted, setVisibilityValidationAttempted] = useState(false);

  const visibilityValidationIssues = useMemo(
    () => visibilityRuleGroup
      ? validateVisibilityGroup(toBuilderGroup(visibilityRuleGroup))
      : [],
    [visibilityRuleGroup],
  );

  const resetForm = useCallback(() => {
    setQuestionText("");
    setQuestionType("single_choice");
    setChoices(["Option 1", "Option 2"]);
    setDqChoices([]);
    setNewChoiceText("");
    setVisibilityRuleGroup(undefined);
    setRequired(true);
    setIncludeInQa(true);
    setHiddenFromPatient(false);
    setLockClientChanges(true);
    setPrefillFromPrevious(false);
    setConsentText("");
    setUploadConfig({ upload_type: "general", max_file_size_mb: 5, allowed_extensions: SUPPORTED_UPLOAD_EXTENSIONS });
  }, []);

  useEffect(() => {
    setVisibilityValidationAttempted(false);
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
      const configuredUpload = (
        activeQuestion.elementConfig?.uploadConfig
        || activeQuestion.elementConfig?.upload_config
      );
      if (configuredUpload && typeof configuredUpload === "object") {
        const config = configuredUpload as Record<string, unknown>;
        const configuredExtensions = Array.isArray(config.allowed_extensions)
          ? config.allowed_extensions
            .map(String)
            .filter((extension) => SUPPORTED_UPLOAD_EXTENSIONS.includes(extension))
          : [];
        setUploadConfig({
          upload_type: String(config.upload_type || "general"),
          max_file_size_mb: Number(config.max_file_size_mb || 5),
          allowed_extensions: configuredExtensions.length
            ? configuredExtensions
            : SUPPORTED_UPLOAD_EXTENSIONS,
        });
      } else {
        setUploadConfig({ upload_type: "general", max_file_size_mb: 5, allowed_extensions: SUPPORTED_UPLOAD_EXTENSIONS });
      }

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
      resetForm();
    }
  }, [activeQuestion, resetForm]);

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

  const handleSaveClick = async () => {
    if (visibilityValidationIssues.length > 0) {
      setVisibilityValidationAttempted(true);
      focusVisibilityIssue(visibilityValidationIssues[0]);
      return;
    }
    setVisibilityValidationAttempted(false);

    const isChoiceType = questionType === "single_choice" || questionType === "multiple_choice";
    const updatedQuestion: ProgramQuestion = {
      // Preserve fields this editor doesn't surface (e.g. a Section's
      // elementConfig.sourceSectionId/fieldCount) — without this spread,
      // saving here silently dropped them and corrupted the row's identity.
      ...activeQuestion,
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
      elementConfig: {
        ...(activeQuestion?.elementConfig || {}),
        ...(questionType === "file_upload" ? { uploadConfig } : {}),
      },
      visibilityRuleGroup: visibilityRuleGroup,
    };
    setIsSaving(true);
    try {
      await onSave(updatedQuestion);
      if (!activeQuestion) {
        // New questions keep the dialog open for rapid authoring. Clear the
        // inserted values before starting the next draft.
        resetForm();
      }
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1200);
      // Stay open — the caller has already toasted on failure, and on
      // success the admin can keep iterating without reopening the modal.
    } catch {
      // Error toast already surfaced by the caller; keep the editor open.
    } finally {
      setIsSaving(false);
    }
  };

  const questionOrder = activeQuestion ? activeQuestion.order : questions.length + 1;
  const isEditMode = !!activeQuestion;

  return (
    <div className="flex flex-col h-full w-full bg-slate-50">
      <QuestionEditorHeader
        title={programName}
        subtitle={`Question ${questionOrder} of ${questions.length || 1} ${isEditMode ? "- Edit" : "- Draft"}`}
        isEditMode={isEditMode}
        isSaving={isSaving}
        justSaved={justSaved}
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
              uploadConfig={uploadConfig}
              setUploadConfig={setUploadConfig}
            />
            <div className="h-px bg-slate-100 w-full" />
            <QuestionVisibilityTab
              visibilityRuleGroup={visibilityRuleGroup}
              setVisibilityRuleGroup={setVisibilityRuleGroup}
              questions={questions}
              currentQuestionId={activeQuestion?.id || ""}
              validationIssues={visibilityValidationAttempted ? visibilityValidationIssues : []}
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
