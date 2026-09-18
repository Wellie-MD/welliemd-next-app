import React from "react"
import { AdminOrderDetail } from "@/api/dashboardApi"
import { Receipt, CreditCard, Tag, RotateCcw, AlertCircle, Truck, Layers } from "lucide-react"
import { extractOrderProducts, extractOrderSupplies } from "./DrawerProductsSection"
import { parseStatusLabel, getPrototypePillClass } from "./drawerUtils"

interface DrawerPricingReceiptProps {
  order: AdminOrderDetail
  selectedProductId: string | null
}

const parseMoney = (val?: string | number | null): number | null => {
  if (val === null || val === undefined || val === "") return null
  const parsed = Number.parseFloat(String(val))
  return Number.isFinite(parsed) ? parsed : null
}

const formatMoney = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return "Not recorded"
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

export const DrawerPricingReceipt: React.FC<DrawerPricingReceiptProps> = ({
  order,
}) => {
  const productItems = React.useMemo(() => extractOrderProducts(order), [order])
  const supplyItems = React.useMemo(() => extractOrderSupplies(order), [order])

  const pricing = order.pricing || {}

  // Itemized display subtotal (medication products only — supplies are billed separately below).
  const productSubtotal = parseMoney(pricing.medication_subtotal)

  // Priced (non-included) bundled supplies must be added into the charged total —
  // they're real line items, not decoration.
  const suppliesTotal = parseMoney(pricing.supplies_subtotal)

  const shippingFee = parseMoney(pricing.shipping_total)
  const effectiveDiscount = parseMoney(pricing.discount_total ?? order.discount_amount)

  // Canonical charged total from the backend pricing engine — includes supplies,
  // never re-derived from the (possibly partial) itemized rows shown above.
  const grandTotal = parseMoney(
    pricing.grand_total ??
      pricing.payable_amount ??
      order.grand_total ??
      order.payable_amount ??
      order.chargeable_amount ??
      order.amount
  )

  const couponCode = order.coupon_code

  const refundAmount = parseMoney(order.totalRefunded)
  const remainingSupplementalAmount = parseMoney(order.remaining_supplemental_amount) ?? 0
  const netCollected = grandTotal != null && refundAmount != null ? Math.max(0, grandTotal - refundAmount) : null

  const baseCaptureAmount = parseMoney(order.base_capture_amount)
  const baseCapturedAmount = parseMoney(order.base_captured_amount)
  const supplementalCapturedAmount = parseMoney(order.supplemental_captured_amount)
  const supplementalDeltaAmount = parseMoney(order.supplemental_delta_amount)
  const hasSplitSettlement = supplementalDeltaAmount != null && supplementalDeltaAmount > 0

  const paymentStatusFormatted = parseStatusLabel(order.payment_status)
  const paymentPillClass = getPrototypePillClass(order.payment_status)
  const latestTransaction = order.payment_settlement_transactions?.at(-1)
  const processorFormatted = formatProcessorName(order.paymentProcessor || latestTransaction?.processor)
  const transactionIdFormatted = order.paymentProcessorTransactionId || order.paymentTransactionId || latestTransaction?.processor_transaction_id || "Not recorded"

  return (
    <div className="space-y-3">
      {/* Prototype Section Label */}
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center justify-between border-b border-border/40 pb-1">
        <div className="flex items-center gap-1.5">
          <Receipt className="h-3.5 w-3.5 text-primary" />
          <span>Payment & Receipt Ledger</span>
        </div>
        <span className={paymentPillClass}>
          {paymentStatusFormatted}
        </span>
      </div>

      <div className="bg-card border border-border rounded-xl p-3.5 space-y-3">
        {/* Itemized Table */}
        <div className="border border-border/80 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2 px-3">ITEM</th>
                <th className="py-2 px-3 text-right">PRICE</th>
                <th className="py-2 px-3 text-right">QTY</th>
                <th className="py-2 px-3 text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {productItems.map((prod, pIdx) => (
                <React.Fragment key={prod.id || pIdx}>
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                      {prod.prescribedName}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-muted-foreground">
                      {prod.unitPrice === null ? "Not recorded" : `$${prod.unitPrice.toFixed(2)}`}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-muted-foreground">
                      {prod.quantity ?? "Not recorded"}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                      {prod.lineTotal === null ? "Not recorded" : `$${prod.lineTotal.toFixed(2)}`}
                    </td>
                  </tr>

                  {/* Sub-rows for Bundled Supplies of this product */}
                  {prod.bundledSupplies.map((sup, sIdx) => (
                    <tr key={`sup-${pIdx}-${sIdx}`} className="bg-muted/20 text-muted-foreground">
                      <td className="py-1.5 px-3 pl-5 flex items-center gap-1">
                        <span className="text-primary font-semibold text-[9px]">↳ Supply:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {sup.name}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-[11px]">
                        {sup.isIncluded ? "Included" : sup.unitPrice === null ? "Not recorded" : `$${sup.unitPrice.toFixed(2)}`}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-[11px]">
                        {sup.quantity ?? "Not recorded"}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                        {sup.isIncluded ? "INCLUDED" : sup.unitPrice === null || sup.quantity === null ? "Not recorded" : `$${(sup.unitPrice * sup.quantity).toFixed(2)}`}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Ledger */}
        <div className="space-y-1.5 text-xs pt-1">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Product Subtotal</span>
            <span className="font-mono tabular-nums text-slate-900 dark:text-white font-medium">
              ${formatMoney(productSubtotal)}
            </span>
          </div>

          {suppliesTotal !== null && (
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Bundled Supplies</span>
              <span className="font-mono tabular-nums text-slate-900 dark:text-white font-medium">
                ${formatMoney(suppliesTotal)}
              </span>
            </div>
          )}

          {shippingFee !== null && (
            <div className="flex justify-between items-center text-muted-foreground">
              <div className="flex items-center gap-1">
                <Truck className="h-3 w-3" />
                <span>Shipping & Handling</span>
              </div>
              <span className="font-mono tabular-nums text-slate-900 dark:text-white font-medium">
                ${formatMoney(shippingFee)}
              </span>
            </div>
          )}

          {effectiveDiscount !== null && effectiveDiscount > 0 && (
            <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-medium">
              <div className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                <span>Discount Applied</span>
                {couponCode && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-mono uppercase text-emerald-700">
                    {couponCode}
                  </span>
                )}
              </div>
              <span className="font-mono tabular-nums">
                − ${formatMoney(effectiveDiscount)}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-border flex justify-between items-center font-bold text-slate-900 dark:text-white text-xs">
            <span>Grand Total USD</span>
            <span className="font-mono tabular-nums text-sm text-primary">
              ${formatMoney(grandTotal)}
            </span>
          </div>

          {/* Refunded or Supplemental Adjustments */}
          {refundAmount !== null && refundAmount > 0 && (
            <div className="flex justify-between items-center text-rose-700 dark:text-rose-400 font-medium pt-1">
              <div className="flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                <span>Refunded Amount</span>
              </div>
              <span className="font-mono tabular-nums">
                − ${formatMoney(refundAmount)}
              </span>
            </div>
          )}

          {remainingSupplementalAmount > 0 && (
            <div className="flex justify-between items-center text-amber-700 dark:text-amber-400 font-medium pt-1">
              <div className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>Supplemental Hold Remaining</span>
              </div>
              <span className="font-mono tabular-nums">
                ${formatMoney(remainingSupplementalAmount)}
              </span>
            </div>
          )}

          {refundAmount !== null && refundAmount > 0 && netCollected != null && (
            <div className="pt-1.5 border-t border-border/40 flex justify-between items-center font-bold text-slate-900 dark:text-white text-xs">
              <span>Net Collected</span>
              <span className="font-mono tabular-nums text-xs text-slate-900 dark:text-white">
                ${formatMoney(netCollected)}
              </span>
            </div>
          )}
        </div>

        {/* Split Capture Ledger (if present) */}
        {hasSplitSettlement && (
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/80 space-y-1.5 text-[11px]">
            <div className="flex items-center gap-1 font-semibold text-slate-900 dark:text-white border-b border-border/40 pb-1">
              <Layers className="h-3 w-3 text-primary" />
              <span>Split Settlement Breakdown</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground block text-[10px]">Base Capture:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  ${formatMoney(baseCapturedAmount)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Supplemental Delta:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  ${formatMoney(supplementalCapturedAmount)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Captured Total:</span>
                <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                  ${formatMoney((baseCapturedAmount ?? 0) + (supplementalCapturedAmount ?? 0))}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Remaining Hold:</span>
                <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">
                  ${formatMoney(Math.max(0, (baseCaptureAmount ?? 0) - (baseCapturedAmount ?? 0)) + Math.max(0, (supplementalDeltaAmount ?? 0) - (supplementalCapturedAmount ?? 0)))}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Summary Footer */}
        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/80 space-y-1.5 text-[11px]">
          <div className="flex items-center gap-1 font-semibold text-slate-900 dark:text-white border-b border-border/40 pb-1">
            <CreditCard className="h-3 w-3 text-primary" />
            <span>Transaction Ref & Payment Method</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-muted-foreground block text-[10px]">Processor:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{processorFormatted}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Transaction ID:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white break-all block">
                {transactionIdFormatted}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Date:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {order.created_at ? new Date(order.created_at).toLocaleDateString() : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
