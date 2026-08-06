import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import NeedsAttentionCard from "./NeedsAttentionCard";
import * as ordersApi from "@/shared/api/ordersApi";
import * as followUpsApi from "@/features/followups/api";
import * as labsApi from "@/features/labs/api/index";

vi.mock("@/shared/api/ordersApi");
vi.mock("@/features/followups/api");
vi.mock("@/features/labs/api/index");

const renderCard = () =>
  render(
    <MemoryRouter>
      <NeedsAttentionCard />
    </MemoryRouter>,
  );

describe("NeedsAttentionCard", () => {
  it("renders nothing while nothing needs attention", async () => {
    vi.mocked(ordersApi.getOrdersByStatus).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
    vi.mocked(ordersApi.getCheckoutRecoveryCases).mockResolvedValue([]);
    vi.mocked(followUpsApi.getPatientFollowUps).mockResolvedValue([]);
    vi.mocked(labsApi.getStandaloneLabSubmissions).mockResolvedValue([]);

    const { container } = renderCard();

    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it("shows a checkout-under-reconciliation notice with no pay affordance", async () => {
    vi.mocked(ordersApi.getOrdersByStatus).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
    vi.mocked(ordersApi.getCheckoutRecoveryCases).mockResolvedValue([
      {
        reference: "RCV-ABC123",
        status: "open",
        checkout_state: "reconciliation_required",
        created_at: new Date().toISOString(),
      },
    ]);
    vi.mocked(followUpsApi.getPatientFollowUps).mockResolvedValue([]);
    vi.mocked(labsApi.getStandaloneLabSubmissions).mockResolvedValue([]);

    renderCard();

    expect(
      await screen.findByText(/checkout being reconciled/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/RCV-ABC123/)).toBeInTheDocument();
    expect(screen.getByText(/do not pay again/i)).toBeInTheDocument();
    // The single most important property: nothing here can trigger a
    // second payment while the outcome is unresolved.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("still offers Pay Now for an ordinary payment_pending order alongside a recovery notice", async () => {
    vi.mocked(ordersApi.getOrdersByStatus).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: "order-1",
          amount: "99.00",
          product_name: "Weight Care",
          checkout_url: "https://example.test/checkout/abc",
        } as never,
      ],
    });
    vi.mocked(ordersApi.getCheckoutRecoveryCases).mockResolvedValue([
      {
        reference: "RCV-XYZ789",
        status: "open",
        checkout_state: "failed_compensating",
        created_at: new Date().toISOString(),
      },
    ]);
    vi.mocked(followUpsApi.getPatientFollowUps).mockResolvedValue([]);
    vi.mocked(labsApi.getStandaloneLabSubmissions).mockResolvedValue([]);

    renderCard();

    expect(await screen.findByText(/awaiting payment/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pay now/i })).toBeInTheDocument();
    expect(screen.getByText(/checkout being reconciled/i)).toBeInTheDocument();
    // The unrelated order's pay button must remain untouched by the
    // presence of a stuck checkout for a *different* attempt.
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});
