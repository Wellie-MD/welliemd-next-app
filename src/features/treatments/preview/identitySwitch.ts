import type { QuestionnairePreviewIdentity } from "./constants";

export const isMatchingPreviewIdentityAcknowledgement = ({
  activeRequestId,
  requestId,
  requestedIdentity,
  identity,
  identities,
}: {
  activeRequestId: number | null;
  requestId: number | undefined;
  requestedIdentity: QuestionnairePreviewIdentity;
  identity: string | undefined;
  identities: readonly QuestionnairePreviewIdentity[];
}) => (
  activeRequestId !== null
  && requestId === activeRequestId
  && identity === requestedIdentity
  && identities.includes(identity as QuestionnairePreviewIdentity)
);

export const hasPreviewIdentitySwitchTimedOut = (
  startedAt: number | null,
  now: number,
  timeoutMs: number,
) => (
  startedAt !== null
  && Number.isFinite(startedAt)
  && now - startedAt >= timeoutMs
);
