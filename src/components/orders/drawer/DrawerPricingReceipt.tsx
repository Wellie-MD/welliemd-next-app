import React from "react"
import { AdminOrder } from "@/api/dashboardApi"
import { Receipt, CreditCard, Tag, RotateCcw, AlertCircle, Truck, Layers } from "lucide-react"
import { extractOrderProducts, extractOrderSupplies } from "./DrawerProductsSection"
import { parseStatusLabel, getPrototypePillClass } from "./drawerUtils"

interface DrawerPricingReceiptProps {
  order: AdminOrder
  selectedProductId: string | null
}

const parseMoney = (val?: string | number | null): number | null => {
  if (val === null || val === undefined || val === "") return null
  const parsed = Number.parseFloat(String(val))
  return Number.isFinite(parsed) ? parsed : null
}

const formatMoney = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return "0.00"
  return value.toFixed(2)
}

const formatProcessorName = (val?: string | null): string => {
  if (!val) return "Authorize.Net"
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

  const pricing = (order as any).pricing || {}

  // Itemized display subtotal (medication products only — supplies are billed separately below).
  const lineItemsSubtotal = productItems.reduce((sum, item) => sum + item.lineTotal, 0)
  const productSubtotal = lineItemsSubtotal > 0
    ? lineItemsSubtotal
    : parseMoney(pricing.medication_subtotal ?? order.chargeable_amount ?? order.amount) ?? 0

  // Priced (non-included) bundled supplies must be added into the charged total —
  // they're real line items, not decoration.
  const suppliesTotal = supplyItems.reduce(
    (sum, sup) => sum + (sup.isIncluded ? 0 : sup.unitPrice * sup.quantity),
    0
  )

  const shippingFee = parseMoney(pricing.shipping_total ?? (order as any).shipping_fee) ?? 0
  const rawDiscount = parseMoney(pricing.discount_total ?? order.discount_amount) ?? 0

  // Canonical charged total from the backend pricing engine — includes supplies,
  // never re-derived from the (possibly partial) itemized rows shown above.
  const grandTotal = parseMoney(
    pricing.grand_total ??
      pricing.payable_amount ??
      (order as any).grand_total ??
      (order as any).payable_amount ??
      order.chargeable_amount ??
      order.amount
  )

  const computedGross = productSubtotal + suppliesTotal + shippingFee
  // If the backend total is lower than the visible gross, the gap is the real
  // discount even when discount_amount wasn't populated on this order.
  const effectiveDiscount = grandTotal != null && grandTotal < computedGross
    ? computedGross - grandTotal
    : rawDiscount

  const couponCode = (order as any).coupon_code as string | null | undefined

  const refundAmount = parseMoney((order as any).totalRefunded ?? (order as any).refund_amount) ?? 0
  const remainingSupplementalAmount = parseMoney(order.remaining_supplemental_amount) ?? 0
  const netCollected = grandTotal != null ? Math.max(0, grandTotal - refundAmount) : null

  const baseCaptureAmount = parseMoney((order as any).base_capture_amount)
  const baseCapturedAmount = parseMoney((order as any).base_captured_amount)
  const supplementalCapturedAmount = parseMoney((order as any).supplemental_captured_amount)
  const supplementalDeltaAmount = parseMoney((order as any).supplemental_delta_amount)
  const hasSplitSettlement = supplementalDeltaAmount != null && supplementalDeltaAmount > 0

  const paymentStatusFormatted = parseStatusLabel(order.payment_status)
  const paymentPillClass = getPrototypePillClass(order.payment_status)
  const processorFormatted = formatProcessorName((order as any).paymentProcessor || (order as any).payment_method_summary?.processor)
  const transactionIdFormatted = (order as any).paymentProcessorTransactionId || (order as any).paymentTransactionId || order.id

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
                      ${prod.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-muted-foreground">
                      {prod.quantity}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                      ${prod.lineTotal.toFixed(2)}
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
                        {sup.isIncluded ? "Included" : `$${sup.unitPrice.toFixed(2)}`}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-[11px]">
                        {sup.quantity}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                        {sup.isIncluded ? "INCLUDED" : `$${(sup.unitPrice * sup.quantity).toFixed(2)}`}
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

          {suppliesTotal > 0 && (
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Bundled Supplies</span>
              <span className="font-mono tabular-nums text-slate-900 dark:text-white font-medium">
                ${formatMoney(suppliesTotal)}
              </span>
            </div>
          )}

          {shippingFee > 0 && (
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

          {effectiveDiscount > 0 && (
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
              ${formatMoney(grandTotal ?? computedGross)}
            </span>
          </div>

          {/* Refunded or Supplemental Adjustments */}
          {refundAmount > 0 && (
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

          {refundAmount > 0 && netCollected != null && (
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
