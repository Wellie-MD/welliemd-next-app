import React from "react"
import { AdminOrder } from "@/api/dashboardApi"
import { Package, CheckCircle2, Syringe, GitBranch, History } from "lucide-react"
import { parseStatusLabel, getPrototypePillClass } from "./drawerUtils"

export interface BundledSupplyItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  isIncluded: boolean
}

export interface NormalizedProductItem {
  id: string
  name: string
  requestedName: string
  prescribedName: string
  quantity: number
  unitPrice: number
  lineTotal: number
  status: string
  rxId?: string
  doctorName?: string
  isDoctorChanged: boolean
  bundledSupplies: BundledSupplyItem[]
}

export const isSupplyItem = (item: Record<string, unknown>): boolean => {
  if (!item) return false
  const type = String(item.item_type || item.type || item.category || item.kind || "").toLowerCase()
  if (type === "supply" || type === "supplies" || item.is_supply === true) return true
  if (item.source_supply_relation_id != null) return true

  const name = String(item.product_name || item.name || "").toLowerCase()
  return (
    name.includes("supply") ||
    name.includes("supplies") ||
    name.includes("syringe") ||
    name.includes("swab") ||
    name.includes("needle") ||
    name.includes("alcohol") ||
    name.includes("sharps") ||
    name.includes("vial adapter") ||
    name.includes("prep pad") ||
    name.includes("wipes") ||
    name.includes("saline")
  )
}

export function extractOrderSupplies(order: AdminOrder): BundledSupplyItem[] {
  const supplies: BundledSupplyItem[] = []
  const seen = new Set<string>()

  const addSupply = (id: string, name: string, qty: number, price: number, isIncluded: boolean) => {
    if (!name || seen.has(name.toLowerCase())) return
    seen.add(name.toLowerCase())
    supplies.push({
      id,
      name,
      quantity: qty > 0 ? qty : 1,
      unitPrice: price,
      isIncluded: isIncluded || price === 0,
    })
  }

  // 1. From primary_product_snapshot / linked_supplies / link_supplies
  const snapshotSupplies =
    (order as any).primary_product_snapshot?.linked_supplies ||
    (order as any).pricing?.supply_line_items ||
    (order as any).linked_supplies ||
    (order as any).link_supplies
  if (Array.isArray(snapshotSupplies)) {
    snapshotSupplies.forEach((s: any, idx: number) => {
      const name = typeof s === "string" ? s : String(s.name || s.product_name || s.title || "Medical Supply")
      const qty = typeof s === "object" ? Number(s.quantity) || 1 : 1
      const price = typeof s === "object" ? Number(s.unit_price || s.price) || 0 : 0
      const isIncluded = typeof s === "object" ? Boolean(s.is_included ?? true) : true
      addSupply(
        String((typeof s === "object" && s.id) || `snap-sup-${idx}`),
        name,
        qty,
        price,
        isIncluded
      )
    })
  }

  // 2. From line_items where item_type === 'supply'
  if (Array.isArray((order as any).line_items)) {
    ((order as any).line_items as any[]).forEach((item, idx) => {
      if (isSupplyItem(item)) {
        addSupply(
          String(item.id || `line-sup-${idx}`),
          String(item.product_name || item.name || "Medical Supply"),
          Number(item.quantity) || 1,
          Number(item.unit_patient_price || item.price) || 0,
          Number(item.unit_patient_price || 0) === 0
        )
      }
    })
  }

  // 3. From requested_medicines / prescribed_medicines arrays
  const medArrays = [
    ...((order as any).requested_medicines || []),
    ...((order as any).prescribed_medicines || []),
    ...((order as any).prescription_medications || []),
    ...((order as any).products || []),
  ] as any[]

  medArrays.forEach((m, idx) => {
    if (m && isSupplyItem(m)) {
      addSupply(
        String(m.rxId || m.medId || `med-sup-${idx}`),
        String(m.name || m.prescribed_name || m.product_name || "Medical Supply"),
        Number(m.quantity) || 1,
        Number(m.price || m.unit_price) || 0,
        Boolean(m.is_included ?? true)
      )
    }
    const itemSupplies = m?.link_supplies || m?.linked_supplies || m?.supplies
    if (Array.isArray(itemSupplies)) {
      itemSupplies.forEach((s: any, sIdx: number) => {
        addSupply(
          String(s.id || `m-sup-${idx}-${sIdx}`),
          String(s.name || s.product_name || "Bundled Supply"),
          Number(s.quantity) || 1,
          Number(s.unit_price || s.price) || 0,
          Boolean(s.is_included ?? true)
        )
      })
    }
  })

  return supplies
}

export function extractOrderProducts(order: AdminOrder): NormalizedProductItem[] {
  const allSupplies = extractOrderSupplies(order)
  const doctorName = order.doctor_name || undefined
  const reconciliation = order.treatment_aggregate?.reconciliation
  const medProducts: NormalizedProductItem[] = []
  const seenNames = new Set<string>()

  const requestedList = (order as any).requested_medicines || (order as any).requested_products || []
  const prescribedList = (order as any).prescribed_medicines || (order as any).prescription_medications || (order as any).prescribed_products || []

  // 1. Check raw line_items for medication products (excluding supplies)
  if (Array.isArray((order as any).line_items) && (order as any).line_items.length > 0) {
    const medLineItems = ((order as any).line_items as any[]).filter((item) => !isSupplyItem(item))

    if (medLineItems.length > 0) {
      medLineItems.forEach((item, idx) => {
        const matchingReq = requestedList[idx] || requestedList[0]
        const matchingRx = prescribedList[idx] || prescribedList[0]

        const reqName = matchingReq?.name || item.product_name || order.requested_medicine_name || order.product_name || `Product #${idx + 1}`
        const prescribedName = item.product_name || matchingRx?.name || matchingRx?.prescribed_name || order.prescribed_medicine_name || reqName

        if (seenNames.has(prescribedName.toLowerCase())) return
        seenNames.add(prescribedName.toLowerCase())

        const qty = Number(item.quantity) || 1
        const price = Number(item.unit_patient_price || item.price || item.unit_price || 0)
        const lineTotal = price > 0 ? price * qty : Number(order.chargeable_amount ?? order.amount ?? 0) / medLineItems.length

        medProducts.push({
          id: String(item.id || item.product_id || `line-prod-${idx}`),
          name: prescribedName,
          requestedName: reqName,
          prescribedName,
          quantity: qty,
          unitPrice: price > 0 ? price : lineTotal / qty,
          lineTotal,
          status: order.status,
          rxId: matchingRx?.rxId || matchingReq?.rxId,
          doctorName,
          isDoctorChanged: reqName !== prescribedName,
          bundledSupplies: idx === 0 ? allSupplies : [],
        })
      })
    }
  }

  // 2. Check requested_medicines and prescribed_medicines arrays if line_items didn't populate multiple
  if (medProducts.length === 0 && (requestedList.length > 0 || prescribedList.length > 0)) {
    const maxCount = Math.max(requestedList.length, prescribedList.length, 1)

    for (let i = 0; i < maxCount; i++) {
      const req = requestedList[i] || requestedList[0]
      const rx = prescribedList[i] || prescribedList[0]

      if (isSupplyItem(req as any) || isSupplyItem(rx as any)) continue

      const reqName = req?.name || order.requested_medicine_name || order.product_name || "Requested Product"
      const rawRxName = rx?.name || rx?.prescribed_name || order.prescribed_medicine_name || null

      const isSamePlaceholder =
        rawRxName?.trim().toLowerCase() === "same med" ||
        rawRxName?.trim().toLowerCase() === "same medicine"

      const rxName = rawRxName && !isSamePlaceholder ? rawRxName : reqName
      if (seenNames.has(rxName.toLowerCase())) continue
      seenNames.add(rxName.toLowerCase())

      const qty = Number(rx?.quantity || req?.quantity || 1) || 1
      const price = Number(rx?.price ?? req?.price ?? Number(order.chargeable_amount ?? order.amount ?? 0) / maxCount)

      medProducts.push({
        id: String(rx?.rxId || rx?.medId || `prod-arr-${i}`),
        name: rxName,
        requestedName: reqName,
        prescribedName: rxName,
        quantity: qty,
        unitPrice: price / qty,
        lineTotal: price,
        status: order.status,
        rxId: rx?.rxId,
        doctorName,
        isDoctorChanged: Boolean(rawRxName && !isSamePlaceholder && rawRxName !== reqName),
        bundledSupplies: i === 0 ? allSupplies : [],
      })
    }
  }

  // 3. Check reconciliation requested_set and prescribed_set if no products extracted yet
  if (medProducts.length === 0 && reconciliation) {
    const reqSet = reconciliation.requested_set || []
    const rxSet = reconciliation.prescribed_set || []
    const maxCount = Math.max(reqSet.length, rxSet.length)

    if (maxCount > 0) {
      for (let i = 0; i < maxCount; i++) {
        const req = reqSet[i] || reqSet[0]
        const rx = rxSet[i] || rxSet[0]

        const reqName = req?.name || order.requested_medicine_name || order.product_name || `Requested Product #${i + 1}`
        const rxName = rx?.name || order.prescribed_medicine_name || reqName
        const qty = Number(rx?.quantity || req?.quantity || 1) || 1
        const lineTotal = Number(order.chargeable_amount ?? order.amount ?? 0) / maxCount

        medProducts.push({
          id: String(rx?.product_id || req?.product_id || `recon-prod-${i}`),
          name: rxName,
          requestedName: reqName,
          prescribedName: rxName,
          quantity: qty,
          unitPrice: lineTotal / qty,
          lineTotal,
          status: order.status,
          rxId: rx?.med_id || undefined,
          doctorName,
          isDoctorChanged: reqName !== rxName,
          bundledSupplies: i === 0 ? allSupplies : [],
        })
      }
    }
  }

  // 4. Fallback single product view
  if (medProducts.length === 0) {
    const reqName = order.requested_medicine_name || order.product_name || "Requested Product"
    const rawRxName = order.prescribed_medicine_name || null
    const isSamePlaceholder =
      rawRxName?.trim().toLowerCase() === "same med" ||
      rawRxName?.trim().toLowerCase() === "same medicine"

    const rxName = rawRxName && !isSamePlaceholder ? rawRxName : reqName
    const lineTotal = Number(order.chargeable_amount ?? order.amount ?? 0)

    medProducts.push({
      id: String(order.id || "prod-0"),
      name: rxName,
      requestedName: reqName,
      prescribedName: rxName,
      quantity: 1,
      unitPrice: lineTotal,
      lineTotal,
      status: order.status,
      doctorName,
      isDoctorChanged: Boolean(rawRxName && !isSamePlaceholder && rawRxName !== reqName),
      bundledSupplies: allSupplies,
    })
  }

  // Guarantee bundled supplies are attached to at least the primary medication product card
  if (allSupplies.length > 0 && medProducts.length > 0 && medProducts[0].bundledSupplies.length === 0) {
    medProducts[0].bundledSupplies = allSupplies
  }

  return medProducts
}

interface DrawerProductsSectionProps {
  order: AdminOrder
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
                  ${prod.lineTotal.toFixed(2)}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Qty {prod.quantity}
                </span>
              </div>
            </div>

            {/* Requested vs Prescribed Dual Rows */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-[11px]">Requested:</span>
                <span className="pill pill-amber max-w-[240px] truncate">
                  {prod.requestedName} (Qty {prod.quantity})
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
                      Qty {sup.quantity} · {sup.isIncluded ? "Included" : `$${sup.unitPrice.toFixed(2)}`}
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
