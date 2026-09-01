import { ExternalLink, Library } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSectionFields } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { ADMIN_TREATMENT_ROUTES } from "@/features/treatments/navigation/routes";
import type { ProgramQuestion } from "@/features/treatments/types";
import { QuestionEditorHeader } from "../shell/QuestionEditorHeader";
import { QuestionPreviewTab } from "../tabs/QuestionPreviewTab";

interface SectionReferenceEditorProps {
  activeQuestion: ProgramQuestion;
  questions: ProgramQuestion[];
  programName: string;
  sidebar: React.ReactNode;
  onClose: () => void;
  onTestFlow?: () => void;
}

export function SectionReferenceEditor({
  activeQuestion,
  questions,
  programName,
  sidebar,
  onClose,
  onTestFlow,
}: SectionReferenceEditorProps) {
  const sectionId = String(
    activeQuestion.elementConfig?.sourceSectionId
      || activeQuestion.elementConfig?.sourceId
      || "",
  );
  const sectionName = String(
    activeQuestion.elementConfig?.sourceSectionName
      || activeQuestion.text
      || "Common Section",
  );
  const configuredFieldCount = Number(activeQuestion.elementConfig?.fieldCount) || 0;
  const sectionFieldsQuery = useSectionFields(sectionId);
  const sectionFields = sectionFieldsQuery.data || [];
  const fieldCount = configuredFieldCount || sectionFields.length;
  const libraryHref = `${ADMIN_TREATMENT_ROUTES.sections}?sectionId=${encodeURIComponent(sectionId)}&view=list`;

  return (
    <div className="flex h-full w-full flex-col bg-slate-50">
      <QuestionEditorHeader
        title={programName}
        subtitle={`Question ${activeQuestion.order} of ${questions.length || 1} - Library reference`}
        isEditMode
        hideSave
        onClose={onClose}
        onSave={() => undefined}
        onTestFlow={onTestFlow}
      />
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_340px] 2xl:grid-cols-[280px_minmax(0,1fr)_380px]">
        {sidebar}
        <main className="overflow-y-auto bg-white p-6 sm:p-8">
          <div className="mx-auto max-w-2xl pb-12">
            <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm" data-testid="section-library-reference">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <Library className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-slate-950">{sectionName}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Reusable patient data block — collected once and reused across templates. Contains {fieldCount} {fieldCount === 1 ? "field" : "fields"}.
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                This is a library reference — edit it in the Common Sections page.
              </p>
              {sectionId ? (
                <Button asChild className="mt-6" size="sm">
                  <Link to={libraryHref} onClick={onClose}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open library
                  </Link>
                </Button>
              ) : null}
            </section>
          </div>
        </main>
        <QuestionPreviewTab
          text={sectionName}
          kind="section"
          choices={[]}
          dqChoices={[]}
          consentText=""
          order={activeQuestion.order}
          totalQuestions={questions.length || 1}
          sectionFields={sectionFields}
          sectionFieldCount={fieldCount}
          sectionFieldsLoading={sectionFieldsQuery.isLoading}
        />
      </div>
    </div>
  );
}
