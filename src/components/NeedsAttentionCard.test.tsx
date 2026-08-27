import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import NeedsAttentionCard from "./NeedsAttentionCard";
import { getOrdersByStatus } from "@/shared/api/ordersApi";
import { getPatientCheckoutRecovery } from "@/shared/api/checkoutRecoveryApi";
import { getPatientFollowUps } from "@/features/followups/api";
import { getStandaloneLabSubmissions } from "@/features/labs/api/index";

vi.mock("@/shared/api/ordersApi", () => ({ getOrdersByStatus: vi.fn() }));
vi.mock("@/shared/api/checkoutRecoveryApi", () => ({ getPatientCheckoutRecovery: vi.fn() }));
vi.mock("@/features/followups/api", () => ({ getPatientFollowUps: vi.fn() }));
vi.mock("@/features/labs/api/index", () => ({ getStandaloneLabSubmissions: vi.fn() }));

describe("R6 patient checkout recovery", () => {
  beforeEach(() => {
    vi.mocked(getPatientFollowUps).mockResolvedValue([]);
    vi.mocked(getStandaloneLabSubmissions).mockResolvedValue([]);
    vi.mocked(getOrdersByStatus).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [{
        id: "order-1",
        display_id: "ORD-1",
        status: "payment_pending",
        status_display: "Payment pending",
        product_name: "Treatment",
        pharmacy_name: null,
        tracking_number: null,
        tracking_url: null,
        amount: "125.00",
        checkout_url: "https://checkout.example.test/retry",
        created_at: "2026-08-27T09:00:00Z",
        prescribed_at: null,
        shipped_at: null,
        updated_at: "2026-08-27T09:00:00Z",
      }],
    });
  });

  it("warns the patient and suppresses direct payment while the result is uncertain", async () => {
    vi.mocked(getPatientCheckoutRecovery).mockResolvedValue([{
      submission_id: "submission-1",
      checkout_state: "reconciliation_required",
      needs_attention: true,
      message: "We are confirming your payment. Please do not submit another payment unless support asks you to.",
      support_reference: "RCV-ABC123",
      updated_at: "2026-08-27T10:00:00Z",
    }]);

    render(<MemoryRouter><NeedsAttentionCard /></MemoryRouter>);

    expect(await screen.findByText("We are confirming your payment")).toBeInTheDocument();
    expect(screen.getByText(/RCV-ABC123/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pay Now" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "View Orders" })).not.toHaveLength(0);
  });
});
