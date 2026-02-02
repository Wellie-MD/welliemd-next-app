import { useMemo, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Order, ordersApi } from "@/api/ordersApi"
import { PatientResponsesModal } from "./PatientResponsesModal"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Package,
  FileText,
  CreditCard,
  Truck,
  Building2,
  ClipboardList
} from "lucide-react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { Permissions } from "@/constants/permissions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface OrderDetailsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  onDelete?: (orderId: string) => Promise<void> | void
}

// Status badge color mapping
const statusColors: Record<string, string> = {
  created: "bg-gray-100 text-gray-800",
  processing: "bg-blue-100 text-blue-800",
  visit_failed: "bg-red-100 text-red-800",
  visit_pending: "bg-yellow-100 text-yellow-800",
  consult_canceled: "bg-red-100 text-red-800",
  referred: "bg-purple-100 text-purple-800",
  prescribed: "bg-green-100 text-green-800",
  billing_pending: "bg-orange-100 text-orange-800",
  rx_sent: "bg-indigo-100 text-indigo-800",
  shipped: "bg-emerald-100 text-emerald-800",
  canceled: "bg-red-100 text-red-800",
}

// Status labels
const statusLabels: Record<string, string> = {
  created: "Created",
  processing: "Processing",
  visit_failed: "Visit Failed",
  visit_pending: "Visit Pending",
  consult_canceled: "Consult Canceled",
  referred: "Referred",
  prescribed: "Prescribed",
  billing_pending: "Billing Pending",
  rx_sent: "Rx Sent",
  shipped: "Shipped",
  canceled: "Canceled",
}

export function OrderDetailsSheet({
  open,
  onOpenChange,
  order
}: OrderDetailsSheetProps) {
  const [showPatientResponses, setShowPatientResponses] = useState(false)
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [refundAmount, setRefundAmount] = useState("")
  const [refundReason, setRefundReason] = useState("customer_request")
  const [refundReasonDescription, setRefundReasonDescription] = useState("")
  const [refundNotes, setRefundNotes] = useState("")
  const [refundLoading, setRefundLoading] = useState(false)
  const { toast } = useToast()

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-"
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a")
    } catch {
      return dateString
    }
  }

  const status = order?.orderStatus || order?.status || "created"
  const paymentStatus = order?.paymentStatus || ""
  const isAuthorized = paymentStatus === "authorized"
  const isRefundable = paymentStatus === "captured" || paymentStatus === "approved"
  const canRefundOrVoid = isAuthorized || isRefundable
  const remainingRefundable = useMemo(() => {
    const amount = order?.refundableAmount ? parseFloat(order.refundableAmount) : 0
    return Number.isNaN(amount) ? 0 : amount
  }, [order?.refundableAmount])

  const refundReasonOptions = [
    { value: "customer_request", label: "Customer Request" },
    { value: "duplicate_charge", label: "Duplicate Charge" },
    { value: "fraud", label: "Fraud" },
    { value: "product_not_received", label: "Product Not Received" },
    { value: "product_defective", label: "Product Defective" },
    { value: "service_not_rendered", label: "Service Not Rendered" },
    { value: "other", label: "Other" },
  ]

  const handleRefundSubmit = async () => {
    if (!order?.id) return
    if (!refundReason) {
      toast({ title: "Refund reason required", variant: "destructive" })
      return
    }

    if (isRefundable) {
      if (!refundAmount) {
        toast({ title: "Refund amount required", variant: "destructive" })
        return
      }
      const amountNum = parseFloat(refundAmount)
      if (Number.isNaN(amountNum) || amountNum <= 0) {
        toast({ title: "Enter a valid refund amount", variant: "destructive" })
        return
      }
      if (amountNum > remainingRefundable) {
        toast({ title: "Refund amount exceeds remaining refundable amount", variant: "destructive" })
        return
      }
    }

    try {
      setRefundLoading(true)
      await ordersApi.refundOrder(order.id, {
        amount: isRefundable ? refundAmount : undefined,
        reason: refundReason,
        reason_description: refundReasonDescription,
        notes: refundNotes,
      })
      setShowRefundDialog(false)
      setRefundAmount("")
      setRefundReasonDescription("")
      setRefundNotes("")
      toast({
        title: isAuthorized ? "Authorization voided" : "Refund processed",
      })
    } catch (error: any) {
      const message = error?.response?.data?.detail || "Failed to process refund"
      toast({ title: message, variant: "destructive" })
    } finally {
      setRefundLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!order?.id || !onDelete) return
    setDeleteLoading(true)
    try {
      await onDelete(order.id)
      setShowDeleteDialog(false)
      onOpenChange(false)
      toast({ title: "Order deleted" })
    } catch (error: any) {
      const message = error?.message || "Failed to delete order"
      toast({ title: message, variant: "destructive" })
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!order) return null

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0">
          <SheetHeader className="p-4 sm:p-6 pb-4 border-b pr-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2">
                <SheetTitle className="text-lg sm:text-xl">Order Details</SheetTitle>
                {order.display_id && (
                  <p className="text-sm text-muted-foreground">
                    Order #{order.display_id}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
                  {statusLabels[status] || status}
                </Badge>
                <PermissionGate permission={Permissions.ORDER_DELETE}>
                  <Button size="sm" variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                    Delete
                  </Button>
                </PermissionGate>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="p-4 sm:p-6 space-y-6">
              {/* Patient Information */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Patient Information
                </h3>
                <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                  <InfoItem 
                    icon={<User className="h-4 w-4" />} 
                    label="Name" 
                    value={order.name} 
                  />
                  <InfoItem 
                    icon={<Mail className="h-4 w-4" />} 
                    label="Email" 
                    value={order.email} 
                  />
                  <InfoItem 
                    icon={<Phone className="h-4 w-4" />} 
                    label="Phone" 
                    value={order.phone} 
                  />
                  <InfoItem 
                    icon={<MapPin className="h-4 w-4" />} 
                    label="Address" 
                    value={order.address} 
                    allowWrap
                  />
                  {order.mrn && (
                    <InfoItem 
                      icon={<FileText className="h-4 w-4" />} 
                      label="MRN" 
                      value={order.mrn} 
                    />
                  )}
                </div>
              </section>

              <Separator />

              {/* Order Information */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Order Information
                </h3>
                <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                  <InfoItem 
                    icon={<Calendar className="h-4 w-4" />} 
                    label="Order Date" 
                    value={formatDate(order.orderDate)} 
                  />
                  <InfoItem 
                    icon={<Calendar className="h-4 w-4" />} 
                    label="Date Prescribed" 
                    value={formatDate(order.datePrescribed)} 
                  />
                  <InfoItem 
                    icon={<Calendar className="h-4 w-4" />} 
                    label="Date Printed/Shipped" 
                    value={formatDate(order.datePrintedShipped)} 
                  />
                  <InfoItem 
                    icon={<CreditCard className="h-4 w-4" />} 
                    label="Order Total" 
                    value={order.orderTotal ? `$${order.orderTotal}` : undefined} 
                  />
                </div>
              </section>

              <Separator />

              {/* Payment & Visit Status */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment & Visit Status
                </h3>
                <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                  <InfoItem 
                    icon={<CreditCard className="h-4 w-4" />} 
                    label="Payment Status" 
                    value={order.paymentStatus} 
                  />
                  <InfoItem 
                    icon={<Calendar className="h-4 w-4" />} 
                    label="Payment Date" 
                    value={formatDate(order.paymentDate)} 
                  />
                  <InfoItem 
                    icon={<ClipboardList className="h-4 w-4" />} 
                    label="Visit Status" 
                    value={order.visitStatus} 
                  />
                  {isRefundable && (
                    <InfoItem
                      icon={<CreditCard className="h-4 w-4" />}
                      label="Remaining Refundable"
                      value={`$${remainingRefundable.toFixed(2)}`}
                    />
                  )}
                </div>
                {canRefundOrVoid && (
                  <PermissionGate permission={Permissions.REFUND_CREATE}>
                    <Button
                      className="w-full mt-4"
                      variant="outline"
                      onClick={() => setShowRefundDialog(true)}
                    >
                      {isAuthorized ? "Void Authorization" : "Refund Payment"}
                    </Button>
                  </PermissionGate>
                )}
              </section>

              <Separator />

              {/* Fulfillment */}
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Fulfillment
                </h3>
                <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                  <InfoItem 
                    icon={<Building2 className="h-4 w-4" />} 
                    label="Pharmacy" 
                    value={order.pharmacy_display} 
                    allowWrap
                  />
                  <InfoItem 
                    icon={<Truck className="h-4 w-4" />} 
                    label="Tracking Number" 
                    value={order.tracking_number} 
                  />
                </div>
              </section>

              <Separator />

              {/* Patient Responses Button */}
              <section>
                <Button 
                  onClick={() => setShowPatientResponses(true)}
                  className="w-full"
                  variant="outline"
                  size="lg"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Patient Responses
                </Button>
                {!order.patient_responses && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Questionnaire responses may not be available for all orders.
                  </p>
                )}
              </section>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action permanently deletes the order and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Patient Responses Modal */}
      <PatientResponsesModal
        open={showPatientResponses}
        onOpenChange={setShowPatientResponses}
        patientResponses={order.patient_responses}
        patientName={order.name || "Patient"}
        checkoutUrl={order.checkout_url}
      />

      {/* Refund / Void Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>{isAuthorized ? "Void Authorization" : "Refund Payment"}</DialogTitle>
            <DialogDescription>
              {isAuthorized
                ? "This will cancel the authorization before funds are captured."
                : "Refunds can be partial. The remaining refundable amount will update after processing."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isRefundable && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Refund Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remainingRefundable}
                  placeholder="0.00"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Remaining refundable: ${remainingRefundable.toFixed(2)}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Select value={refundReason} onValueChange={setRefundReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {refundReasonOptions.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason Description</label>
              <Textarea
                rows={3}
                placeholder="Add details (optional)"
                value={refundReasonDescription}
                onChange={(e) => setRefundReasonDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Internal Notes</label>
              <Textarea
                rows={3}
                placeholder="Internal notes (optional)"
                value={refundNotes}
                onChange={(e) => setRefundNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRefundSubmit} disabled={refundLoading}>
                {refundLoading ? "Processing..." : isAuthorized ? "Void Authorization" : "Process Refund"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Helper component for displaying info items
function InfoItem({ 
  icon, 
  label, 
  value,
  allowWrap = false,
}: { 
  icon: React.ReactNode
  label: string
  value?: string | null
  allowWrap?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium ${allowWrap ? 'break-words' : 'truncate sm:break-words'}`}>
          {value || "-"}
        </p>
      </div>
    </div>
  )
}
