import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import axiosInstance from "@/api/axiosInstance";

export type Phase2Milestone = "milestone_1" | "milestone_2" | "milestone_3";

export interface Phase2Snapshot {
  milestones: Record<Phase2Milestone, boolean>;
  capabilities: {
    junction_labs: boolean;
    m3_junction_labs: boolean;
    product_selection: boolean;
    product_reimbursement: boolean;
  };
  rollout_order: Phase2Milestone[];
}
const FAIL_CLOSED_SNAPSHOT: Phase2Snapshot = {
  milestones: {
    milestone_1: false,
    milestone_2: false,
    milestone_3: false,
  },
  capabilities: {
    junction_labs: false,
    m3_junction_labs: false,
    product_selection: false,
    product_reimbursement: false,
  },
  rollout_order: ["milestone_3", "milestone_1", "milestone_2"],
};

interface Phase2FlagsContextValue {
  snapshot: Phase2Snapshot;
  isLoading: boolean;
  isEnabled: (milestone: Phase2Milestone) => boolean;
}

const Phase2FlagsContext = createContext<Phase2FlagsContextValue | undefined>(
  undefined
);

function normalizeSnapshot(value: Partial<Phase2Snapshot> | undefined): Phase2Snapshot {
  return {
    milestones: {
      milestone_1: value?.milestones?.milestone_1 === true,
      milestone_2: value?.milestones?.milestone_2 === true,
      milestone_3: value?.milestones?.milestone_3 === true,
    },
    capabilities: {
      junction_labs: value?.capabilities?.junction_labs === true,
      m3_junction_labs: value?.capabilities?.m3_junction_labs === true,
      product_selection: value?.capabilities?.product_selection === true,
      product_reimbursement: value?.capabilities?.product_reimbursement === true,
    },
    rollout_order: ["milestone_3", "milestone_1", "milestone_2"],
  };
}

export function Phase2FlagsProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Phase2Snapshot>(FAIL_CLOSED_SNAPSHOT);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    axiosInstance
      .get<Phase2Snapshot>("/core/phase2-feature-flags/")
      .then(({ data }) => {
        if (active) setSnapshot(normalizeSnapshot(data));
      })
      .catch(() => {
        if (active) setSnapshot(FAIL_CLOSED_SNAPSHOT);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const isEnabled = useCallback(
    (milestone: Phase2Milestone) => snapshot.milestones[milestone],
    [snapshot]
  );
  const value = useMemo(
    () => ({ snapshot, isLoading, isEnabled }),
    [snapshot, isLoading, isEnabled]
  );

  return (
    <Phase2FlagsContext.Provider value={value}>
      {children}
    </Phase2FlagsContext.Provider>
  );
}

export function usePhase2Flags(): Phase2FlagsContextValue {
  const context = useContext(Phase2FlagsContext);
  if (!context) {
    throw new Error("usePhase2Flags must be used within Phase2FlagsProvider");
  }
  return context;
}

export function Phase2Gate({
  milestone,
  children,
  fallback = null,
}: {
  milestone: Phase2Milestone;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isLoading, isEnabled } = usePhase2Flags();
  if (isLoading) return null;
  return isEnabled(milestone) ? <>{children}</> : <>{fallback}</>;
}
