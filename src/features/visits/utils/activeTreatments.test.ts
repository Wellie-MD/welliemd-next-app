import { describe, expect, it } from "vitest";
import type { Visit } from "@/features/visits/services/visit.service";
import {
  getActiveTreatmentVisits,
  getTreatmentStartedAt,
} from "@/features/visits/utils/activeTreatments";

function visit(overrides: Partial<Visit>): Visit {
  return {
    id: "visit-1",
    patient: "patient-1",
    patient_name: "Test Patient",
    visit_type: "weightloss",
    status: "sent_to_beluga",
    master_id: "kinmeds-00001",
    order_status: "shipped",
    order_type: null,
    episode_id: "episode-1",
    treatment_key: "weight-loss",
    episode_started_at: "2026-05-28T20:35:44Z",
    checkout_url: null,
    consents_signed: true,
    beluga_visit_id: "beluga-1",
    submitted_at: "2026-05-28T20:35:44Z",
    created_at: "2026-05-28T20:35:44Z",
    updated_at: "2026-05-28T20:35:44Z",
    assigned_template: null,
    ...overrides,
  };
}

describe("active treatment helpers", () => {
  it("collapses follow-up and onboarding visits linked to the same episode", () => {
    const original = visit({
      id: "original",
      visit_type: "weightloss",
      order_status: "shipped",
      created_at: "2026-05-28T20:35:44Z",
    });
    const followUp = visit({
      id: "follow-up",
      visit_type: "weightlossfollowup",
      order_status: "prescribed",
      created_at: "2026-07-04T11:40:25Z",
    });

    const activeTreatments = getActiveTreatmentVisits([original, followUp]);
    const activeTreatment = activeTreatments[0];

    expect(activeTreatments).toHaveLength(1);
    expect(activeTreatment).toBeDefined();
    expect(activeTreatment?.id).toBe("follow-up");
    expect(activeTreatment ? getTreatmentStartedAt(activeTreatment) : null).toBe(
      "2026-05-28T20:35:44Z"
    );
  });

  it("keeps separate treatment episodes separate", () => {
    const weightLoss = visit({ id: "weight-loss", episode_id: "episode-1" });
    const ed = visit({
      id: "ed",
      episode_id: "episode-2",
      treatment_key: "ed",
      visit_type: "ed",
    });

    expect(getActiveTreatmentVisits([weightLoss, ed])).toHaveLength(2);
  });

  it("does not include unpaid visits as active treatments", () => {
    const draft = visit({
      id: "draft",
      order_status: "payment_pending",
    });

    expect(getActiveTreatmentVisits([draft])).toHaveLength(0);
  });
});
