import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Order, ordersApi, PrescriptionMedication } from "@/api/ordersApi"
import { PatientResponsesModal } from "@/components/orders/PatientResponsesModal"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Package,
  CreditCard,
  FileText,
  Stethoscope,
  Receipt,
  Pencil,
  Truck,
  ClipboardList,
  Undo2,
} from "lucide-react"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { cn } from "@/lib/utils"

const statusColors: Record<string, string> = {
  created: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  visit_failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  visit_pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  consult_canceled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  referred: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  prescribed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  billing_pending: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  rx_sent: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  shipped: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  canceled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
}

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

type TimelineItem = {
  title: string
  date: string
  description?: string
  icon: "schedule" | "payments" | "prescriptions" | "medical_services" | "local_shipping"
  iconBg: string
}

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPatientResponses, setShowPatientResponses] = useState(false)
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [refundAmount, setRefundAmount] = useState("")
  const [refundReason, setRefundReason] = useState("customer_request")
  const [refundReasonDescription, setRefundReasonDescription] = useState("")
  const [refundNotes, setRefundNotes] = useState("")
  const [refundLoading, setRefundLoading] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [statusTrackingNumber, setStatusTrackingNumber] = useState("")
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false)
  const { toast } = useToast()

  const isUuid = (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

  useEffect(() => {
    if (!orderId) {
      setError("Order ID is required")
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    const fetchFn = isUuid(orderId) ? ordersApi.fetchOrder(orderId) : ordersApi.fetchOrderByOrderId(orderId)
    fetchFn
      .then((data) => {
        if (!cancelled) setOrder(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.detail || "Failed to load order")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [orderId])

  const remainingRefundable = useMemo(() => {
    const amount = order?.refundableAmount ? parseFloat(order.refundableAmount) : 0
    return Number.isNaN(amount) ? 0 : amount
  }, [order?.refundableAmount])

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—"
    try {
      return format(new Date(dateString), "MMM d, yyyy")
    } catch {
      return dateString
    }
  }

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "—"
    try {
      return format(new Date(dateString), "MMM dd, yyyy • h:mm a")
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-6 lg:p-8 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/orders")}>
          Back to Orders
        </Button>
        <p className="text-destructive">{error || "Order not found."}</p>
      </div>
    )
  }

  const status = order.orderStatus || order.status || "created"
  const statusDisplay = statusLabels[status] || status
  const orderTitle = order.order_id ? `#${order.order_id}` : order.display_id ? `#${order.display_id}` : order.id?.slice(0, 8) || ""

  const paymentStatus = (order.paymentStatus || "").toLowerCase()
  const isAuthorized = paymentStatus === "authorized"
  const isRefundable =
    paymentStatus === "captured" ||
    paymentStatus === "approved" ||
    paymentStatus === "succeeded"
  const canRefundOrVoid = isAuthorized || isRefundable

  const refundReasonOptions = [
    { value: "customer_request", label: "Customer Request" },
    { value: "duplicate_charge", label: "Duplicate Charge" },
    { value: "fraud", label: "Fraud" },
    { value: "product_not_received", label: "Product Not Received" },
    { value: "product_defective", label: "Product Defective" },
    { value: "service_not_rendered", label: "Service Not Rendered" },
    { value: "other", label: "Other" },
  ]

  const refetchOrder = () => {
    if (!orderId) return
    const fetchFn = isUuid(orderId) ? ordersApi.fetchOrder(orderId) : ordersApi.fetchOrderByOrderId(orderId)
    fetchFn.then(setOrder).catch(() => {})
  }

  const handleStatusUpdate = async () => {
    if (!order?.id || !newStatus) return
    if (newStatus === 'shipped' && !statusTrackingNumber.trim()) {
      toast({ title: "Tracking number is required for shipped status", variant: "destructive" })
      return
    }
    try {
      setStatusUpdateLoading(true)
      const payload: Partial<Order> = { status: newStatus } as Partial<Order>
      if (newStatus === 'shipped' && statusTrackingNumber.trim()) {
        payload.tracking_number = statusTrackingNumber.trim()
      }
      await ordersApi.updateOrder(order.id, payload)
      setShowStatusDialog(false)
      setNewStatus("")
      setStatusTrackingNumber("")
      toast({ title: `Status updated to ${statusLabels[newStatus] || newStatus}` })
      refetchOrder()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string; detail?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { error?: string; detail?: string } } })?.response?.data?.detail ||
        "Failed to update status"
      toast({ title: message, variant: "destructive" })
    } finally {
      setStatusUpdateLoading(false)
    }
  }

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
      toast({ title: isAuthorized ? "Authorization voided" : "Refund processed" })
      refetchOrder()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Failed to process refund"
      toast({ title: message, variant: "destructive" })
    } finally {
      setRefundLoading(false)
    }
  }

  // Build timeline from order dates (newest first for display, then we reverse to show chronological)
  const timelineItems: TimelineItem[] = []
  if (order.datePrintedShipped) {
    timelineItems.push({
      title: "Order status updated to Rx Sent",
      date: formatDateTime(order.datePrintedShipped),
      description: order.product_name
        ? `Prescription Sent to ${order.pharmacy_display || "Pharmacy"} (${order.product_name}).${order.prescription_medications?.[0]?.rxId ? ` Rx ID: ${order.prescription_medications[0].rxId}.` : ""}`
        : undefined,
      icon: "schedule",
      iconBg: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-4 border-white dark:border-slate-800",
    })
  }
  if (order.paymentDate) {
    const reimbursementParts: string[] = []
    if (order.medication_cost_to_client) reimbursementParts.push(`Medication Cost: ${order.medication_cost_to_client}`)
    if (order.consult_cost_to_client) {
      const consultLabel = order.consult_type === 'sync' ? 'Sync Consult Cost' : 'Async Consult Cost'
      reimbursementParts.push(`${consultLabel}: ${order.consult_cost_to_client}`)
    }
    if (order.shipping_fee_to_client) reimbursementParts.push(`Shipping Fee: ${order.shipping_fee_to_client}`)
    timelineItems.push({
      title: "Order Reimbursement Billing Success",
      date: formatDateTime(order.paymentDate),
      description: reimbursementParts.length > 0
        ? `$${order.orderTotal || '0.00'} (${reimbursementParts.join(', ')})`
        : order.orderTotal ? `$${order.orderTotal}` : undefined,
      icon: "payments",
      iconBg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-4 border-white dark:border-slate-800",
    })
  }
  if (order.datePrescribed) {
    timelineItems.push({
      title: "Product Prescribed",
      date: formatDateTime(order.datePrescribed),
      description: order.product_name || undefined,
      icon: "prescriptions",
      iconBg: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-4 border-white dark:border-slate-800",
    })
  }
  if (order.visitStatus || order.treatment_type) {
    timelineItems.push({
      title: "Followup Visit Created",
      date: formatDateTime(order.orderDate),
      description: order.provider_network ? `Provider: ${order.provider_network}` : undefined,
      icon: "medical_services",
      iconBg: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-4 border-white dark:border-slate-800",
    })
  }
  timelineItems.push({
    title: "Order placed via questionnaire",
    date: formatDateTime(order.orderDate),
    icon: "local_shipping",
    iconBg: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-4 border-white dark:border-slate-800",
  })
  timelineItems.reverse()

  const qty = order.prescription_medications?.[0]?.quantity ?? "1"
  const parseMoney = (value?: string | number | null): number | null => {
    if (value === null || value === undefined || value === "") return null
    const parsed = Number.parseFloat(String(value))
    return Number.isFinite(parsed) ? parsed : null
  }
  const formatMoney = (value?: number | null): string => {
    if (value === null || value === undefined || Number.isNaN(value)) return "0.00"
    return value.toFixed(2)
  }

  const quantityRaw = Number.parseFloat(String(qty))
  const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? quantityRaw : 1
  const originalPrice = parseMoney(order.original_price)
  const shippingFee = parseMoney(order.shipping_fee)
  const discountAmount = parseMoney(order.discount_amount) ?? 0
  const totalAmount = parseMoney(order.orderTotal ?? order.amount)
  const refundedAmount = parseMoney(order.totalRefunded) ?? 0
  const netTotalAmount =
    totalAmount != null
      ? Math.max(0, totalAmount - refundedAmount)
      : null
  const refundStatusLabel =
    refundedAmount > 0
      ? totalAmount != null && refundedAmount >= totalAmount
        ? "Refunded"
        : "Partially Refunded"
      : null
  const productSubtotalAfterDiscount =
    originalPrice != null
      ? Math.max(0, originalPrice - discountAmount)
      : totalAmount != null && shippingFee != null
        ? Math.max(0, totalAmount - shippingFee)
        : totalAmount
  const originalUnitPrice =
    originalPrice != null
      ? originalPrice / quantity
      : null
  const discountPerUnit = discountAmount > 0 ? discountAmount / quantity : 0
  const itemUnitPrice =
    productSubtotalAfterDiscount != null
      ? productSubtotalAfterDiscount / quantity
      : null
  const hasBreakdown = originalPrice != null || shippingFee != null || discountAmount > 0
  const itemPrice = formatMoney(itemUnitPrice)
  const lineTotalPrice = formatMoney(productSubtotalAfterDiscount)
  const totalPrice = formatMoney(totalAmount)
  const netTotalPrice = formatMoney(netTotalAmount)

  const TimelineIcon = ({ name, iconBg }: { name: TimelineItem["icon"]; iconBg: string }) => {
    const iconMap = {
      schedule: Calendar,
      payments: CreditCard,
      prescriptions: FileText,
      medical_services: Stethoscope,
      local_shipping: Truck,
    }
    const Icon = iconMap[name] || FileText
    return (
      <div className={cn("h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center z-10", iconBg)}>
        <Icon className="h-5 w-5" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Breadcrumbs & Title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Breadcrumb className="mb-1">
            <BreadcrumbList className="text-sm text-slate-500 dark:text-slate-400">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard/orders" className="hover:text-slate-700 dark:hover:text-slate-300">
                    Orders
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-slate-400">/</BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-slate-900 dark:text-white font-medium">
                  Order Details
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Order {orderTitle}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Product Details */}
          <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 dark:text-white">Product Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-slate-500 dark:text-slate-400 font-medium border-b">
                  <tr>
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3 text-right">
                      <div className="flex flex-col items-end leading-tight">
                        <span>Item Price</span>
                        <span className="text-[11px] font-normal text-slate-400">After discount</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right">
                      <div className="flex flex-col items-end leading-tight">
                        <span>Quantity</span>
                        <span className="text-[11px] font-normal text-slate-400">Items</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right">
                      <div className="flex flex-col items-end leading-tight">
                        <span>Total</span>
                        <span className="text-[11px] font-normal text-slate-400">Excl. shipping</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          <Package className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {order.product_name || "—"}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {order.prescription_medications?.[0]?.strength
                              ? `${order.prescription_medications[0].strength}`
                              : order.treatment_type || ""}
                          </p>
                          {order.provider_network && (
                            <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              {order.provider_network}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right align-top text-slate-600 dark:text-slate-300">
                      <div className="flex flex-col items-end">
                        {discountAmount > 0 && originalUnitPrice != null && (
                          <span className="text-xs text-slate-400 line-through">
                            ${formatMoney(originalUnitPrice)}
                          </span>
                        )}
                        <span>${itemPrice}</span>
                        {discountAmount > 0 && (
                          <span className="text-[11px] text-green-600 dark:text-green-400 font-medium">
                            Save ${formatMoney(discountPerUnit)} / unit
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right align-top text-slate-600 dark:text-slate-300">
                      {qty}
                    </td>
                    <td className="px-6 py-4 text-right align-top font-medium text-slate-900 dark:text-white">
                      <div className="flex flex-col items-end">
                        <span>${lineTotalPrice}</span>
                        <span className="text-[11px] font-normal text-slate-400">Excl. shipping</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-muted/30">
                  {hasBreakdown && originalPrice != null && (
                    <tr>
                      <td className="px-6 py-3 text-right text-slate-500 dark:text-slate-400" colSpan={3}>
                        Product list price:
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-slate-900 dark:text-white">
                        ${originalPrice.toFixed(2)}
                      </td>
                    </tr>
                  )}
                  {discountAmount > 0 && (
                    <tr>
                      <td className="px-6 py-3 text-right text-slate-500 dark:text-slate-400" colSpan={2}>
                        Product discount:
                      </td>
                      <td className="px-6 py-3 text-right text-slate-500 dark:text-slate-400">
                        {order.coupon_code || "—"}
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-green-600 dark:text-green-400">
                        −${discountAmount.toFixed(2)}
                      </td>
                    </tr>
                  )}
                  {productSubtotalAfterDiscount != null && (
                    <tr>
                      <td className="px-6 py-3 text-right text-slate-500 dark:text-slate-400" colSpan={3}>
                        Product subtotal:
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-slate-900 dark:text-white">
                        ${lineTotalPrice}
                      </td>
                    </tr>
                  )}
                  {hasBreakdown && shippingFee != null && (
                    <tr>
                      <td className="px-6 py-3 text-right text-slate-500 dark:text-slate-400" colSpan={3}>
                        Shipping:
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-slate-900 dark:text-white">
                        ${shippingFee.toFixed(2)}
                      </td>
                    </tr>
                  )}
                  {!hasBreakdown && (
                    <tr>
                      <td className="px-6 py-3 text-right text-slate-500 dark:text-slate-400" colSpan={3}>
                        Product subtotal:
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-slate-900 dark:text-white">
                        ${totalPrice}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td
                      className="px-6 py-3 text-right font-bold text-slate-900 dark:text-white border-t border-border"
                      colSpan={3}
                    >
                      {refundedAmount > 0 ? "Net Total (USD):" : "Total (USD):"}
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-primary border-t border-border">
                      <div className="flex flex-col items-end">
                        <span>${netTotalPrice}</span>
                        <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                          Product + shipping
                        </span>
                      </div>
                    </td>
                  </tr>
                  {refundedAmount > 0 && (
                    <tr>
                      <td className="px-6 py-3 text-right text-slate-500 dark:text-slate-400" colSpan={3}>
                        Refunded:
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-red-600 dark:text-red-400">
                        −${refundedAmount.toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          </div>

          {/* Order Status */}
          <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-slate-900 dark:text-white">Order Status</h3>
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                    statusColors[status] || "bg-slate-100 text-slate-700 border-slate-200"
                  )}
                >
                  {statusDisplay.toUpperCase().replace(/_/g, " ")}
                </span>
              </div>
              <button
                className="text-sm text-slate-500 hover:text-primary flex items-center gap-1"
                onClick={() => {
                  setNewStatus(status)
                  setStatusTrackingNumber(order.tracking_number || "")
                  setShowStatusDialog(true)
                }}
              >
                <Pencil className="h-4 w-4" /> Update Status
              </button>
            </div>
            <div className="p-6">
              <div className="relative pl-4">
                <div className="absolute left-[19px] top-2 bottom-4 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="space-y-8">
                  {timelineItems.map((item, idx) => (
                    <div key={idx} className="relative flex gap-4">
                      <TimelineIcon name={item.icon} iconBg={item.iconBg} />
                      <div className="flex-1 pt-1">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                          <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                          <span className="text-xs text-slate-400 whitespace-nowrap">{item.date}</span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Visit Details */}
          <div className="bg-card rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                Visit Details
              </h3>
              <Button size="sm" variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 text-xs">
                Track
              </Button>
            </div>
            <div className="flex items-start gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white">
                  {order.provider_network || "Medical Network"}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Provider: <span className="text-slate-700 dark:text-slate-300">{order.doctor_name || order.provider_network || "—"}</span>
                </p>
              </div>
            </div>
            {(order.mrn || order.visitStatus) && (
              <div className="p-3 bg-muted/50 rounded-lg border">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Master ID</p>
                <p className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all">
                  {order.mrn || order.visitStatus || "—"}
                </p>
              </div>
            )}
          </div>

          {/* Patient Details */}
          <div className="bg-card rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">Patient Details</h3>
              <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => setShowPatientResponses(true)}>
                View Patient Responses
              </Button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700">
                <AvatarFallback className="text-slate-600 dark:text-slate-300 font-bold text-sm">
                  {(order.name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{order.name || "—"}</p>
                <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[10px] rounded">
                  Email Login Details
                </span>
              </div>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                <Mail className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <span className="truncate">{order.email || "—"}</span>
              </li>
              <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                <Phone className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <span>{order.phone || "—"}</span>
              </li>
              <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <span>{order.address || "—"}</span>
              </li>
            </ul>
          </div>

          {/* Support Notes */}
          <div className="bg-card rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-slate-400" />
                Support Notes
              </h3>
              <Button size="sm" variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] h-7">
                Add New
              </Button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              {order.notes || "No notes found."}
            </p>
          </div>

          {/* Shipping Address */}
          <div className="bg-card rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-slate-400" />
              Shipping Address
            </h3>
            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-medium text-slate-900 dark:text-white">{order.name || "—"}</p>
              <p>{order.phone || "—"}</p>
              <p>{order.shipping_address || order.address || "—"}</p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-card rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-slate-400" />
              Payment Info
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Date</span>
                <span className="text-slate-900 dark:text-white font-medium">{formatDate(order.paymentDate) || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Provider</span>
                <span className="text-slate-900 dark:text-white font-medium">{order.paymentProcessor || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Trans ID</span>
                <span className="text-slate-900 dark:text-white font-mono text-xs">{order.paymentTransactionId || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Status</span>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 dark:text-green-400 font-medium text-xs bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">
                    {order.paymentStatus || "—"}
                  </span>
                  {refundStatusLabel && (
                    <span className="text-red-600 dark:text-red-300 font-medium text-xs bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
                      {refundStatusLabel}
                    </span>
                  )}
                </div>
              </div>
              {refundedAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Refunded</span>
                  <span className="text-red-600 dark:text-red-400 font-medium">-${refundedAmount.toFixed(2)}</span>
                </div>
              )}
              {refundedAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Net Collected</span>
                  <span className="text-slate-900 dark:text-white font-medium">${netTotalPrice}</span>
                </div>
              )}
              <div className="pt-3 border-t border-border flex justify-between items-center mt-2">
                <span className="text-slate-900 dark:text-white font-bold">Amount</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 dark:text-white font-bold">${netTotalPrice}</span>
                  {canRefundOrVoid && (
                    <PermissionGate permission={Permissions.REFUND_CREATE}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-6 border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400"
                        onClick={() => setShowRefundDialog(true)}
                      >
                        <Undo2 className="h-3 w-3 mr-1" /> Refund
                      </Button>
                    </PermissionGate>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      {/* Update Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change the status of this order. Some transitions may be irreversible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newStatus === "shipped" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Tracking Number</label>
                <Input
                  placeholder="Enter tracking number"
                  value={statusTrackingNumber}
                  onChange={(e) => setStatusTrackingNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Required when setting status to Shipped.
                </p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate} disabled={statusUpdateLoading || !newStatus}>
                {statusUpdateLoading ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PatientResponsesModal
        open={showPatientResponses}
        onOpenChange={setShowPatientResponses}
        patientResponses={order.patient_responses}
        patientName={order.name || "Patient"}
        checkoutUrl={order.checkout_url}
        orderId={order.id}
        onImagesSaved={(photos) => {
          setOrder((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              patient_responses: {
                ...(prev.patient_responses || {}),
                photos,
              },
            }
          })
        }}
      />
    </div>
  )
}
