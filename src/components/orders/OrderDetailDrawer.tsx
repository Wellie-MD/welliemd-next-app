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
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AdminOrder, updateAdminOrder, OrderUpdatePayload } from "@/api/dashboardApi"
import { useToast } from "@/hooks/use-toast"
import { Package, User, Mail, Phone, Building2, Pill, MapPin, CreditCard, Truck, Calendar, Hash } from "lucide-react"

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
  { value: "consult_canceled", label: "Consult Canceled" },
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

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const statusLower = status.toLowerCase()
  if (statusLower === "shipped" || statusLower === "prescribed" || statusLower === "rx_sent") return "default"
  if (statusLower === "canceled" || statusLower === "visit_failed" || statusLower === "consult_canceled") return "destructive"
  if (statusLower === "processing" || statusLower === "visit_pending" || statusLower === "billing_pending") return "secondary"
  return "outline"
}

function getPaymentBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const lower = status.toLowerCase()
  if (lower === "paid" || lower === "authorized") return "default"
  if (lower === "failed") return "destructive"
  return "secondary"
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return dateStr
  }
}

export function OrderDetailDrawer({ order, open, onOpenChange, onOrderUpdated }: OrderDetailDrawerProps) {
  const [newStatus, setNewStatus] = useState<string>("")
  const [trackingNumber, setTrackingNumber] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Reset form state whenever the selected order changes
  useEffect(() => {
    if (order) {
      setNewStatus(order.status)
      setTrackingNumber(order.tracking_number || "")
    } else {
      setNewStatus("")
      setTrackingNumber("")
    }
  }, [order?.id])

  const isTerminal = order ? TERMINAL_STATUSES.includes(order.status) : false

  const requestedMedicineName = order?.requested_medicine_name || order?.product_name || "—"
  const rawPrescribedMedicineName = order?.prescribed_medicine_name || null
  const prescribedNameNormalized = rawPrescribedMedicineName?.trim().toLowerCase()
  const prescribedMedicineName =
    prescribedNameNormalized === "same med" ||
    prescribedNameNormalized === "same medicine" ||
    prescribedNameNormalized === "same medication"
      ? requestedMedicineName
      : rawPrescribedMedicineName

  const chargeableRaw = order?.chargeable_amount ?? order?.amount ?? 0
  const chargeableNumber =
    typeof chargeableRaw === "number"
      ? chargeableRaw
      : Number.parseFloat(String(chargeableRaw)) || 0
  const chargeableSourceLabel =
    order?.chargeable_amount_source === "prescribed_medicine"
      ? "Prescribed (Doctor Final)"
      : order?.chargeable_amount_source === "requested_medicine_fallback"
        ? "Requested Fallback"
        : "Requested (Original)"
  const amountSourcePillClass =
    order?.chargeable_amount_source === "prescribed_medicine"
      ? "inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-800"
      : order?.chargeable_amount_source === "requested_medicine_fallback"
        ? "inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-rose-800"
        : "inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-800"

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
        // Synchronous replay (idempotent cached result)
        onOrderUpdated(response.order)
        toast({ title: "Order updated", description: "Order has been updated successfully." })
        onOpenChange(false)
      } else if (response.status === 'queued' || response.status === 'processing') {
        // Async — update queued via Celery task
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

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent className="w-[480px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Details
          </SheetTitle>
          <SheetDescription className="font-mono text-sm">
            {order.order_id || order.display_id}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Order Status */}
          <div className="flex items-center gap-3">
            <Badge variant={getStatusBadgeVariant(order.status)}>
              {order.status_display}
            </Badge>
            <Badge variant={getPaymentBadgeVariant(order.payment_status)}>
              {order.payment_status}
            </Badge>
          </div>

          {/* Patient Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Patient</h3>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{order.patient_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{order.patient_email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{order.patient_phone || "—"}</span>
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Order Info</h3>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Client:</span>
                <span>{order.client_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Master ID:</span>
                <span className="font-mono text-xs">{order.master_id || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Pill className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Product:</span>
                <span>{order.product_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Pill className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Requested (Original):</span>
                <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-800">
                  {requestedMedicineName}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Pill className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Prescribed (Doctor Final):</span>
                <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-800">
                  {prescribedMedicineName || "Awaiting provider decision"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Doctor:</span>
                <span>{order.doctor_name || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Pharmacy:</span>
                <span>{order.pharmacy_name || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">${chargeableNumber.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Amount Source:</span>
                <span className={amountSourcePillClass}>
                  {chargeableSourceLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Timeline</h3>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Ordered:</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Prescribed:</span>
                <span>{formatDate(order.prescribed_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Shipped:</span>
                <span>{formatDate(order.shipped_at)}</span>
              </div>
              {order.tracking_number && (
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Tracking:</span>
                  <span className="font-mono">{order.tracking_number}</span>
                </div>
              )}
            </div>
          </div>

          {/* Update Section */}
          {!isTerminal && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Update Order</h3>

              {/* Status Change */}
              <div className="space-y-2">
                <Label htmlFor="order-status">Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="order-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tracking Number */}
              <div className="space-y-2">
                <Label htmlFor="tracking-number">Tracking Number</Label>
                <Input
                  id="tracking-number"
                  placeholder="Enter tracking number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
                {newStatus === "shipped" && !trackingNumber.trim() && (
                  <p className="text-xs text-destructive">
                    Tracking number is required for shipped status.
                  </p>
                )}
              </div>
            </div>
          )}

          {isTerminal && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground italic">
                This order has a terminal status ({order.status_display}) and cannot be modified.
              </p>
            </div>
          )}
        </div>

        <SheetFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!isTerminal && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
