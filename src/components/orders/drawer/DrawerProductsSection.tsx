import React from "react"
import { AdminOrderDetail } from "@/api/dashboardApi"
import { Package, CheckCircle2, Syringe, GitBranch, History } from "lucide-react"
import { parseStatusLabel, getPrototypePillClass } from "./drawerUtils"

export interface BundledSupplyItem {
  id: string
  name: string
  quantity: number | null
  unitPrice: number | null
  isIncluded: boolean
}

export interface NormalizedProductItem {
  id: string
  name: string
  requestedName: string
  prescribedName: string
  quantity: number | null
  unitPrice: number | null
  lineTotal: number | null
  status: string
  rxId?: string
  doctorName?: string
  isDoctorChanged: boolean
  bundledSupplies: BundledSupplyItem[]
}

export const isSupplyItem = (item: Record<string, unknown>): boolean => {
  if (!item) return false
  return String(item.item_type || "").toLowerCase() === "supply"
    || item.source_supply_relation_id != null
}

const numberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function extractOrderSupplies(order: AdminOrderDetail): BundledSupplyItem[] {
  return order.line_items.filter((item) => isSupplyItem(item as unknown as Record<string, unknown>)).map((item) => ({
    id: item.id,
    name: item.product_name || "Name not recorded",
    quantity: numberOrNull(item.quantity),
    unitPrice: numberOrNull(item.unit_patient_price),
    isIncluded: item.is_included === true,
  }))
}

export function extractOrderProducts(order: AdminOrderDetail): NormalizedProductItem[] {
  const allSupplies = extractOrderSupplies(order)
  const doctorName = order.doctor_name || undefined
  const reconciliation = order.treatment_aggregate?.reconciliation
  const requestedByProduct = new Map((reconciliation?.requested_set || []).map((item) => [String(item.product_id ?? item.source_product_id ?? ""), item]))
  const prescribedByProduct = new Map((reconciliation?.prescribed_set || []).map((item) => [String(item.product_id ?? item.source_product_id ?? ""), item]))
  return order.line_items
    .filter((item) => !isSupplyItem(item as unknown as Record<string, unknown>))
    .map((item, index) => {
      const key = String(item.product_id ?? "")
      const requested = requestedByProduct.get(key)
      const prescribed = prescribedByProduct.get(key)
      const requestedName = requested?.name || item.product_name || "Name not recorded"
      const prescribedName = prescribed?.name || item.product_name || "Name not recorded"
      return {
        id: item.id,
        name: prescribedName,
        requestedName,
        prescribedName,
        quantity: numberOrNull(item.quantity),
        unitPrice: numberOrNull(item.unit_patient_price),
        lineTotal: numberOrNull(item.line_total),
        status: item.status || order.status,
        doctorName,
        isDoctorChanged: Boolean(requested?.name && prescribed?.name && requested.name !== prescribed.name),
        bundledSupplies: index === 0 ? allSupplies : [],
      }
    })
}

interface DrawerProductsSectionProps {
  order: AdminOrderDetail
  selectedProductId: string | null
  onSelectProduct: (productId: string | null) => void
}

export const DrawerProductsSection: React.FC<DrawerProductsSectionProps> = ({
  order,
}) => {
  const reconciliation = order.treatment_aggregate?.reconciliation
  const productItems = React.useMemo(() => extractOrderProducts(order), [order])

  const orderStatus = (order.status || "").toLowerCase()
  const isPrescribedStatus = orderStatus === "prescribed" || Boolean(order.prescribed_at)

  return (
    <div className="space-y-3">
      {/* Prototype Section Label */}
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center justify-between border-b border-border/40 pb-1">
        <div className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-primary" />
          <span>Products & Prescribed Items ({productItems.length})</span>
        </div>
        {reconciliation && (
          <span className="pill pill-blue text-[10px]">
            Rx Revision #{reconciliation.version || 1}
          </span>
        )}
      </div>

      {reconciliation && (
        <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 text-xs flex items-center gap-2 text-blue-900">
          <History className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <span>
            Prescription reconciled by provider. Status: <strong>{parseStatusLabel(reconciliation.status)}</strong>
          </span>
        </div>
      )}

      {order.product_payment_reservations && order.product_payment_reservations.length > 0 && (
        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Product payment diagnostics
          </div>
          {order.product_payment_reservations.map((payment) => {
            const lineItem = order.line_items.find((item) => item.id === payment.line_item_id)
            return (
              <div key={payment.id} className="rounded-md border bg-background/60 p-2 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium truncate">
                    {payment.product_name || lineItem?.product_name || "Product"}
                  </span>
                  <span className={getPrototypePillClass(payment.status)}>
                    {parseStatusLabel(payment.status)}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {payment.amount == null ? "Amount not recorded" : `${payment.currency || "USD"} ${payment.amount}`}
                  {payment.processor ? ` · ${payment.processor}` : ""}
                  {payment.provider_transaction_id ? ` · Gateway ref ${payment.provider_transaction_id}` : ""}
                </div>
                {payment.patient_action === "do_not_resubmit" && (
                  <div className="text-[11px] font-medium text-red-700">
                    Do not resubmit; reconcile the gateway outcome first.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Product Cards List (Supporting Multiple Products + Bundles) */}
      <div className="space-y-3">
        {productItems.map((prod, idx) => (
          <div
            key={prod.id || idx}
            className="bg-card border border-border rounded-xl p-3.5 space-y-2.5 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 border-b border-border/40 pb-2">
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  Item #{idx + 1}
                </span>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {prod.prescribedName}
                </h4>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold tabular-nums font-mono text-slate-900 dark:text-white">
                  {prod.lineTotal === null ? "Not recorded" : `$${prod.lineTotal.toFixed(2)}`}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {prod.quantity === null ? "Quantity not recorded" : `Qty ${prod.quantity}`}
                </span>
              </div>
            </div>

            {/* Requested vs Prescribed Dual Rows */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-[11px]">Requested:</span>
                <span className="pill pill-amber max-w-[240px] truncate">
                  {prod.requestedName}{prod.quantity === null ? "" : ` (Qty ${prod.quantity})`}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-[11px]">Prescribed (Final):</span>
                {isPrescribedStatus ? (
                  <span className="pill pill-green max-w-[240px] truncate">
                    {prod.prescribedName}
                  </span>
                ) : (
                  <span className="pill pill-amber max-w-[240px] truncate">
                    Awaiting provider decision
                  </span>
                )}
              </div>

              {prod.doctorName && (
                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-border/30 text-muted-foreground">
                  <span>Prescribing Doctor:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {prod.doctorName}
                  </span>
                </div>
              )}
            </div>

            {/* Bundled Linked Supplies for this product */}
            {prod.bundledSupplies.length > 0 && (
              <div className="pt-2 border-t border-border/40 space-y-1.5">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <Syringe className="h-3 w-3 text-primary" />
                  <span>Bundled Supplies ({prod.bundledSupplies.length})</span>
                </div>
                {prod.bundledSupplies.map((sup, sIdx) => (
                  <div
                    key={sup.id || sIdx}
                    className="p-2 rounded-md bg-muted/40 border border-border/40 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                      <span className="font-medium text-slate-900 dark:text-white truncate">
                        {sup.name}
                      </span>
                    </div>
                    <span className="text-muted-foreground font-mono text-[10px] ml-2">
                      {sup.quantity === null ? "Quantity not recorded" : `Qty ${sup.quantity}`} · {sup.isIncluded ? "Included" : sup.unitPrice === null ? "Price not recorded" : `$${sup.unitPrice.toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
