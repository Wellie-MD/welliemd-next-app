import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Program, ProgramQuestion } from "@/features/treatments/types";
import { SharedQuestionsList } from "@/features/treatments/common/components/SharedQuestionsList";
import { useConsents, useSaveProgramQuestions } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { QuestionnairePreviewDialog } from "@/features/treatments/preview/components/QuestionnairePreviewDialog";
import { PROGRAM_AUTHORING_COPY } from "@/features/treatments/programs/programAuthoringConstants";
import { projectAuthoredFlow } from "@/features/treatments/programs/programSystemBoundary";
import { isCheckoutQuestionRequired } from "@/features/treatments/programs/checkout-question/constants";
import { formatCheckoutQuestionText } from "@/features/treatments/programs/checkout-question/utils/checkoutTitleUtils";
import type { ProgramEffectiveContent } from "@/features/treatments/api/programsApi";
import { projectEffectiveProgramFlow } from "@/features/treatments/programs/programEffectiveFlow";

interface ProgramQuestionsListProps {
  program: Program;
  initialQuestions: ProgramQuestion[];
  effectiveContent?: ProgramEffectiveContent;
}

export function ProgramQuestionsList({ program, initialQuestions, effectiveContent }: ProgramQuestionsListProps) {
  const navigate = useNavigate();
  const saveQuestions = useSaveProgramQuestions(program.id);
  const { data: allConsents = [] } = useConsents();
  const displayQuestions = useMemo(
    () => {
      const authoredQuestions = initialQuestions
        .filter((question) => question.kind !== "checkout")
        .sort((left, right) => left.order - right.order);
      // A new Program is empty; Patient Authentication appears only once the
      // author adds it from the Add Element menu, and is then pinned first.
      const flowQuestions = projectAuthoredFlow(program, authoredQuestions);
      const labCheckoutQuestions: ProgramQuestion[] = (program.labRequirements || []).length > 0
        ? [{
            id: `lab-checkout:${program.id}`,
            order: flowQuestions.length + 1,
            text: "Order Your Labs",
            kind: "checkout",
            section: PROGRAM_AUTHORING_COPY.checkoutSection,
            required: true,
            checkoutProducts: [],
            checkoutProductIds: [],
            elementConfig: {
              labCheckout: true,
              checkoutMode: "lab",
              labRequirements: program.labRequirements,
            },
          }]
        : [];
      const checkoutQuestions = (program.checkoutQuestions || []).map((checkout, index): ProgramQuestion => ({
        id: checkout.id,
        order: flowQuestions.length + index + 1,
        text: formatCheckoutQuestionText(checkout.products, checkout.text),
        kind: "checkout",
        section: PROGRAM_AUTHORING_COPY.checkoutSection,
        required: Boolean(checkout.required)
          || isCheckoutQuestionRequired(checkout.products, checkout.minSelections),
        checkoutProductIds: checkout.products
          .map((product) => product.productId)
          .filter((productId): productId is string => Boolean(productId)),
        checkoutProducts: checkout.products,
        checkoutSelectionMode: checkout.selectionMode,
        checkoutMinSelections: checkout.minSelections,
        checkoutMaxSelections: checkout.maxSelections,
        visibilityRuleGroup: checkout.visibilityRules,
        elementConfig: {
          checkoutProducts: checkout.products,
          checkoutProductIds: checkout.products
            .map((product) => product.productId)
            .filter((productId): productId is string => Boolean(productId)),
          visibilityRuleGroup: checkout.visibilityRules,
        },
      }));
      return projectEffectiveProgramFlow(
        [...flowQuestions, ...labCheckoutQuestions, ...checkoutQuestions],
        effectiveContent,
      );
    },
    [effectiveContent, initialQuestions, program]
  );

  const handleBack = () => {
    navigate("/dashboard/treatments/programs");
  };

  const detachSection = async (sectionId: string) => {
    const remaining = initialQuestions.filter((question) => {
      if (question.kind !== "section") return true;
      const source = question.elementConfig?.sourceSectionId || question.elementConfig?.sourceId;
      return String(source || "") !== sectionId;
    });
    if (remaining.length === initialQuestions.length) {
      throw new Error("The Program-specific Section attachment was not found. Refresh the page and try again.");
    }
    await saveQuestions.mutateAsync(remaining);
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get("view") === "flow" ? "flow" : "list";
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);

  const setViewMode = (mode: "list" | "flow") => {
    setSearchParams({ view: mode }, { replace: true });
  };

  const headerExtraActions = (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => setIsSimulateOpen(true)}
        variant="ghost"
        className="h-9 rounded-md px-3 text-[11px] font-medium text-slate-700 shadow-none hover:bg-slate-100"
      >
        <Eye className="h-4 w-4 mr-2" />
        Preview
      </Button>
      {viewMode === "list" && (
        <Button
          onClick={() => setViewMode("flow")}
          variant="ghost"
          className="h-9 rounded-md px-3 text-[11px] font-medium text-slate-700 shadow-none hover:bg-slate-100"
        >
          <Grid3X3 className="h-4 w-4 mr-2" />
          Flow Builder
        </Button>
      )}
      {viewMode === "flow" && (
        <Button
          onClick={() => setViewMode("list")}
          variant="ghost"
          className="h-9 rounded-md px-3 text-[11px] font-medium text-slate-700 shadow-none hover:bg-slate-100"
        >
          <List className="h-4 w-4 mr-2" />
          Questions
        </Button>
      )}
    </div>
  );

  return (
    <>
      <SharedQuestionsList
        entityId={program.id}
        entityName={program.name}
        entityType="program"
        program={program}
        initialQuestions={displayQuestions}
        headerTitle={program.name}
        headerSubtitle={PROGRAM_AUTHORING_COPY.subtitle}
        onBack={handleBack}
        headerExtraActions={headerExtraActions}
        authConfig={program.authConfig}
        viewMode={viewMode as "list" | "flow"}
        onViewModeChange={setViewMode}
        onOpenPreview={() => setIsSimulateOpen(true)}
        allConsents={allConsents}
        onDetachSection={detachSection}
      />
      <QuestionnairePreviewDialog
        open={isSimulateOpen}
        onOpenChange={setIsSimulateOpen}
        previewContext={{
          type: "program",
          id: program.id,
          slug: program.slug,
          visitType: program.visitType,
          templateId: program.sourceQuestionnaireTemplateId,
        }}
        subtitle={`Patient view of "${program.name}"`}
      />
    </>
  );
}
