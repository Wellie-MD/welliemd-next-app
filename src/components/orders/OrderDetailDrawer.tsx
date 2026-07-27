import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AdminOrder, updateAdminOrder, fetchAdminOrderDetail, OrderUpdatePayload } from "@/api/dashboardApi"
import { useToast } from "@/hooks/use-toast"
import {
  Package,
  Save,
  X,
  Loader2,
  Truck,
  RefreshCw,
} from "lucide-react"

import { TreatmentOrderAggregate } from "@/features/treatments/orders/components/TreatmentOrderAggregate"
import { DrawerProductsSection } from "./drawer/DrawerProductsSection"
import { DrawerPricingReceipt } from "./drawer/DrawerPricingReceipt"
import { DrawerReimbursementSection } from "./drawer/DrawerReimbursementSection"
import { DrawerClinicalPharmacySection } from "./drawer/DrawerClinicalPharmacySection"
import { DrawerSupportTimelineSection } from "./drawer/DrawerSupportTimelineSection"
import { parseStatusLabel, getPrototypePillClass } from "./drawer/drawerUtils"

interface OrderDetailDrawerProps {
  order: AdminOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onOrderUpdated: (updatedOrder: AdminOrder) => void
}

const ORDER_STATUSES = [
  { value: "created", label: "Created" },
  { value: "payment_pending", label: "Payment Pending" },
  { value: "processing", label: "Processing" },
  { value: "visit_failed", label: "Visit Failed" },
  { value: "visit_pending", label: "Visit Pending" },
  { value: "consult_scheduled", label: "Consult Scheduled" },
  { value: "consult_rescheduled", label: "Consult Rescheduled" },
  { value: "consult_canceled", label: "Consult Canceled" },
  { value: "no_show", label: "No Show" },
  { value: "referred", label: "Referred" },
  { value: "prescribed", label: "Prescribed" },
  { value: "billing_pending", label: "Billing Pending" },
  { value: "rx_sent", label: "Rx Sent" },
  { value: "shipped", label: "Shipped" },
  { value: "in_transit", label: "In Transit" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "delivery_failed", label: "Delivery Failed" },
  { value: "canceled", label: "Canceled" },
]

const TERMINAL_STATUSES = ["shipped", "canceled"]

export function OrderDetailDrawer({ order, open, onOpenChange, onOrderUpdated }: OrderDetailDrawerProps) {
  const [newStatus, setNewStatus] = useState<string>("")
  const [trackingNumber, setTrackingNumber] = useState<string>("")
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [detailOrder, setDetailOrder] = useState<AdminOrder | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const { toast } = useToast()

  // When a new order is selected, reset form fields
  useEffect(() => {
    if (order) {
      setNewStatus(order.status)
      setTrackingNumber(order.tracking_number || "")
      setSelectedProductId(null)
      setDetailOrder(null)
    } else {
      setNewStatus("")
      setTrackingNumber("")
      setSelectedProductId(null)
      setDetailOrder(null)
    }
  }, [order?.id])

  // Fetch full order detail when drawer opens (to get line_items, linked_supplies, etc.)
  useEffect(() => {
    if (!open || !order) return

    let cancelled = false
    setDetailLoading(true)

    // The control-plane route requires a UUID and needs client_id to know
    // which tenant to proxy to — order.order_id (display id) won't match.
    fetchAdminOrderDetail(order.id, order.client_id)
      .then((fullOrder) => {
        if (!cancelled) {
          // Merge list-level data (which has treatment_aggregate etc.) with detail data
          setDetailOrder({ ...order, ...fullOrder })
        }
      })
      .catch((err) => {
        if (!cancelled) {
          // On error, fall back to list-level data silently
          console.warn("Failed to fetch full order detail, using list data:", err)
          setDetailOrder(order)
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })

    return () => { cancelled = true }
  }, [open, order?.id])

  const isTerminal = order ? TERMINAL_STATUSES.includes(order.status) : false

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && order) {
      setNewStatus(order.status)
      setTrackingNumber(order.tracking_number || "")
    }
    onOpenChange(isOpen)
  }

  const handleSave = async () => {
    if (!order) return

    const hasStatusChange = newStatus && newStatus !== order.status
    const hasTrackingChange = trackingNumber !== (order.tracking_number || "")

    if (!hasStatusChange && !hasTrackingChange) {
      toast({ title: "No changes", description: "No changes were made." })
      return
    }

    if (newStatus === "shipped" && !trackingNumber.trim()) {
      toast({
        title: "Tracking number required",
        description: "Please enter a tracking number before setting status to Shipped.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const payload: OrderUpdatePayload = { client_id: order.client_id }
      if (hasStatusChange) payload.status = newStatus
      if (hasTrackingChange) payload.tracking_number = trackingNumber

      const response = await updateAdminOrder(order.id, payload)

      if (response.success && response.order) {
        onOrderUpdated(response.order)
        toast({ title: "Order updated", description: "Order has been updated successfully." })
        onOpenChange(false)
      } else if (response.status === 'queued' || response.status === 'processing') {
        toast({ title: "Update queued", description: "Order update is being processed." })
        onOpenChange(false)
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message || "")
          : ""
      toast({
        title: "Update failed",
        description: message || "Failed to update order.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (!order) return null

  // Use enriched detail if loaded, fall back to list-level data
  const displayOrder = detailOrder || order

  const orderTitle = order.order_id || order.display_id || order.id
  const isPrescribedStatus = String(order.status || "").toLowerCase() === "prescribed"
  const isRecoveryPending = isPrescribedStatus && (order.payment_recovery_state || "").toLowerCase() === "recovery_pending"

  const orderStatusParsed = parseStatusLabel(order.status)
  const orderStatusPillClass = getPrototypePillClass(order.status)

  const paymentStatusParsed = parseStatusLabel(order.payment_status)
  const paymentStatusPillClass = getPrototypePillClass(order.payment_status)

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent className="w-full sm:w-[580px] md:w-[620px] max-w-[95vw] overflow-y-auto p-0 flex flex-col">
        {/* Drawer Header */}
        <SheetHeader className="p-5 border-b border-border bg-card sticky top-0 z-20 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <SheetTitle className="text-lg font-bold font-mono">
                  Order #{orderTitle}
                </SheetTitle>
                {detailLoading && (
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                )}
              </div>
              <SheetDescription className="text-xs text-muted-foreground">
                Placed {new Date(order.created_at).toLocaleDateString()} for{" "}
                <span className="font-semibold text-slate-900 dark:text-white">{order.patient_name}</span> ({order.client_name})
              </SheetDescription>
            </div>

            {/* Prototype Pill Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={orderStatusPillClass}>
                {orderStatusParsed}
              </span>
              <span className={paymentStatusPillClass}>
                {paymentStatusParsed}
              </span>
              {isRecoveryPending && (
                <span className="pill pill-amber">
                  Payment Recovery Pending
                </span>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Extended Vertical Drawer Body (Accurate Section Layout) */}
        <div className="p-5 space-y-5 flex-1">
          {/* Treatment Aggregate Lifecycle (if available) */}
          {displayOrder.treatment_aggregate && (
            <TreatmentOrderAggregate aggregate={displayOrder.treatment_aggregate} />
          )}

          {/* 1. Products Section (Multi-products, Requested vs Prescribed, Bundled Supplies) */}
          <DrawerProductsSection
            order={displayOrder}
            selectedProductId={selectedProductId}
            onSelectProduct={setSelectedProductId}
          />

          {/* 2. Payment & Itemized Receipt Section */}
          <DrawerPricingReceipt
            order={displayOrder}
            selectedProductId={selectedProductId}
          />

          {/* 3. B2B Client Reimbursement & Settlement Section */}
          <DrawerReimbursementSection order={displayOrder} />

          {/* 4. Clinical, Patient & Pharmacy Details */}
          <DrawerClinicalPharmacySection order={displayOrder} />

          {/* 5. Support Notes, Audit Flags & Milestone Timeline */}
          <DrawerSupportTimelineSection order={displayOrder} />

          {/* 6. Quick Update Order Controls Section */}
          {!isTerminal ? (
            <div className="pt-2 border-t border-border space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-primary" />
                <span>Update Order</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/20 p-3 rounded-xl border border-border">
                <div className="space-y-1">
                  <Label htmlFor="drawer-order-status" className="text-xs font-medium">Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger id="drawer-order-status" className="h-8 text-xs bg-card">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value} className="text-xs">
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="drawer-tracking-number" className="text-xs font-medium">Tracking Number</Label>
                  <Input
                    id="drawer-tracking-number"
                    placeholder="Enter tracking number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="h-8 text-xs font-mono bg-card"
                  />
                  {newStatus === "shipped" && !trackingNumber.trim() && (
                    <p className="text-[10px] text-destructive pt-0.5">
                      Tracking number is required for shipped status.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
              <p className="text-xs text-muted-foreground italic">
                This order has a terminal status ({orderStatusParsed}) and cannot be modified.
              </p>
            </div>
          )}
        </div>

        {/* Drawer Sticky Footer */}
        <SheetFooter className="p-4 border-t border-border bg-card sticky bottom-0 z-20 flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs gap-1">
            <X className="h-3.5 w-3.5" />
            <span>Close</span>
          </Button>

          {!isTerminal && (
            <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground shadow-xs">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
