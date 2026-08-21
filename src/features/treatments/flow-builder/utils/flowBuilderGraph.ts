import type { CustomProgramFlowItem } from "@/features/treatments/types";

export interface FlowCanvasSystemItem {
  id: string;
  kind: string;
  title: string;
  subtitle?: string;
  isSystem?: boolean;
  isStart?: boolean;
  isEnd?: boolean;
  /** Derived runtime presentation, never authored configuration. */
  isDerived?: boolean;
}

export interface TreatmentTrack {
  treatmentName: string;
  visitTypes: string[];
  items: CustomProgramFlowItem[];
}

interface BuildFlowGraphArgs {
  flowItems: CustomProgramFlowItem[];
  getConsentScope: (name: string) => string;
  getConsentVisitTypeKeys: (name: string) => string[];
}

export function buildFlowGraph({ flowItems, getConsentScope, getConsentVisitTypeKeys }: BuildFlowGraphArgs) {
  const routingItems = flowItems.filter((item) => item.kind === "routing_question");
  const sectionItems = flowItems.filter(
    (item) => item.kind === "section" || item.kind === "section_field",
  );
  const programItems = flowItems.filter((item) => item.kind === "program");
  const consentItems = flowItems.filter((item) => item.kind === "consent");
  const universalConsents = consentItems.filter((item) => getConsentScope(item.title) !== "visit_type");
  const treatmentSpecificConsents = consentItems.filter((item) => getConsentScope(item.title) === "visit_type");

  const tracks: TreatmentTrack[] = programItems.map((program) => {
    const visitTypes = program.visitType ? [program.visitType] : [];
    const trackConsents = treatmentSpecificConsents.filter((consent) =>
      getConsentVisitTypeKeys(consent.title).some((visitTypeKey) => visitTypeKey === program.visitType)
    );

    return {
      treatmentName: program.title.replace(/ Intake$/, ""),
      visitTypes,
      items: [program, ...trackConsents],
    };
  });

  const preFan: FlowCanvasSystemItem[] = [
    { id: "sys-start", kind: "start", title: "Start", subtitle: "Patient enters", isStart: true },
    { id: "sys-auth", kind: "authentication", title: "Patient Authentication", subtitle: "Email first, then sign in or register", isSystem: true },
    ...routingItems,
    // Derived runtime boundary, not authored configuration. Matching is owned
    // per Program inclusion (CustomProgramProgram.matching_rule) and edited
    // from its own Stage 2 row, so this node is a passive summary only.
    { id: "sys-matched", kind: "matched_summary", title: "Matched Programs", subtitle: "Derived at runtime from each Program's matching rule", isSystem: true, isDerived: true },
    ...sectionItems,
  ];

  const postFan: FlowCanvasSystemItem[] = [
    ...universalConsents,
    { id: "sys-recommended", kind: "recommended_products", title: "Recommended Products", subtitle: "Auto - per treatment", isSystem: true },
    { id: "sys-checkout", kind: "checkout", title: "Checkout", subtitle: "Locked", isEnd: true },
  ];

  return { tracks, preFan, postFan };
}
