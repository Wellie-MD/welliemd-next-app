import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Program, ProgramQuestion } from "@/features/treatments/types";
import { SharedQuestionsList } from "@/features/treatments/common/components/SharedQuestionsList";
import { useConsents } from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { QuestionnairePreviewDialog } from "@/features/treatments/preview/components/QuestionnairePreviewDialog";
import { ProgramLabsSection } from "./ProgramLabsSection";
import {
  PROGRAM_AUTHORING_COPY,
  programAuthenticationId,
} from "@/features/treatments/programs/programAuthoringConstants";

interface ProgramQuestionsListProps {
  program: Program;
  initialQuestions: ProgramQuestion[];
}

export function ProgramQuestionsList({ program, initialQuestions }: ProgramQuestionsListProps) {
  const navigate = useNavigate();
  const { data: allConsents = [] } = useConsents();
  const displayQuestions = useMemo(
    () => {
      const authoredQuestions = initialQuestions.filter((question) => question.kind !== "checkout");
      const hasAuthentication = authoredQuestions.some((question) => question.kind === "personal_details");
      const authentication: ProgramQuestion[] = hasAuthentication ? [] : [{
        id: programAuthenticationId(program.id),
        order: 0,
        text: PROGRAM_AUTHORING_COPY.authTitle,
        kind: "personal_details",
        section: "Authentication",
        required: true,
        elementConfig: {
          system: true,
          locked: true,
          description: PROGRAM_AUTHORING_COPY.authDescription,
          authConfig: program.authConfig || {},
        },
      }];
      const flowQuestions = [...authentication, ...authoredQuestions]
        .sort((left, right) => left.order - right.order)
        .map((question, index) => ({ ...question, order: index + 1 }));
      const checkoutQuestions = (program.checkoutQuestions || []).map((checkout, index): ProgramQuestion => ({
        id: checkout.id,
        order: flowQuestions.length + index + 1,
        text: checkout.text,
        kind: "checkout",
        section: PROGRAM_AUTHORING_COPY.checkoutSection,
        required: true,
        checkoutProductIds: checkout.products
          .map((product) => product.productId)
          .filter((productId): productId is string => Boolean(productId)),
        checkoutProducts: checkout.products,
        visibilityRuleGroup: checkout.visibilityRules,
        elementConfig: {
          checkoutProducts: checkout.products,
          checkoutProductIds: checkout.products
            .map((product) => product.productId)
            .filter((productId): productId is string => Boolean(productId)),
          visibilityRuleGroup: checkout.visibilityRules,
        },
      }));
      return [...flowQuestions, ...checkoutQuestions];
    },
    [initialQuestions, program]
  );

  const handleBack = () => {
    navigate("/dashboard/treatments/programs");
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
      />
      {viewMode === "list" && <ProgramLabsSection program={program} />}

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
