import type { QuestionnairePreviewIdentity } from "./constants";

export const isMatchingPreviewIdentityAcknowledgement = ({
  activeRequestId,
  requestId,
  identity,
  identities,
}: {
  activeRequestId: number | null;
  requestId: number | undefined;
  identity: string | undefined;
  identities: readonly QuestionnairePreviewIdentity[];
}) => (
  activeRequestId !== null
  && requestId === activeRequestId
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
