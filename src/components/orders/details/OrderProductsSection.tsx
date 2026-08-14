import React from "react"
import { Order, OrderLineItem, PrescriptionMedication } from "@/api/ordersApi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Package, RefreshCw, CheckCircle2, Truck, Stethoscope, ChevronRight, ArrowRight, Syringe, GitBranch, History } from "lucide-react"

export interface BundledSupplyItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  isIncluded: boolean
}

export interface NormalizedProductItem {
  id: string
  productId?: string
  name: string
  requestedName: string
  prescribedName: string
  quantity: number
  unitPrice: number
  originalUnitPrice?: number
  lineTotal: number
  shippingFee: number
  status: string
  rxId?: string
  strength?: string
  doctorName?: string
  isDoctorChanged: boolean
  isDeclined?: boolean
  trackingNumber?: string
  trackingUrl?: string
  shipmentProvider?: string
  linkedLab?: string
  bundledSupplies: BundledSupplyItem[]
}

interface OrderProductsSectionProps {
  order: Order
  selectedProductId: string | null
  onSelectProduct: (productId: string | null) => void
  canChangeProduct: boolean
  changeProductTooltip: string
  onChangeProductClick: () => void
  pendingProductChange: {
    productName: string
    subtotal: number
    discountAmount: number
    shippingFee: number
    newAmount: number
    unitPrice: number
  } | null
}

export const isSupplyItem = (item: Record<string, unknown>): boolean => {
  if (!item) return false
  const type = String(item.item_type || item.type || item.category || item.kind || "").toLowerCase()
  if (type === "supply" || type === "supplies" || item.is_supply === true) return true
  return item.source_supply_relation_id != null
}

const matchesLineItem = (
  line: OrderLineItem,
  medication: PrescriptionMedication
): boolean => {
  const lineProduct = line.product_id == null ? "" : String(line.product_id)
  const medicationProducts = [
    medication.product_id,
    medication.source_product_id,
    medication.id,
  ].filter((value) => value != null).map(String)
  if (lineProduct && medicationProducts.includes(lineProduct)) return true
  const providerId = String(line.provider_product_id || "")
  return Boolean(providerId && medication.medId && providerId === String(medication.medId))
}

const findMedicationForLine = (
  line: OrderLineItem,
  medications: PrescriptionMedication[]
): PrescriptionMedication | undefined =>
  medications.find((medication) => matchesLineItem(line, medication))

export function extractOrderSupplies(order: Order): BundledSupplyItem[] {
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

  // 1. From primary_product_snapshot.linked_supplies
  const snapshotSupplies = (order as any).primary_product_snapshot?.linked_supplies
  if (Array.isArray(snapshotSupplies)) {
    snapshotSupplies.forEach((s: any, idx: number) => {
      addSupply(
        String(s.id || `snap-sup-${idx}`),
        String(s.name || s.product_name || "Medical Supply"),
        Number(s.quantity) || 1,
        Number(s.unit_price || s.price) || 0,
        Boolean(s.is_included ?? true)
      )
    })
  }

  // 2. From order.pricing?.supply_line_items
  if (Array.isArray(order.pricing?.supply_line_items)) {
    order.pricing.supply_line_items.forEach((s, idx) => {
      addSupply(
        String(s.id || `pricing-sup-${idx}`),
        String(s.name || "Medical Supply"),
        Number(s.quantity) || 1,
        Number(s.unit_price) || 0,
        Boolean(s.is_included ?? true)
      )
    })
  }

  // 3. From order.line_items where item_type === 'supply'
  if (Array.isArray(order.line_items)) {
    (order.line_items as any[]).forEach((item, idx) => {
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

  // 4. From requested_medicines / prescribed_medicines
  const meds = [
    ...(order.requested_medicines || []),
    ...(order.prescribed_medicines || []),
    ...(order.prescription_medications || []),
  ] as any[]

  meds.forEach((m, idx) => {
    if (m && isSupplyItem(m)) {
      addSupply(
        String(m.rxId || m.medId || `med-sup-${idx}`),
        String(m.name || m.prescribed_name || "Medical Supply"),
        Number(m.quantity) || 1,
        Number(m.price) || 0,
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

export const OrderProductsSection: React.FC<OrderProductsSectionProps> = ({
  order,
  selectedProductId,
  onSelectProduct,
  canChangeProduct,
  changeProductTooltip,
  onChangeProductClick,
  pendingProductChange,
}) => {
  const reconciliation = order.treatment_aggregate?.reconciliation

  // Separate medication products from supply line items & bundle supplies into parent products
  const productItems: NormalizedProductItem[] = React.useMemo(() => {
    const doctorName = order.doctor_name || undefined
    const requestedList = order.requested_medicines || []
    const prescribedList = order.prescribed_medicines || order.prescription_medications || []
    const allSupplies = extractOrderSupplies(order)

    const medProducts: NormalizedProductItem[] = []

    // 1. Check line_items
    if (Array.isArray(order.line_items) && order.line_items.length > 0) {
      const lineItems = order.line_items as Array<OrderLineItem & Record<string, unknown>>

      lineItems.forEach((item, idx) => {
        if (isSupplyItem(item)) return

        const qty = Number(item.quantity) || 1
        const unitP = Number(item.unit_patient_price) || 0
        const total = Number(item.line_total) || unitP * qty

        const matchingReq = findMedicationForLine(item, requestedList)
        const matchingRx = findMedicationForLine(item, prescribedList)

        const reqName = matchingReq?.name || item.product_name || "Product name unavailable"
        const prescribedName = item.product_name || matchingRx?.name || matchingRx?.prescribed_name || reqName
        const linkedSupplies = lineItems
          .filter((candidate) => isSupplyItem(candidate) && String(candidate.parent_line_item || "") === String(item.id))
          .map((candidate) => ({
            id: String(candidate.id),
            name: candidate.product_name || "Supply name unavailable",
            quantity: Number(candidate.quantity) || 1,
            unitPrice: Number(candidate.unit_patient_price) || 0,
            isIncluded: Boolean(candidate.is_included),
          }))

        medProducts.push({
          id: String(item.id || `line-${idx}`),
          productId: item.product_id == null ? undefined : String(item.product_id),
          name: prescribedName,
          requestedName: reqName,
          prescribedName,
          quantity: qty,
          unitPrice: unitP,
          lineTotal: total,
          shippingFee: Number(item.unit_shipping_fee) || 0,
          status: item.prescription_status || item.status || "active",
          doctorName,
          rxId: matchingRx?.rxId || matchingReq?.rxId,
          strength: matchingRx?.strength || matchingReq?.strength,
          isDoctorChanged: reqName !== prescribedName,
          trackingNumber: item.tracking_number || undefined,
          trackingUrl: item.tracking_url || undefined,
          shipmentProvider: item.shipment_provider || undefined,
          bundledSupplies: linkedSupplies,
        })
      })
    } else {
      // 2. Extract from requested_medicines and prescribed_medicines arrays
      const maxCount = Math.max(requestedList.length, prescribedList.length, 1)

      for (let i = 0; i < maxCount; i++) {
        const req = requestedList[i] || requestedList[0]
        const rx = prescribedList[i] || prescribedList[0]

        if (isSupplyItem(req as any) || isSupplyItem(rx as any)) continue

        const reqName = req?.name || order.product_name || "Requested Product"
        const rawRxName = rx?.name || rx?.prescribed_name || null

        const isSamePlaceholder =
          rawRxName?.trim().toLowerCase() === "same med" ||
          rawRxName?.trim().toLowerCase() === "same medicine"

        const rxName = rawRxName && !isSamePlaceholder ? rawRxName : reqName
        const isChanged = Boolean(rawRxName && !isSamePlaceholder && rawRxName !== reqName)
        const qty = Number(rx?.quantity || req?.quantity || 1) || 1
        const price = Number(rx?.price ?? req?.price ?? order.pricing?.subtotal_before_discount ?? order.original_price ?? 0)
        const shipping = Number(rx?.shipping_fee ?? req?.shipping_fee ?? order.shipping_fee ?? 0)

        const productId = rx?.product_id ?? req?.product_id
        medProducts.push({
          id: String(rx?.rxId || rx?.medId || `prod-${i}`),
          productId: productId == null ? undefined : String(productId),
          name: rxName,
          requestedName: reqName,
          prescribedName: rxName,
          quantity: qty,
          unitPrice: price / qty,
          lineTotal: price,
          shippingFee: shipping,
          status: order.orderStatus || order.status || "created",
          rxId: rx?.rxId,
          strength: rx?.strength || req?.strength,
          doctorName,
          isDoctorChanged: isChanged,
          bundledSupplies: [],
        })
      }
    }

    // Attach extracted bundled supplies to medication products
    if (!order.line_items?.length && allSupplies.length > 0 && medProducts.length > 0) {
      medProducts[0].bundledSupplies = allSupplies
    }

    return medProducts
  }, [order])

  const orderStatus = (order.orderStatus || order.status || "").toLowerCase()
  const isPrescribedStatus = orderStatus === "prescribed" || Boolean(order.datePrescribed)

  // A partially-prescribed order captures/confirms individual products as
  // Beluga delivers them, well before the order as a whole reaches
  // "prescribed" -- reconciliation.prescribed_set already reflects exactly
  // which specific Products have been confirmed so far. Falling back to the
  // order-wide isPrescribedStatus flag for every card would show an
  // already-confirmed product as "Awaiting provider decision" (or a
  // still-outstanding one as falsely "Prescribed") for as long as any
  // sibling product in the same order remains outstanding.
  const prescribedProductIds = React.useMemo(() => {
    const prescribedSet = order.treatment_aggregate?.reconciliation?.prescribed_set
    if (!Array.isArray(prescribedSet)) return null
    const ids = new Set<string>()
    prescribedSet.forEach((item) => {
      if (item?.product_id != null) ids.add(String(item.product_id))
    })
    return ids
  }, [order])

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
      {/* Section Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <span className="font-bold text-slate-900 dark:text-white text-base">
            Medication Products ({productItems.length})
          </span>
          {reconciliation && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              <span>Rx Revision #{reconciliation.version || 1}</span>
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedProductId !== null && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectProduct(null)}
              className="h-8 text-xs font-semibold text-primary hover:bg-primary/10"
            >
              Reset Selection
            </Button>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onChangeProductClick}
                  disabled={!canChangeProduct}
                  className="h-8 text-xs font-medium gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Update Order</span>
                </Button>
              </div>
            </TooltipTrigger>
            {!canChangeProduct && (
              <TooltipContent className="max-w-xs text-xs">
                {changeProductTooltip}
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Prescription Reconciliation Audit Banner if revised */}
        {reconciliation && (
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-slate-800 dark:text-slate-200">
                Prescription reconciled by provider. Status: <strong className="capitalize text-primary">{reconciliation.status}</strong>
              </span>
            </div>
            {reconciliation.created_at && (
              <span className="text-[11px] text-muted-foreground font-mono">
                {new Date(reconciliation.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {/* Horizontal Scroll Row for Product Cards */}
        <div className="flex gap-4 overflow-x-auto pb-3 pt-1 snap-x scrollbar-thin scrollbar-thumb-border">
          {productItems.map((prod, idx) => {
            const isSelected = selectedProductId === prod.id
            const displayPrescribed = pendingProductChange ? pendingProductChange.productName : prod.prescribedName
            // Prefer the per-product signal when reconciliation data is
            // available; fall back to the order-wide flag for orders that
            // never went through the prescribed-set reconciliation path.
            const cardIsPrescribed = prescribedProductIds
              ? Boolean(prod.productId && prescribedProductIds.has(prod.productId))
              : isPrescribedStatus

            return (
              <div
                key={prod.id || idx}
                onClick={() => onSelectProduct(isSelected ? null : prod.id)}
                className={`min-w-[290px] sm:min-w-[330px] max-w-[370px] flex-shrink-0 snap-start p-5 rounded-2xl border transition-all cursor-pointer space-y-4 ${
                  isSelected
                    ? "bg-primary/5 border-primary ring-2 ring-primary/20 shadow-xs"
                    : "bg-card border-border hover:bg-muted/30 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {/* Card Title Header & Price */}
                <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Product #{idx + 1}
                      </span>
                      {isSelected && (
                        <Badge variant="default" className="bg-primary text-primary-foreground text-[10px]">
                          Selected
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate leading-snug">
                      {displayPrescribed}
                    </h4>
                    {prod.strength && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        Spec: <span className="font-medium text-slate-700 dark:text-slate-300">{prod.strength}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-base font-bold tabular-nums text-slate-900 dark:text-white block">
                      ${prod.lineTotal.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      Qty {prod.quantity} × ${prod.unitPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Requested vs Prescribed Dual Section */}
                <div className="space-y-2 text-xs">
                  {/* Requested Row */}
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-medium text-[11px] block">
                      Requested by Patient:
                    </span>
                    <span className="pill pill-amber max-w-full truncate block">
                      {prod.requestedName} (Qty {prod.quantity})
                    </span>
                  </div>

                  {/* Prescribed Row */}
                  <div className="space-y-1 pt-1">
                    <span className="text-muted-foreground font-medium text-[11px] block">
                      Prescribed (Doctor Final):
                    </span>
                    {cardIsPrescribed ? (
                      <span className="pill pill-green max-w-full truncate block">
                        {displayPrescribed}
                      </span>
                    ) : prod.isDeclined ? (
                      <span className="pill pill-red max-w-full truncate block">
                        Declined by provider
                      </span>
                    ) : (
                      <span className="pill pill-amber max-w-full truncate block">
                        Awaiting provider decision
                      </span>
                    )}
                  </div>

                  {/* Doctor & Rx Details */}
                  {(prod.doctorName || prod.rxId) && (
                    <div className="pt-2 border-t border-border/40 space-y-1 text-[11px]">
                      {prod.doctorName && (
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Doctor:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {prod.doctorName}
                          </span>
                        </div>
                      )}
                      {prod.rxId && (
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Rx ID:</span>
                          <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                            {prod.rxId}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Shipment Tracking */}
                  {prod.trackingNumber && (
                    <div className="pt-2 border-t border-border/40 text-[11px] flex items-center justify-between">
                      <span className="text-muted-foreground">Tracking:</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        {prod.trackingNumber}
                      </span>
                    </div>
                  )}

                  {/* Bundled Linked Supplies Inside Product Card */}
                  {prod.bundledSupplies.length > 0 && (
                    <div className="pt-3 border-t border-border/60 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                        <Syringe className="h-3.5 w-3.5 text-primary" />
                        <span>Bundled Supplies ({prod.bundledSupplies.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {prod.bundledSupplies.map((sup, sIdx) => (
                          <div
                            key={sup.id || sIdx}
                            className="p-2 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between text-[11px]"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                              <span className="font-medium text-slate-900 dark:text-white truncate">
                                {sup.name}
                              </span>
                            </div>
                            <span className="text-muted-foreground font-mono ml-2 flex-shrink-0">
                              Qty {sup.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Inspect Footer Link */}
                <div className="flex justify-end pt-1">
                  <span className="text-[11px] font-semibold text-primary flex items-center gap-0.5">
                    {isSelected ? "Inspecting" : "Select for receipt"}
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
