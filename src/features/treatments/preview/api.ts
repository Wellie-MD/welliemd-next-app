import axiosInstance from "@/api/axiosInstance";
import type { PreviewContext } from "@/features/treatments/types";
import { QUESTIONNAIRE_PREVIEW_API } from "./constants";

export interface PreviewCapability {
  capabilityToken: string;
  snapshotId: string;
  snapshotKind: string;
  snapshotVersion: number;
  snapshotChecksum: string;
  expiresAt: string;
}

interface PreviewCapabilityResponse {
  capability_token: string;
  source_snapshot_id: string;
  source_release_kind: string;
  source_release_version: number;
  snapshot_checksum: string;
  expires_at: string;
}

export async function issuePreviewCapability(
  context: PreviewContext,
): Promise<PreviewCapability> {
  if (context.type === "section") {
    throw new Error("Standalone sections do not use the patient questionnaire.");
  }
  const { data } = await axiosInstance.post<PreviewCapabilityResponse>(
    QUESTIONNAIRE_PREVIEW_API.issueCapability,
    { source_kind: context.type, source_id: context.id },
  );
  return {
    capabilityToken: data.capability_token,
    snapshotId: data.source_snapshot_id,
    snapshotKind: data.source_release_kind,
    snapshotVersion: data.source_release_version,
    snapshotChecksum: data.snapshot_checksum,
    expiresAt: data.expires_at,
  };
}
