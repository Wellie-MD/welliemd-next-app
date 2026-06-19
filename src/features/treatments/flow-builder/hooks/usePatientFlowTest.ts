import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  useCustomProgram,
  usePrograms,
  treatmentQueryKeys,
} from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { treatmentsApi } from "@/features/treatments/api/treatmentsApi";
import { evaluateVisibilityGroup } from "@/features/treatments/utils/visibilityEvaluation";
import { getCheckoutProductPrice } from "@/features/treatments/utils/checkoutPricing";
import type { PreviewContext, Program, ProgramQuestion } from "@/features/treatments/types";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface FlowTestModule {
  id: string;
  name: string;
  questions: ProgramQuestion[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  retry: () => void;
}

export interface FlowTestCheckoutProduct {
  /** Unique per simulator render (moduleId + product id). */
  id: string;
  moduleId: string;
  moduleName: string;
  /** Bold line, e.g. "Tirzepatide — Zepbound 2.5mg". */
  title: string;
  /** Subtle line, e.g. "Standard · Product Options — Compounded Tirzepatide". */
  subtitle: string;
  price: number | null;
}

export interface FlowTestCheckoutGroup {
  moduleId: string;
  moduleName: string;
  products: FlowTestCheckoutProduct[];
}

export interface FlowTestDisqualification {
  moduleId: string;
  moduleName: string;
  questionId: string;
  questionText: string;
  choice: string;
}

export interface FlowTestCheckoutSummary {
  totalModules: number;
  qualifyingModules: number;
  totalProducts: number;
  selectedProductCount: number;
  selectedTreatmentCount: number;
  cartTotal: number;
  warmLeadTreatments: string[];
  disqualifications: FlowTestDisqualification[];
}

// ---------------------------------------------------------------------------
// Disqualification helpers (per-choice "dqChoices" first, flag heuristics next)
// ---------------------------------------------------------------------------

const getDisqualifyingChoices = (question: ProgramQuestion): string[] => {
  if (question.dqChoices?.length) return question.dqChoices;
  if (question.flags?.includes("disqualifying") && question.kind === "single_choice") {
    return question.choices?.includes("Yes") ? ["Yes"] : [];
  }
  if (question.flags?.includes("disqualifying") && question.kind === "yes_no") {
    return ["Yes"];
  }
  return [];
};

const answerHitsDisqualification = (
  question: ProgramQuestion,
  answer: string | string[] | undefined
): boolean => {
  if (!answer) return false;
  const dqChoices = getDisqualifyingChoices(question);
  if (dqChoices.length === 0) return false;
  if (typeof answer === "string") return dqChoices.includes(answer);
  return answer.some((choice) => dqChoices.includes(choice));
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UsePatientFlowTestArgs {
  previewContext: PreviewContext;
  open: boolean;
}

export function usePatientFlowTest({ previewContext, open }: UsePatientFlowTestArgs) {
  // answers keyed by questionId — single_choice/yes_no → string, multiple_choice → string[]
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  // IDs of eligibility modules currently active in the simulator
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);

  // IDs of checkout products the simulated patient has selected (multi-select).
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Whether the current open session has already auto-seeded a module selection
  const [hasSeededSelection, setHasSeededSelection] = useState(false);

  // ── Load the custom program (only relevant for custom_program context) ────
  const { data: customProgram } = useCustomProgram(
    previewContext.type === "custom_program" ? previewContext.id : ""
  );

  // ── Load all programs list ────────────────────────────────────────────────
  const { data: allPrograms = [] } = usePrograms();

  // ── Derive the set of programs available as eligibility modules ───────────
  const availableModules: Program[] = useMemo(() => {
    if (previewContext.type === "custom_program") {
      const flowProgramItems = (customProgram?.flowItems ?? []).filter(
        (item) => item.kind === "program"
      );
      const sourceIds = new Set(
        flowProgramItems.map((item) => item.sourceId).filter(Boolean)
      );
      return allPrograms.filter((p) => sourceIds.has(p.id));
    }
    return allPrograms.filter((p) => p.id === previewContext.id || p.slug === previewContext.id);
  }, [allPrograms, customProgram, previewContext]);

  // ── Reset when modal closes ───────────────────────────────────────────────
  const handleModalOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      setAnswers({});
      setSelectedModuleIds([]);
      setSelectedProductIds([]);
      setHasSeededSelection(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setHasSeededSelection(false);
      return;
    }
    if (selectedModuleIds.length > 0) {
      setHasSeededSelection(true);
      return;
    }
    if (availableModules.length === 0) {
      setSelectedModuleIds([]);
      setSelectedProductIds([]);
      return;
    }
    if (!hasSeededSelection) {
      setSelectedModuleIds([availableModules[0].id]);
      setHasSeededSelection(true);
    }
  }, [availableModules, hasSeededSelection, open, selectedModuleIds.length]);

  // ── Load questions for each selected module (parallel queries) ────────────
  const questionResults = useQueries({
    queries: selectedModuleIds.map((moduleId) => ({
      queryKey: treatmentQueryKeys.programQuestions(moduleId),
      queryFn: () => treatmentsApi.listProgramQuestions(moduleId),
      enabled: open && moduleId.length > 0,
    })),
  });

  // ── Assemble module display objects ──────────────────────────────────────
  const modules: FlowTestModule[] = useMemo(() => {
    return selectedModuleIds.map((moduleId, idx) => {
      const program = availableModules.find((p) => p.id === moduleId);
      const name = program?.name ?? moduleId;
      const result = questionResults[idx];
      return {
        id: moduleId,
        name,
        questions: result?.data ?? [],
        isLoading: result?.isLoading ?? false,
        isError: result?.isError ?? false,
        errorMessage:
          result?.error instanceof Error
            ? result.error.message
            : result?.error
              ? String(result.error)
              : undefined,
        retry: () => {
          void result?.refetch?.();
        },
      };
    });
  }, [availableModules, questionResults, selectedModuleIds]);

  const unselectedModules = useMemo(
    () => availableModules.filter((p) => !selectedModuleIds.includes(p.id)),
    [availableModules, selectedModuleIds]
  );

  // ── Answer handlers ───────────────────────────────────────────────────────
  const handleSingleAnswer = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const handleMultiAnswer = useCallback(
    (questionId: string, choice: string, checked: boolean) => {
      setAnswers((prev) => {
        const existing = (prev[questionId] as string[] | undefined) ?? [];
        const updated = checked
          ? [...existing, choice]
          : existing.filter((c) => c !== choice);
        return { ...prev, [questionId]: updated };
      });
    },
    []
  );

  const resetAnswers = useCallback(() => {
    setAnswers({});
    setSelectedProductIds([]);
  }, []);

  // ── Add / remove module ───────────────────────────────────────────────────
  const addModule = useCallback((moduleId: string) => {
    setSelectedModuleIds((prev) => (prev.includes(moduleId) ? prev : [...prev, moduleId]));
    setHasSeededSelection(true);
  }, []);

  const removeModule = useCallback((moduleId: string) => {
    setSelectedModuleIds((prev) => prev.filter((id) => id !== moduleId));
  }, []);

  // ── Per-module disqualification (any answered question hits a DQ choice) ──
  const disqualifiedModuleIds = useMemo(() => {
    const ids = new Set<string>();
    for (const mod of modules) {
      if (mod.questions.some((q) => answerHitsDisqualification(q, answers[q.id]))) {
        ids.add(mod.id);
      }
    }
    return ids;
  }, [answers, modules]);

  // ── Derive visible checkout products, grouped by treatment ────────────────
  // Faithful to the prototype: any disqualifier in any active module blocks the
  // entire checkout (no products shown), surfacing the disqualification note.
  const checkoutGroups: FlowTestCheckoutGroup[] = useMemo(() => {
    if (disqualifiedModuleIds.size > 0) return [];

    const groups: FlowTestCheckoutGroup[] = [];

    for (const mod of modules) {
      const products: FlowTestCheckoutProduct[] = [];
      const checkoutQuestions = mod.questions.filter((q) => q.kind === "checkout");

      for (const question of checkoutQuestions) {
        // Question-level visibility gates the whole checkout step.
        if (!evaluateVisibilityGroup(question.visibilityRuleGroup, answers)) continue;

        for (const product of question.checkoutProducts ?? []) {
          // Product-level visibility decides which products appear.
          if (!evaluateVisibilityGroup(product.visibilityRules, answers)) continue;

          const title = `${product.category} — ${product.doseLabel}`;
          const subtitle = [product.regimen, question.text].filter(Boolean).join(" · ");
          products.push({
            id: `${mod.id}:${product.id}`,
            moduleId: mod.id,
            moduleName: mod.name,
            title,
            subtitle,
            price: getCheckoutProductPrice(product),
          });
        }
      }

      if (products.length > 0) {
        groups.push({ moduleId: mod.id, moduleName: mod.name, products });
      }
    }

    return groups;
  }, [answers, disqualifiedModuleIds, modules]);

  // Prune selections that are no longer visible.
  useEffect(() => {
    const visibleIds = new Set(
      checkoutGroups.flatMap((group) => group.products.map((product) => product.id))
    );
    setSelectedProductIds((prev) => {
      const next = prev.filter((id) => visibleIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [checkoutGroups]);

  // ── Summary (cart, warm leads, disqualifications) ─────────────────────────
  const checkoutSummary: FlowTestCheckoutSummary = useMemo(() => {
    const selected = new Set(selectedProductIds);

    let totalProducts = 0;
    let selectedProductCount = 0;
    let cartTotal = 0;
    const selectedTreatments = new Set<string>();
    const warmLeadTreatments: string[] = [];

    for (const group of checkoutGroups) {
      totalProducts += group.products.length;
      const groupSelected = group.products.filter((product) => selected.has(product.id));
      if (groupSelected.length > 0) {
        selectedTreatments.add(group.moduleId);
        selectedProductCount += groupSelected.length;
        cartTotal += groupSelected.reduce((sum, product) => sum + (product.price ?? 0), 0);
      } else {
        warmLeadTreatments.push(group.moduleName);
      }
    }

    const disqualifications: FlowTestDisqualification[] = [];
    for (const mod of modules) {
      const hit = mod.questions.find((q) => answerHitsDisqualification(q, answers[q.id]));
      if (!hit) continue;
      const answer = answers[hit.id];
      const choice = typeof answer === "string" ? answer : (answer?.[0] ?? "selected");
      disqualifications.push({
        moduleId: mod.id,
        moduleName: mod.name,
        questionId: hit.id,
        questionText: hit.text,
        choice,
      });
    }

    return {
      totalModules: modules.length,
      qualifyingModules: checkoutGroups.length,
      totalProducts,
      selectedProductCount,
      selectedTreatmentCount: selectedTreatments.size,
      cartTotal,
      warmLeadTreatments,
      disqualifications,
    };
  }, [answers, checkoutGroups, modules, selectedProductIds]);

  // ── Selection handlers ────────────────────────────────────────────────────
  const toggleProduct = useCallback((productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }, []);

  const isProductSelected = useCallback(
    (productId: string) => selectedProductIds.includes(productId),
    [selectedProductIds]
  );

  const selectAllInTreatment = useCallback(
    (moduleId: string) => {
      const group = checkoutGroups.find((g) => g.moduleId === moduleId);
      if (!group) return;
      const groupIds = group.products.map((product) => product.id);
      setSelectedProductIds((prev) => {
        const allSelected = groupIds.every((id) => prev.includes(id));
        if (allSelected) {
          return prev.filter((id) => !groupIds.includes(id));
        }
        const merged = new Set(prev);
        groupIds.forEach((id) => merged.add(id));
        return Array.from(merged);
      });
    },
    [checkoutGroups]
  );

  return {
    modules,
    availableModules,
    unselectedModules,
    selectedModuleIds,
    answers,
    checkoutGroups,
    checkoutSummary,
    selectedProductIds,
    isProductSelected,
    toggleProduct,
    selectAllInTreatment,
    handleSingleAnswer,
    handleMultiAnswer,
    resetAnswers,
    addModule,
    removeModule,
    handleModalOpenChange,
  };
}
