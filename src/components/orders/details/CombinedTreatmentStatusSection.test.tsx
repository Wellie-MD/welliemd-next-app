import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import type { CombinedSubmissionSummary } from "@/api/ordersApi"

import { CombinedTreatmentStatusSection } from "./CombinedTreatmentStatusSection"

const summary: CombinedSubmissionSummary = {
  id: "submission-1",
  status: "processing",
  orders: [
    {
      order_id: "order-1",
      order_display_id: "ORDER-001",
      treatment_case_id: "case-1",
      treatment_type_id: "type-1",
      treatment_type_key: "weight_loss",
      treatment_type_name: "Weight Loss",
      visit_id: "visit-1",
      visit_status: "provider_review_pending",
      status: "visit_pending",
      payment_allocation: {
        id: "allocation-1",
        status: "authorized",
      },
      b2b_reimbursement_status: "queued",
      beluga_dispatch_status: "sent",
    },
    {
      order_id: "order-2",
      order_display_id: "ORDER-002",
      treatment_case_id: "case-2",
      treatment_type_id: "type-2",
      treatment_type_key: "hormone_therapy",
      treatment_type_name: "Hormone Therapy",
      visit_id: "visit-2",
      visit_status: "prescribed",
      status: "prescribed",
      payment_allocation: {
        id: "allocation-2",
        status: "captured",
      },
      b2b_reimbursement_status: "paid",
      beluga_dispatch_status: "completed",
    },
  ],
}

describe("CombinedTreatmentStatusSection", () => {
  it("shows independent persisted states for every treatment", () => {
    render(
      <MemoryRouter>
        <CombinedTreatmentStatusSection
          currentOrderId="order-1"
          summary={summary}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText("Weight Loss")).toBeInTheDocument()
    expect(screen.getByText("Hormone Therapy")).toBeInTheDocument()
    expect(screen.getByText("ORDER-001")).toBeInTheDocument()
    expect(screen.getByText("ORDER-002")).toBeInTheDocument()
    expect(screen.getByText("Provider Review Pending")).toBeInTheDocument()
    expect(screen.getByText("Authorized")).toBeInTheDocument()
    expect(screen.getByText("Queued")).toBeInTheDocument()
    expect(screen.getByText("Paid")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /open order/i })).toHaveAttribute(
      "href",
      "/dashboard/orders/details/order-2",
    )
  })

  it("shows missing authority as not recorded", () => {
    const missingSummary: CombinedSubmissionSummary = {
      ...summary,
      orders: [
        {
          ...summary.orders![0],
          visit_id: null,
          visit_status: null,
          b2b_reimbursement_status: null,
          beluga_dispatch_status: null,
          payment_allocation: null,
        },
      ],
    }

    render(
      <MemoryRouter>
        <CombinedTreatmentStatusSection
          currentOrderId="order-1"
          summary={missingSummary}
        />
      </MemoryRouter>,
    )

    expect(screen.getAllByText("Not recorded").length).toBeGreaterThanOrEqual(5)
  })
})
