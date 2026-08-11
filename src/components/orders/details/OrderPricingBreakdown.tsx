import React from "react"
import { Order } from "@/api/ordersApi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, Layers, Receipt, Check, Package, CreditCard, Tag, ShieldCheck, Clock, Syringe } from "lucide-react"
import { isSupplyItem, extractOrderSupplies } from "./OrderProductsSection"

interface OrderPricingBreakdownProps {
  order: Order
  selectedProductId: string | null
  onSelectProduct: (productId: string | null) => void
}

const parseMoney = (value?: string | number | null): number | null => {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number.parseFloat(String(value))
  return Number.isFinite(parsed) ? parsed : null
}

const formatMoney = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return "0.00"
  return value.toFixed(2)
}

const formatProcessorName = (val?: string | null): string => {
  if (!val) return "Not recorded"
  const lower = val.toLowerCase()
  if (lower.includes("stripe")) return "Stripe"
  if (lower.includes("authorize")) return "Authorize.Net"
  if (lower.includes("nmi")) return "NMI"
  return val.charAt(0).toUpperCase() + val.slice(1)
}

const formatPaymentStatusLabel = (val?: string | null): string => {
  if (!val) return "Not recorded"
  const lower = val.toLowerCase()
  if (lower === "captured" || lower === "paid" || lower === "completed" || lower === "succeeded") return "Captured & Paid"
  if (lower === "authorized" || lower === "auth_hold") return "Authorized (Hold)"
  if (lower === "pending" || lower === "payment_pending") return "Payment Pending"
  if (lower === "refunded") return "Refunded"
  if (lower === "voided" || lower === "canceled") return "Voided / Canceled"
  return val.charAt(0).toUpperCase() + val.slice(1).replace(/_/g, " ")
}

const parseTransactionId = (order: Order): string => {
  return (
    order.paymentProcessorTransactionId ||
    order.paymentTransactionId ||
    order.transaction_id ||
    "Not recorded"
  )
}

const parsePaymentDate = (order: Order): string => {
  const rawDate =
    order.paymentDate

  if (!rawDate) return "Not recorded"
  try {
    const d = new Date(rawDate)
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) + " • " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    }
  } catch (e) {
    // ignore
  }
  return String(rawDate)
}

export const OrderPricingBreakdown: React.FC<OrderPricingBreakdownProps> = ({
  order,
  selectedProductId,
  onSelectProduct,
}) => {
  // Extract medication products and bundled supplies for itemized receipt
  const { lineItemsList, bundledSupplies } = React.useMemo(() => {
    const allSupplies = extractOrderSupplies(order)
    const list: Array<{ id: string; name: string; qty: number; unitPrice: number; total: number }> = []

    if (Array.isArray(order.line_items) && order.line_items.length > 0) {
      const lineItems = order.line_items as Array<Record<string, unknown>>

      lineItems.forEach((item, idx) => {
        if (isSupplyItem(item)) return

        const id = String(item.id || `line-${idx}`)
        const qty = Number(item.quantity) || 1
        const unitP = Number(item.unit_patient_price) || 0
        const total = Number(item.line_total) || unitP * qty

        list.push({
          id,
          name: String(item.product_name || "Treatment Product"),
          qty,
          unitPrice: unitP,
          total,
        })
      })
    } else {
      const requestedList = order.requested_medicines || []
      const prescribedList = order.prescribed_medicines || order.prescription_medications || []
      const maxCount = Math.max(requestedList.length, prescribedList.length, 1)

      for (let i = 0; i < maxCount; i++) {
        const req = requestedList[i] || requestedList[0]
        const rx = prescribedList[i] || prescribedList[0]

        if (isSupplyItem(req as any) || isSupplyItem(rx as any)) continue

        const name = rx?.name || rx?.prescribed_name || req?.name || order.product_name || "Medication Product"
        const qty = Number(rx?.quantity || req?.quantity || 1) || 1
        const total = Number(rx?.price ?? req?.price ?? order.pricing?.subtotal_before_discount ?? order.original_price ?? 0)
        const id = String(rx?.rxId || rx?.medId || `prod-${i}`)

        list.push({
          id,
          name,
          qty,
          unitPrice: total / qty,
          total,
        })
      }
    }

    return { lineItemsList: list, bundledSupplies: allSupplies }
  }, [order])

  // Find selected item if active
  const selectedItem = React.useMemo(() => {
    if (!selectedProductId) return null
    return lineItemsList.find((item) => item.id === selectedProductId) || null
  }, [lineItemsList, selectedProductId])

  // Calculate sum of itemized line totals for mathematical precision
  const itemsSubtotalSum = React.useMemo(() => {
    return lineItemsList.reduce((sum, item) => sum + item.total, 0)
  }, [lineItemsList])

  // Order level financial figures from canonical pricing payload. The
  // aggregate's `purchase_summary` (R10 G3) is the one authoritative,
  // server-computed source for the checkout-time grand total and discount --
  // checked first, ahead of the older per-field fallback chain kept here for
  // orders predating that field.
  const purchaseSummary = order.treatment_aggregate?.purchase_summary
  const checkoutTotalSnapshot = purchaseSummary?.checkout_total as
    | { grand_total?: string | number }
    | null
    | undefined

  const shippingFee = parseMoney(order.pricing?.shipping_total ?? order.shipping_fee) ?? 0
  const rawDiscount =
    parseMoney(purchaseSummary?.discount_amount) ??
    parseMoney(order.pricing?.discount_total ?? order.discount_amount) ??
    0
  const taxAmount = parseMoney(order.pricing?.tax_total)
  const consultFee = parseMoney(order.pricing?.consult_fee)
  const grandTotal = parseMoney(
    checkoutTotalSnapshot?.grand_total ??
      order.treatment_case_summary?.treatment_total ??
      order.pricing?.grand_total ??
      order.grand_total ??
      order.payable_amount ??
      order.orderTotal ??
      order.amount
  )

  const subtotalPrice = itemsSubtotalSum > 0
    ? itemsSubtotalSum
    : parseMoney(order.pricing?.medication_subtotal ?? order.pricing?.subtotal_before_discount ?? order.original_price) ?? 0

  // Calculate mathematical discount delta if grandTotal is specified
  const computedGross = subtotalPrice + (consultFee ?? 0) + shippingFee + (taxAmount ?? 0)
  const effectiveDiscount = grandTotal != null && grandTotal < computedGross
    ? computedGross - grandTotal
    : rawDiscount

  const allocation = order.combined_payment_summary?.allocation
  const refundedAmount = parseMoney(allocation?.refunded_amount ?? order.totalRefunded) ?? 0
  const allocationCaptured = parseMoney(allocation?.captured_amount)
  const netCollected = allocationCaptured != null
    ? Math.max(0, allocationCaptured - refundedAmount)
    : grandTotal != null
      ? Math.max(0, grandTotal - refundedAmount)
      : null

  // Applied coupons
  const appliedCoupons = Array.isArray(order.pricing?.applied_coupons)
    ? order.pricing.applied_coupons
    : order.coupon_code
      ? [{ code: order.coupon_code, discount_amount: effectiveDiscount }]
      : []

  // Split capture calculations
  const baseCapturedAmount = parseMoney(order.base_captured_amount)
  const supplementalCapturedAmount = parseMoney(order.supplemental_captured_amount)
  const supplementalDeltaAmount = parseMoney(order.supplemental_delta_amount)
  const baseCaptureAmount = parseMoney(order.base_capture_amount)
  const rawRemainingSupplemental = parseMoney(order.remaining_supplemental_amount)

  const hasSplitSettlement = supplementalDeltaAmount != null && supplementalDeltaAmount > 0
  const splitComponentCapturedTotal = (baseCapturedAmount ?? 0) + (supplementalCapturedAmount ?? 0)
  const splitRemainingBaseAmount = hasSplitSettlement
    ? Math.max(0, (baseCaptureAmount ?? 0) - (baseCapturedAmount ?? 0))
    : null
  const splitRemainingSupplementalAmount = hasSplitSettlement
    ? Math.max(0, (supplementalDeltaAmount ?? 0) - (supplementalCapturedAmount ?? 0))
    : null

  const remainingToCaptureAmount = hasSplitSettlement
    ? (splitRemainingBaseAmount ?? 0) + (splitRemainingSupplementalAmount ?? 0)
    : rawRemainingSupplemental

  const paymentStatusFormatted = formatPaymentStatusLabel(
    order.combined_payment_summary?.allocation?.status || order.paymentStatus
  )
  const processorFormatted = formatProcessorName(order.paymentProcessor || order.payment_method_summary?.processor)
  const transactionIdFormatted = parseTransactionId(order)
  const paymentDateFormatted = parsePaymentDate(order)

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
          <Receipt className="h-4 w-4 text-primary" />
          <span>Payment & Pricing Receipt</span>
        </div>

        {/* Tab Controls for Full Receipt vs Single Product Filter */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => onSelectProduct(null)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              selectedProductId === null
                ? "bg-card text-slate-900 dark:text-white shadow-xs"
                : "text-muted-foreground hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Full Order Receipt
          </button>

          {selectedProductId !== null && selectedItem && (
            <button
              type="button"
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-primary text-primary-foreground shadow-xs flex items-center gap-1"
            >
              <Package className="h-3.5 w-3.5" />
              <span className="truncate max-w-[130px]">{selectedItem.name}</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Itemized Products Table (With Bundled Supplies Sub-rows) */}
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">ITEM / PRODUCT</th>
                <th className="py-3 px-4 text-right">PRICE</th>
                <th className="py-3 px-4 text-right">QTY</th>
                <th className="py-3 px-4 text-right">LINE TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lineItemsList.map((item, idx) => {
                const isSelected = selectedProductId === item.id
                const isFilteredOut = selectedProductId !== null && !isSelected

                return (
                  <React.Fragment key={item.id}>
                    <tr
                      onClick={() => onSelectProduct(isSelected ? null : item.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/10 font-medium text-slate-900 dark:text-white"
                          : isFilteredOut
                            ? "opacity-40 hover:opacity-100 hover:bg-muted/30"
                            : "hover:bg-muted/30"
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {item.name}
                        </div>
                        {isSelected && (
                          <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                            Active Selection Filter
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        ${item.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {item.qty}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                        ${item.total.toFixed(2)}
                      </td>
                    </tr>

                    {/* Sub-rows for Bundled Supplies on Primary Product */}
                    {idx === 0 &&
                      bundledSupplies.map((sup, sIdx) => (
                        <tr
                          key={`sup-${sIdx}`}
                          className="bg-muted/20 text-xs text-muted-foreground"
                        >
                          <td className="py-2 px-4 pl-8 flex items-center gap-1.5">
                            <span className="text-primary font-semibold text-[10px]">↳ Supply:</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {sup.name}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-right font-mono text-[11px]">
                            {sup.isIncluded ? "Included" : `$${sup.unitPrice.toFixed(2)}`}
                          </td>
                          <td className="py-2 px-4 text-right font-mono text-[11px]">
                            {sup.quantity}
                          </td>
                          <td className="py-2 px-4 text-right font-mono text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                            {sup.isIncluded ? "INCLUDED" : `$${(sup.unitPrice * sup.quantity).toFixed(2)}`}
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Detailed Financial Ledger Rows */}
        <div className="space-y-2.5 text-xs sm:text-sm pt-2">
          {selectedProductId === null ? (
            /* FULL ORDER FINANCIAL BREAKDOWN */
            <>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Product Subtotal</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-white font-medium">
                  ${formatMoney(subtotalPrice)}
                </span>
              </div>

              {consultFee != null && consultFee > 0 && (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Clinical Consult Fee</span>
                  <span className="font-mono tabular-nums text-slate-900 dark:text-white font-medium">
                    ${formatMoney(consultFee)}
                  </span>
                </div>
              )}

              {effectiveDiscount > 0 && (
                <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    <span>Discount Applied</span>
                    {appliedCoupons.map((c, i) => (
                      <Badge key={i} variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] uppercase font-mono">
                        {c.code}
                      </Badge>
                    ))}
                  </div>
                  <span className="font-mono tabular-nums">
                    − ${formatMoney(effectiveDiscount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-muted-foreground">
                <span>Shipping & Handling</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-white">
                  {shippingFee === 0 ? "FREE ($0.00)" : `$${formatMoney(shippingFee)}`}
                </span>
              </div>

              {taxAmount != null && taxAmount > 0 && (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Estimated Tax</span>
                  <span className="font-mono tabular-nums text-slate-900 dark:text-white">
                    ${formatMoney(taxAmount)}
                  </span>
                </div>
              )}

              {/* Grand Total Row */}
              <div className="pt-3 border-t border-border flex justify-between items-center font-bold text-slate-900 dark:text-white text-base">
                <span>Total (USD)</span>
                <span className="font-mono tabular-nums text-xl text-primary">
                  ${formatMoney(grandTotal ?? computedGross)}
                </span>
              </div>

              {/* Settlement History */}
              {refundedAmount > 0 && (
                <div className="flex justify-between items-center text-xs text-rose-600 dark:text-rose-400 font-medium pt-1">
                  <span>Refunded Amount</span>
                  <span className="font-mono tabular-nums">− ${formatMoney(refundedAmount)}</span>
                </div>
              )}

              {netCollected != null && refundedAmount > 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-slate-900 dark:text-white pt-1">
                  <span>Net Collected Amount</span>
                  <span className="font-mono tabular-nums">${formatMoney(netCollected)}</span>
                </div>
              )}
            </>
          ) : selectedItem ? (
            /* SPECIFIC PRODUCT FINANCIAL BREAKDOWN */
            <>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Selected Line Item ({selectedItem.name})</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-white font-semibold">
                  ${selectedItem.total.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center text-muted-foreground">
                <span>Line Quantity & Unit Price</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-white">
                  {selectedItem.qty} × ${selectedItem.unitPrice.toFixed(2)}
                </span>
              </div>

              <div className="pt-3 border-t border-border flex justify-between items-center font-bold text-slate-900 dark:text-white text-base">
                <span>Product Line Total:</span>
                <span className="font-mono tabular-nums text-xl text-primary">
                  ${selectedItem.total.toFixed(2)}
                </span>
              </div>
            </>
          ) : null}
        </div>

        {/* Payment Transaction Summary Footer */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2.5 text-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              <span>Payment Statement & Transaction Ref</span>
            </div>
            <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
              {paymentStatusFormatted}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-muted-foreground block text-[11px]">Processor:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{processorFormatted}</span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Transaction ID:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white break-all block">
                {transactionIdFormatted}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Payment Date:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{paymentDateFormatted}</span>
            </div>
          </div>
        </div>

        {/* Split Capture Ledger (if present) */}
        {hasSplitSettlement && selectedProductId === null && (
          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Layers className="h-4 w-4 text-primary" />
                <span>Split Settlement Breakdown</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-semibold">
                Split Capture
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block">Base Capture:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  ${formatMoney(baseCapturedAmount)}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block">Supplemental Delta:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  ${formatMoney(supplementalCapturedAmount)}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block">Captured Total:</span>
                <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                  ${formatMoney(splitComponentCapturedTotal)}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block">Remaining Hold:</span>
                <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">
                  ${formatMoney(remainingToCaptureAmount)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
