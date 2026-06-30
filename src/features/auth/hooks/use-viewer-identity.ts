import { useEffect, useMemo, useState } from "react";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import { useAuthStore } from "../store/auth.store";
import type { User } from "../types/auth.types";

type ViewerIdentity = {
  fullName: string;
  initials: string;
  label: string;
};

type PatientProfileIdentity = {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

const asText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const buildInitials = (name: string, email: string, fallback = "P"): string => {
  const parts = name.split(/\s+/).filter(Boolean);
  const firstPart = parts[0] || "";
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1] || "";
    return `${firstPart[0] || ""}${lastPart[0] || ""}`.toUpperCase() || fallback;
  }
  if (firstPart) {
    return firstPart.slice(0, 2).toUpperCase();
  }
  return (email.slice(0, 2) || fallback).toUpperCase();
};

const userFullName = (user: User | null): string => {
  if (!user) return "";
  return `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || "";
};

export const useViewerIdentity = (): ViewerIdentity => {
  const user = useAuthStore((state) => state.user);
  const targetContext = useAuthStore((state) => state.superAdminTargetContext);
  const [patientProfile, setPatientProfile] = useState<PatientProfileIdentity | null>(null);

  useEffect(() => {
    const targetName = asText(targetContext?.patient_name);
    const hasTargetPatient = Boolean(asText(targetContext?.patient_id));

    if (targetName || !hasTargetPatient) {
      setPatientProfile(null);
      return;
    }

    let isMounted = true;

    const loadPatientProfile = async () => {
      try {
        const { data } = await apiClient.get<PatientProfileIdentity>(API_ENDPOINTS.MEDICAL.PATIENTS.MY_PROFILE);
        if (isMounted) {
          setPatientProfile(data);
        }
      } catch {
        if (isMounted) {
          setPatientProfile(null);
        }
      }
    };

    void loadPatientProfile();

    return () => {
      isMounted = false;
    };
  }, [targetContext]);

  return useMemo(() => {
    const targetName = asText(targetContext?.patient_name);
    const targetEmail = asText(targetContext?.patient_email);
    const targetId = asText(targetContext?.patient_id);
    const profileName =
      asText(patientProfile?.full_name) ||
      `${asText(patientProfile?.first_name)} ${asText(patientProfile?.last_name)}`.trim();
    const profileEmail = asText(patientProfile?.email);
    const fallbackName = userFullName(user) || "Patient";
    const fullName = targetName || profileName || targetEmail || profileEmail || fallbackName;
    const email = targetEmail || profileEmail || user?.email || "";
    const label = targetId ? `ID: ${targetId.substring(0, 8)}` : "Patient";

    return {
      fullName,
      initials: buildInitials(fullName, email),
      label,
    };
  }, [patientProfile, targetContext, user]);
};
