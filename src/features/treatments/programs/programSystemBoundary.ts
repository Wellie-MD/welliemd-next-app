import type { Program, ProgramQuestion } from "../types";
import {
  PROGRAM_AUTHORING_COPY,
  PROGRAM_QUESTION_KIND_ORDER,
  PROGRAM_SYSTEM_NODE_KIND,
  programAuthenticationId,
} from "./programAuthoringConstants";

/**
 * Pure rules for the Patient Authentication boundary.
 *
 * Keeping these out of the components means the builder, the flow graph, and
 * the save/reorder payloads all derive the boundary the same way, and the
 * invariants can be asserted without rendering React.
 */

/** The only non-persisted authentication node projected by the Program builder. */
export const SYSTEM_BOUNDARY_KINDS: ReadonlySet<string> = new Set([
  PROGRAM_SYSTEM_NODE_KIND,
]);

export function isSystemBoundary(question: ProgramQuestion): boolean {
  return SYSTEM_BOUNDARY_KINDS.has(question.kind);
}

/**
 * Has the author added the Patient Authentication element?
 *
 * A new Program starts completely empty — nothing is pre-populated — so this is
 * an explicit authoring act, recorded as `authConfig.enabled` on the Program
 * record rather than as a ProgramQuestion. It remains mandatory to publish; the
 * backend rejects a release without it.
 */
export function hasPatientAuthentication(program?: {
  authConfig?: Program["authConfig"];
}): boolean {
  return Boolean(
    (program?.authConfig as { enabled?: boolean } | undefined)?.enabled
  );
}

/** The projected, non-persisted Patient Authentication node for a Program. */
export function patientAuthenticationNode(program: {
  id: string;
  authConfig?: Program["authConfig"];
}): ProgramQuestion {
  return {
    id: programAuthenticationId(program.id),
    order: 0,
    text: PROGRAM_AUTHORING_COPY.authTitle,
    kind: PROGRAM_SYSTEM_NODE_KIND,
    section: "Authentication",
    required: true,
    elementConfig: {
      system: true,
      locked: true,
      description: PROGRAM_AUTHORING_COPY.authDescription,
      authConfig: program.authConfig || {},
    },
  };
}

/**
 * Project the builder's ordered element list.
 *
 * An empty Program projects an empty list — nothing is created automatically.
 * Once the author has added Patient Authentication it is pinned to position 1,
 * because the runtime binds identity before clinical screening; a boundary sat
 * after clinical questions would not match what actually runs.
 *
 * Invalid authored records remain visible so an operator can remove them after
 * the backend returns a publication validation error.
 */
export function projectAuthoredFlow(
  program: { id: string; authConfig?: Program["authConfig"] },
  authoredQuestions: ProgramQuestion[]
): ProgramQuestion[] {
  const authored = authoredQuestions.filter(
    (question) => question.kind !== PROGRAM_SYSTEM_NODE_KIND
  );
  const stateRouting = authored.filter((question) => question.kind === "state_routing");
  const shippingAddress = authored.filter((question) => question.kind === "shipping_address");
  const screening = authored.filter(
    (question) => question.kind !== "state_routing" && question.kind !== "shipping_address",
  );
  const elements = hasPatientAuthentication(program)
    ? [patientAuthenticationNode(program), ...stateRouting, ...screening, ...shippingAddress]
    : [...stateRouting, ...screening, ...shippingAddress];
  return elements.map((question, index) => ({
    ...question,
    order: index + 1,
  }));
}

/**
 * The IDs a reorder/save request may contain: persisted authored questions
 * only. Sending the synthetic auth ID would fail server-side.
 */
export function persistableQuestionIds(
  questions: ProgramQuestion[]
): string[] {
  return questions
    .filter(
      (question) => question.kind !== "checkout" && !isSystemBoundary(question)
    )
    .map((question) => question.id);
}

/**
 * Whether a builder row may be dragged or reordered.
 *
 * Patient Authentication is pinned to position 1: the runtime binds identity
 * before clinical screening, so a boundary placed later would not match what
 * actually runs.
 */
export function isDraggableElement(question: ProgramQuestion): boolean {
  return !isSystemBoundary(question)
    && question.kind !== "state_routing"
    && question.kind !== "shipping_address";
}

/**
 * Whether a builder row may be removed.
 *
 * The author added Patient Authentication, so they can remove it. Publication
 * still requires it — the backend rejects a release without one — so removing it
 * blocks publish rather than silently shipping an intake that cannot identify
 * the patient.
 */
export function isDeletableElement(_question: ProgramQuestion): boolean {
  return true;
}

/** Whether a row opens the generic question editor rather than a system modal. */
export function isEditableAsQuestion(question: ProgramQuestion): boolean {
  return !isSystemBoundary(question);
}

/** Question kinds an author may choose for a Program. */
export function authorableProgramKinds(): readonly string[] {
  return PROGRAM_QUESTION_KIND_ORDER;
}
