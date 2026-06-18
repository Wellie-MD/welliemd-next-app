import { ChangeProductModal, PendingProductChange } from "@/components/orders/ChangeProductModal"
import { useState, useEffect, useMemo, useRef } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Order, ordersApi } from "@/api/ordersApi"
import { paymentGatewayApi } from "@/api/paymentGatewayApi"
import { patientPaymentMethodsApi, PatientPaymentMethod, PatientPaymentGateway } from "@/api/patientPaymentMethodsApi"
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
  RotateCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { Permissions } from "@/constants/permissions"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useClientMessages } from "@/contexts/MessagesContext"

const statusColors: Record<string, string> = {
  created: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  visit_failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  payment_pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  visit_pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  consult_scheduled: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800",
  consult_rescheduled: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  consult_canceled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  no_show: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  referred: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  prescribed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  billing_pending: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  rx_sent: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  in_fulfillment: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  shipped: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  delivered: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800",
  canceled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
}

const statusLabels: Record<string, string> = {
  created: "Created",
  processing: "Processing",
  visit_failed: "Visit Failed",
  payment_pending: "Payment Pending",
  visit_pending: "Visit Pending",
  consult_scheduled: "Consult Scheduled",
  consult_rescheduled: "Consult Rescheduled",
  consult_canceled: "Consult Canceled",
  no_show: "No Show",
  referred: "Referred",
  prescribed: "Prescribed",
  billing_pending: "Billing Pending",
  rx_sent: "Rx Sent",
  in_fulfillment: "In Fulfillment",
  shipped: "Shipped",
  delivered: "Delivered",
  canceled: "Canceled",
}

const getStatusIcon = (status: string) => {
  const s = (status || "").toLowerCase()
  if (s.includes("shipped") || s.includes("delivered") || s.includes("fulfillment")) return <Truck className="h-3.5 w-3.5" />
  if (s.includes("prescribed") || s.includes("rx_sent") || s.includes("referred")) return <Stethoscope className="h-3.5 w-3.5" />
  if (s.includes("scheduled") || s.includes("rescheduled")) return <Calendar className="h-3.5 w-3.5" />
  if (s.includes("failed") || s.includes("cancel") || s.includes("no_show")) return <XCircle className="h-3.5 w-3.5" />
  if (s.includes("pending") || s.includes("billing")) return <AlertCircle className="h-3.5 w-3.5" />
  if (s.includes("captured") || s.includes("completed") || s.includes("refunded")) return <CheckCircle2 className="h-3.5 w-3.5" />
  return <RotateCw className="h-3.5 w-3.5" />
}

const recoveryStatusColors: Record<string, string> = {
  recovery_pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
}

const recoveryStatusLabels: Record<string, string> = {
  recovery_pending: "Recovery Pending",
}

type TimelineItem = {
  title: string
  date: string
  description?: string
  icon: "schedule" | "payments" | "prescriptions" | "medical_services" | "local_shipping"
  iconBg: string
  actions?: Array<{ label: string; url: string }>
}

const normalizeGateway = (value?: string | null): PatientPaymentGateway | null => {
  if (!value) return null
  const normalized = value.toLowerCase()
  if (normalized.includes("authorize")) return "authorize_net"
  if (normalized.includes("stripe")) return "stripe"
  if (normalized.includes("nmi")) return "nmi"
  return null
}

const gatewayLabel = (gateway: PatientPaymentGateway | null) => {
  if (gateway === "authorize_net") return "Authorize.Net"
  if (gateway === "nmi") return "NMI"
  if (gateway === "stripe") return "Stripe"
  return "payment gateway"
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
  const [showChangeProductModal, setShowChangeProductModal] = useState(false)
  const [pendingProductChange, setPendingProductChange] = useState<PendingProductChange | null>(null)
  const [updateOrderLoading, setUpdateOrderLoading] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [statusTrackingNumber, setStatusTrackingNumber] = useState("")
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false)
  const [showRetryPaymentDialog, setShowRetryPaymentDialog] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PatientPaymentMethod[]>([])
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false)
  const [paymentMethodsError, setPaymentMethodsError] = useState<string | null>(null)
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("")
  const [retryPaymentLoading, setRetryPaymentLoading] = useState(false)
  const [sendCheckoutLinkLoading, setSendCheckoutLinkLoading] = useState(false)
  const retrySingleFlightRef = useRef(false)
  const [retryGateway, setRetryGateway] = useState<PatientPaymentGateway | null>(null)
  const { toast } = useToast()
  const { messages, loading: messagesLoading } = useClientMessages()
  const patientUserId = order?.patient?.user_id
  const orderThreadMasterId = order?.mrn?.trim() || ""
  const hasExistingThread = Boolean(
    orderThreadMasterId && messages.some((message) => message.master_id === orderThreadMasterId)
  )

  const isUuid = (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

  const handleTrackThread = () => {
    if (!orderThreadMasterId) {
      toast({
        title: "Chat thread unavailable",
        description: "This order does not have a visit thread yet.",
        variant: "destructive",
      })
      return
    }
    if (messagesLoading) {
      toast({
        title: "Checking chat thread",
        description: "Please try again in a moment.",
      })
      return
    }
    if (!hasExistingThread) {
      toast({
        title: "No chat found",
        description: "No conversation exists for this order yet.",
        variant: "destructive",
      })
      return
    }
    navigate(`/dashboard/messages?master_id=${encodeURIComponent(orderThreadMasterId)}`)
  }

  const handleSendCheckoutLink = async () => {
    if (!order?.id || sendCheckoutLinkLoading) return

    try {
      setSendCheckoutLinkLoading(true)
      const response = await ordersApi.sendCheckoutLink(order.id)
      toast({
        title: response.message || "Checkout link email processed.",
      })
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string; error?: string; detail?: string } } })?.response?.data?.message ||
        (err as { response?: { data?: { message?: string; error?: string; detail?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { message?: string; error?: string; detail?: string } } })?.response?.data?.detail ||
        "Failed to send checkout link email."
      toast({
        title: message,
        variant: "destructive",
      })
    } finally {
      setSendCheckoutLinkLoading(false)
    }
  }

  useEffect(() => {
    if (!orderId) {
      setError("Order ID is required")
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    const fetchFn = isUuid(orderId)
      ? ordersApi.fetchOrder(orderId, true)
      : ordersApi.fetchOrderByOrderId(orderId, true)
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

  const appliedCouponCodes = useMemo(() => {
    if (!order) return ""

    const fromOrderField = (order.coupon_code || "").trim()
    const data = order as unknown as Record<string, unknown>
    const codes = new Set<string>()

    if (fromOrderField) {
      codes.add(fromOrderField)
    }

    const couponObj = data.coupon as { code?: string } | undefined
    if (couponObj?.code?.trim()) {
      codes.add(couponObj.code.trim())
    }

    const couponCodes = data.coupon_codes
    if (Array.isArray(couponCodes)) {
      couponCodes.forEach((code) => {
        if (typeof code === "string" && code.trim()) {
          codes.add(code.trim())
        }
      })
    }

    const appliedCoupons = data.applied_coupons
    if (Array.isArray(appliedCoupons)) {
      appliedCoupons.forEach((coupon) => {
        if (typeof coupon === "string" && coupon.trim()) {
          codes.add(coupon.trim())
          return
        }
        if (
          coupon &&
          typeof coupon === "object" &&
          "code" in coupon &&
          typeof (coupon as { code?: unknown }).code === "string"
        ) {
          const code = ((coupon as { code?: string }).code || "").trim()
          if (code) {
            codes.add(code)
          }
        }
      })
    }

    return Array.from(codes).join(", ")
  }, [order])

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

  const formatBookingSchedule = (dateString?: string | null) => {
    if (!dateString) return "—"
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a")
    } catch {
      return dateString
    }
  }

  useEffect(() => {
    if (!showRetryPaymentDialog) {
      setPaymentMethods([])
      setPaymentMethodsError(null)
      setSelectedPaymentMethodId("")
      setRetryGateway(null)
      setPaymentMethodsLoading(false)
      return
    }

    if (!order) return
    let cancelled = false

    const loadPaymentMethods = async () => {
      setPaymentMethodsLoading(true)
      setPaymentMethodsError(null)
      setPaymentMethods([])
      setSelectedPaymentMethodId("")

      let resolvedGateway = normalizeGateway(order.paymentProcessor)
      try {
        const config = await paymentGatewayApi.getConfig()
        const configGateway = normalizeGateway(config?.payment_config?.payment_gateway)
        resolvedGateway = configGateway || resolvedGateway
      } catch {
        // Ignore config lookup failures; fallback to order processor.
      }

      if (!resolvedGateway) {
        if (!cancelled) {
          setPaymentMethodsError("Unable to determine payment gateway for retry.")
          setRetryGateway(null)
          setPaymentMethodsLoading(false)
        }
        return
      }

      if (!patientUserId) {
        if (!cancelled) {
          setPaymentMethodsError("Patient profile is missing a user ID.")
          setRetryGateway(resolvedGateway)
          setPaymentMethodsLoading(false)
        }
        return
      }

      if (!cancelled) {
        setRetryGateway(resolvedGateway)
      }

      try {
        const methods = await patientPaymentMethodsApi.listPaymentMethods(resolvedGateway, patientUserId)
        if (cancelled) return
        setPaymentMethods(methods)
        const defaultMethod = methods.find((method) => method.is_default) || methods[0]
        setSelectedPaymentMethodId(defaultMethod?.id || "")
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
            "Failed to load saved payment methods"
          setPaymentMethodsError(message)
        }
      } finally {
        if (!cancelled) {
          setPaymentMethodsLoading(false)
        }
      }
    }

    loadPaymentMethods()
    return () => { cancelled = true }
  }, [showRetryPaymentDialog, order, patientUserId])

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
  const isPrescribedStatus = String(status || "").toLowerCase() === "prescribed"
  const statusDisplay = statusLabels[status] || status
  const orderTitle = order.order_id ? `#${order.order_id}` : order.display_id ? `#${order.display_id}` : order.id?.slice(0, 8) || ""
  const paymentRecoveryState = (order.payment_recovery_state || "").toLowerCase()
  const paymentRecoveryLabel = isPrescribedStatus && paymentRecoveryState
    ? (recoveryStatusLabels[paymentRecoveryState] || paymentRecoveryState)
    : null

  const paymentStatus = (order.paymentStatus || "").toLowerCase()
  const settlementState = (order.payment_settlement_state || "").toLowerCase()
  const isAuthorized = paymentStatus === "authorized"
  const isRefundable =
    paymentStatus === "captured" ||
    paymentStatus === "approved" ||
    paymentStatus === "succeeded"
  const isLocked = isAuthorized || isRefundable
  const isPending = paymentStatus === "pending" || !paymentStatus
  const paymentCaptured = isRefundable || settlementState === "captured"
  const retryablePaymentStatuses = [
    "declined",
    "error",
    "failed",
    "voided",
    "canceled",
    "cancelled",
    "non_capturable",
    "non-capturable",
  ]
  const isPaymentFailure = retryablePaymentStatuses.includes(paymentStatus)
  const isSettlementRetryable = ["failed", "pending"].includes(settlementState)
  const isOrderPaymentPending = status === "payment_pending"
  const baseRetryEligibility =
    !paymentCaptured && (isPaymentFailure || isSettlementRetryable || isOrderPaymentPending)
  const isAllowedStatus = status === "created" || status === "payment_pending"
  const canChangeProduct = isAllowedStatus && !isLocked
  const canRefundOrVoid = isAuthorized || isRefundable
  const changeProductTooltip =
    "Product change is available only while order status is Created or Payment Pending and payment status is Pending."

  const refundReasonOptions = [
    { value: "customer_request", label: "Customer Request" },
    { value: "duplicate_charge", label: "Duplicate Charge" },
    { value: "fraud", label: "Fraud" },
    { value: "product_not_received", label: "Product Not Received" },
    { value: "product_defective", label: "Product Defective" },
    { value: "service_not_rendered", label: "Service Not Rendered" },
    { value: "other", label: "Other" },
  ]

  const refetchOrder = async (forceFresh = true): Promise<void> => {
    if (!orderId) return
    const fetchFn = isUuid(orderId)
      ? ordersApi.fetchOrder(orderId, forceFresh)
      : ordersApi.fetchOrderByOrderId(orderId, forceFresh)
    try {
      const fresh = await fetchFn
      setOrder(fresh)
    } catch {
      // no-op: best-effort refresh
    }
  }

  const refetchOrderWithRetries = async (): Promise<void> => {
    await refetchOrder(true)
    const delays = [800, 1800, 3200]
    for (const delayMs of delays) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      await refetchOrder(true)
    }
  }

  const handleUpdateOrder = async () => {
    if (!order?.id || !pendingProductChange) return
    if (!canChangeProduct) {
      toast({
        title: "Product change is locked once payment is authorized or order is no longer Created.",
        variant: "destructive",
      })
      return
    }
    try {
      setUpdateOrderLoading(true)
      const updated = await ordersApi.changeProduct(
        order.id,
        pendingProductChange.productId,
        quantity,
      )
      setOrder(updated)
      setPendingProductChange(null)
      toast({ title: "Order updated successfully" })
      await refetchOrderWithRetries()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Failed to update order"
      toast({ title: message, variant: "destructive" })
    } finally {
      setUpdateOrderLoading(false)
    }
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
      await refetchOrderWithRetries()
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
      await refetchOrderWithRetries()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Failed to process refund"
      toast({ title: message, variant: "destructive" })
    } finally {
      setRefundLoading(false)
    }
  }

  const handleRetryPayment = async () => {
    if (retrySingleFlightRef.current || retryPaymentLoading) {
      return
    }
    if (!order?.id) return
    if (!selectedPaymentMethodId) {
      toast({ title: "Select a payment method to retry.", variant: "destructive" })
      return
    }
    const normalizeRetryErrorMessage = (raw?: string) => {
      const msg = String(raw || "").trim()
      const lowered = msg.toLowerCase()
      if (
        lowered.includes("thank you") ||
        lowered.includes("your request has been received") ||
        lowered.includes("request has been received") ||
        lowered.includes("fraud review") ||
        lowered.includes("held for review") ||
        lowered.includes("review")
      ) {
        return "Authorize.Net has placed this transaction under fraud review. The payment is not settled yet."
      }
      if (lowered.includes("supplemental_recovery_in_progress")) {
        return "A supplemental recovery charge is already in progress. Please wait for the latest gateway outcome before retrying again."
      }
      return msg || "Retry payment failed"
    }
    try {
      retrySingleFlightRef.current = true
      setRetryPaymentLoading(true)
      const result = await ordersApi.retryPayment(order.id, {
        saved_payment_method_id: selectedPaymentMethodId,
      })
      const responseMessage =
        String(result.error || result.detail || result.message || "").trim()
      if (!result.success) {
        toast({ title: normalizeRetryErrorMessage(responseMessage), variant: "destructive" })
        return
      }
      const txStatus = String(result.transaction_status || "").toLowerCase()
      const settledStatuses = new Set(["approved", "captured", "succeeded"])
      const settlementState = String(result.payment_settlement_state || "").toLowerCase()
      if (
        normalizeRetryErrorMessage(responseMessage) !== responseMessage ||
        (txStatus && !settledStatuses.has(txStatus)) ||
        settlementState !== "captured"
      ) {
        toast({
          title:
            normalizeRetryErrorMessage(responseMessage) !== responseMessage
              ? normalizeRetryErrorMessage(responseMessage)
              : `Retry submitted, but payment not settled yet (status: ${txStatus || "unknown"}).`,
          variant: "destructive",
        })
        await refetchOrderWithRetries()
        return
      }
      toast({ title: "Payment retry completed successfully." })
      setShowRetryPaymentDialog(false)
      await refetchOrderWithRetries()
    } catch (err: unknown) {
      if (orderId) {
        try {
          const refreshed = await (isUuid(orderId)
            ? ordersApi.fetchOrder(orderId, true)
            : ordersApi.fetchOrderByOrderId(orderId, true))
          setOrder(refreshed)
          if (String(refreshed.payment_settlement_state || "").toLowerCase() === "captured") {
            toast({ title: "Payment retry completed successfully." })
            setShowRetryPaymentDialog(false)
            return
          }
        } catch {
          // Keep the original retry error below; this refresh is only a reconciliation check.
        }
      }
      const message =
        (err as { response?: { data?: { error?: string; detail?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { error?: string; detail?: string } } })?.response?.data?.detail ||
        "Retry payment failed"
      toast({ title: normalizeRetryErrorMessage(message), variant: "destructive" })
    } finally {
      setRetryPaymentLoading(false)
      retrySingleFlightRef.current = false
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
    const normalizedPaymentStatus = (order.paymentStatus || "").toLowerCase()
    let paymentTitle = "Payment Updated"
    if (normalizedPaymentStatus === "authorized") paymentTitle = "Patient Payment Authorized"
    else if (["captured", "approved", "succeeded"].includes(normalizedPaymentStatus)) paymentTitle = "Patient Payment Captured"
    else if (["failed", "declined", "error"].includes(normalizedPaymentStatus)) paymentTitle = "Patient Payment Failed"
    else if (normalizedPaymentStatus === "voided") paymentTitle = "Patient Authorization Voided"
    else if (normalizedPaymentStatus === "refunded") paymentTitle = "Patient Payment Refunded"

    timelineItems.push({
      title: paymentTitle,
      date: formatDateTime(order.paymentDate),
      description: (order.pricing?.grand_total || order.grand_total || order.payable_amount || order.orderTotal || order.amount)
        ? `$${order.pricing?.grand_total || order.grand_total || order.payable_amount || order.orderTotal || order.amount}`
        : undefined,
      icon: "payments",
      iconBg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-4 border-white dark:border-slate-800",
    })
  }
  if (order.status === 'consult_rescheduled') {
    timelineItems.push({
      title: "Consult Rescheduled",
      date: formatDateTime(order.booking_scheduled_at || order.updated_at),
      description: order.booking_location ? `Location: ${order.booking_location}` : "Appointment time updated.",
      icon: "schedule",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-4 border-white dark:border-slate-800",
    })
  } else if (order.status === 'consult_scheduled' || order.booking_scheduled_at) {
    timelineItems.push({
      title: "Consult Scheduled",
      date: formatDateTime(order.booking_scheduled_at || order.updated_at),
      description: order.booking_location ? `Location: ${order.booking_location}` : "Appointment confirmed.",
      icon: "schedule",
      iconBg: "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 border-4 border-white dark:border-slate-800",
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
  if (order.visitStatus || order.mrn) {
    timelineItems.push({
      title: "Visit Created",
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

  const eventTimelineItems: TimelineItem[] = Array.isArray(order.activity_events)
    ? order.activity_events.map((evt) => {
        const payload = (evt.payload && typeof evt.payload === "object") ? evt.payload as Record<string, unknown> : {}
        const status = (evt.status || "").toLowerCase()
        const eventType = (evt.event_type || "").toLowerCase()
        let icon: TimelineItem["icon"] = "schedule"
        let iconBg = "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-4 border-white dark:border-slate-800"
        if (status.includes("payment") || eventType.includes("payment")) {
          icon = "payments"
          iconBg = "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-4 border-white dark:border-slate-800"
        } else if (eventType.startsWith("lab.") || eventType.includes("lab_")) {
          icon = "medical_services"
          iconBg = "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-4 border-white dark:border-slate-800"
        } else if (status === "prescribed" || status === "rx_sent" || status === "referred") {
          icon = "prescriptions"
          iconBg = "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-4 border-white dark:border-slate-800"
        } else if (
          status === "visit_pending" ||
          status === "visit_failed" ||
          status === "consult_scheduled" ||
          status === "consult_rescheduled"
        ) {
          icon = "medical_services"
          iconBg = "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border-4 border-white dark:border-slate-800"
        } else if (status === "in_fulfillment" || eventType.includes("in_fulfillment")) {
          icon = "local_shipping"
          iconBg = "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-4 border-white dark:border-slate-800"
        } else if (status === "shipped") {
          icon = "local_shipping"
          iconBg = "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-4 border-white dark:border-slate-800"
        } else if (status === "delivered" || eventType.includes("delivered")) {
          icon = "local_shipping"
          iconBg = "bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border-4 border-white dark:border-slate-800"
        } else if (status.includes("cancel") || status.includes("no_show")) {
          icon = "schedule"
          iconBg = "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-4 border-white dark:border-slate-800"
        } else if (status.includes("processing") || status.includes("created")) {
          icon = "schedule"
          iconBg = "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-4 border-white dark:border-slate-800"
        }

        const toUrl = (raw: unknown): string | null => {
          if (typeof raw !== "string") return null
          const trimmed = raw.trim()
          if (!trimmed) return null
          if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:application/pdf;base64,")) return trimmed
          return null
        }
        const info = payload.info && typeof payload.info === "object" ? payload.info as Record<string, unknown> : {}
        const pick = (obj: Record<string, unknown>, ...keys: string[]): string | null => {
          for (const key of keys) {
            const value = obj[key]
            if (typeof value === "string" && value.trim()) return value.trim()
          }
          return null
        }

        const rawLabReqPdf = pick(payload, "labReqPdf")
        const requisitionFromPdf = rawLabReqPdf && !rawLabReqPdf.startsWith("http") && !rawLabReqPdf.startsWith("data:")
          ? `data:application/pdf;base64,${rawLabReqPdf}`
          : toUrl(rawLabReqPdf)

        const requisitionUrl =
          toUrl(payload.requisition_pdf_url) ||
          toUrl(payload.requisition_url) ||
          toUrl(payload.requisition_link) ||
          requisitionFromPdf

        const bookingUrl =
          toUrl(payload.booking_link) ||
          toUrl(payload.booking_url) ||
          toUrl(payload.result_booking_link) ||
          toUrl(payload.result_booking_url) ||
          toUrl(payload.bookingLink)

        const trackingUrl =
          toUrl(payload.tracking_url) ||
          toUrl(payload.tracking_link) ||
          toUrl(payload.tracking_link_url) ||
          toUrl(payload.trackingUrl) ||
          (
            payload.info && typeof payload.info === "object"
              ? toUrl((payload.info as Record<string, unknown>).trackingUrl) ||
                toUrl((payload.info as Record<string, unknown>).tracking_url)
              : null
          )
        const trackingNumber =
          pick(payload, "trackingNumber", "tracking") ||
          pick(info, "tracking")
        const carrier =
          pick(payload, "carrier") ||
          pick(info, "carrier")

        const actions: Array<{ label: string; url: string }> = []
        if (requisitionUrl) actions.push({ label: "Requisition", url: requisitionUrl })
        if (bookingUrl) actions.push({ label: "Book", url: bookingUrl })
        if (trackingUrl) actions.push({ label: "Track", url: trackingUrl })
        else if (trackingNumber) {
          const carrierLower = (carrier || "").toLowerCase()
          const fallbackTrackingUrl = carrierLower.includes("fedex")
            ? `https://www.fedex.com/en-us/tracking.html?tracknumbers=${encodeURIComponent(trackingNumber)}`
            : carrierLower.includes("ups")
              ? `https://www.ups.com/track?tracknum=${encodeURIComponent(trackingNumber)}`
              : `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(trackingNumber)}`
          actions.push({ label: carrier ? `Track ${carrier}` : "Track", url: fallbackTrackingUrl })
        }
        const resultPdfUrl = toUrl(payload.resultPdfUrl) || toUrl(payload.result_pdf_url)
        if (resultPdfUrl) actions.push({ label: "Report", url: resultPdfUrl })

        const labDescription = (() => {
          if (!(eventType.startsWith("lab.") || eventType.includes("lab_"))) return undefined
          if (eventType.includes("results")) {
            return pick(payload, "resultSummary", "testResult") || evt.description || "Lab results are available."
          }
          if (eventType.includes("shipped_to_patient") || eventType.includes("shipped-to-patient") || eventType.includes("shipped_to_lab") || eventType.includes("shipped-to-lab")) {
            const tracking = trackingNumber
            if (carrier && tracking) return `Carrier: ${carrier} • Tracking: ${tracking}`
            if (carrier) return `Carrier: ${carrier}`
            if (tracking) return `Tracking: ${tracking}`
            return "Shipment update received from lab."
          }
          if (eventType.includes("delivered_to_patient") || eventType.includes("delivered-to-patient")) {
            const proof = pick(payload, "deliveryProof")
            return proof ? `Delivery proof: ${proof.replaceAll("_", " ")}` : "Lab kit delivered to patient."
          }
          if (eventType.includes("received_by_lab") || eventType.includes("received-by-lab")) {
            const specimen = payload.specimen && typeof payload.specimen === "object" ? payload.specimen as Record<string, unknown> : null
            const accession = specimen?.accessionNumber
            if (typeof accession === "string" && accession.trim()) return `Accession: ${accession.trim()}`
            return "Lab has received the specimen and started processing."
          }
          if (eventType.includes("requisition_created") || eventType.includes("requisition-created")) {
            return rawLabReqPdf ? "Requisition generated and ready to download." : "Requisition event received."
          }
          if (eventType.includes("order_created") || eventType.includes("order-created")) {
            const method = pick(payload, "labMethod")
            const panel = pick(payload, "panel")
            if (method && panel) return `Method: ${method} • Panel: ${panel}`
            if (method) return `Method: ${method}`
            if (panel) return `Panel: ${panel}`
            return "Lab order created."
          }
          return evt.description || "Lab update received."
        })()

        const cleanDescription = (evt: any, baseDesc?: string) => {
          const desc = baseDesc || evt.description || ""
          if (evt.event_type === "rx_revision" && desc.includes("Newly prescribed: ")) {
            const match = desc.match(/Newly prescribed:\s*([\s\S]*?)(?=(?:\.\s*|\n)(?:Supplemental|Refund)|$)/)
            if (match) {
              let newDesc = `Prescribed: ${match[1].trim()}`
              if (!newDesc.endsWith(".")) newDesc += "."
              if (desc.includes("Supplemental capture triggered")) {
                const suppMatch = desc.match(/(Supplemental capture triggered for \$[\d,.]+)/)
                if (suppMatch) newDesc += `\n${suppMatch[1]}.`
              }
              if (desc.includes("Refund required")) {
                const refundMatch = desc.match(/(Refund required for \$[\d,.]+)/)
                if (refundMatch) newDesc += `\n${refundMatch[1]}.`
              }
              return newDesc
            }
          }
          
          // Inject prescribed product into initial Prescribed event if missing
          if (evt.event_type === "status.prescribed" && !desc.includes("Prescribed: ")) {
             let pName = order.prescribed_medicines?.[0]?.name || order.prescription_medications?.[0]?.name;
             
             // If there are revisions, the CURRENT product name might not be the INITIAL one.
             // We can find the initial product from the FIRST rx_revision event.
             const firstRxRevision = Array.isArray(order.activity_events) 
                ? order.activity_events.find((e: any) => e.event_type === "rx_revision") 
                : null;
             
             if (firstRxRevision && firstRxRevision.description) {
                 const rxDesc = firstRxRevision.description;
                 const prevMatch = rxDesc.match(/Previously prescribed:\s*(.*?)(?=\s+at\s+\$|\.|$)/);
                 if (prevMatch && prevMatch[1]) {
                     pName = prevMatch[1].trim();
                 } else if (rxDesc.includes("Prescribed: ")) {
                     const newMatch = rxDesc.match(/Prescribed:\s*(.*?)(?=\s+at\s+\$|\.|$)/);
                     if (newMatch && newMatch[1]) {
                         pName = newMatch[1].trim();
                     }
                 }
             }

             if (pName && pName.toLowerCase() !== "same med" && pName.toLowerCase() !== "same medicine" && pName !== "Unknown Product") {
                 return `${desc}\nPrescribed: ${pName}.`
             }
          }

          return desc || undefined
        }

        return {
          title: evt.title || evt.event_type.replace(/\./g, " "),
          date: formatDateTime(evt.occurred_at),
          description: cleanDescription(evt, labDescription),
          icon,
          iconBg,
          actions,
        }
      })
    : []
  const renderedTimelineItems = eventTimelineItems.length > 0 ? eventTimelineItems : timelineItems

  const selectedMedicines = (order as Order & { selected_medicines?: Array<{ quantity?: unknown }> }).selected_medicines
  const qty = selectedMedicines?.[0]?.quantity ?? order.prescription_medications?.[0]?.quantity ?? "1"
  const parseMoney = (value?: string | number | null): number | null => {
    if (value === null || value === undefined || value === "") return null
    const parsed = Number.parseFloat(String(value))
    return Number.isFinite(parsed) ? parsed : null
  }
  const formatMoney = (value?: number | null): string => {
    if (value === null || value === undefined || Number.isNaN(value)) return "0.00"
    return value.toFixed(2)
  }

  const rawRemainingSupplementalAmount = parseMoney(order.remaining_supplemental_amount)
  const prescribedFinalAmount = parseMoney(order.prescribed_final_amount)
  const baseCaptureAmount = parseMoney(order.base_capture_amount)
  const supplementalDeltaAmount = parseMoney(order.supplemental_delta_amount)
  const baseCapturedAmount = parseMoney(order.base_captured_amount)
  const supplementalCapturedAmount = parseMoney(order.supplemental_captured_amount)
  const hasSplitSettlement =
    supplementalDeltaAmount != null && supplementalDeltaAmount > 0

  const quantityRaw = Number.parseFloat(String(qty))
  const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? quantityRaw : 1
  const originalPrice = parseMoney(order.pricing?.subtotal_before_discount ?? order.original_price)
  const shippingFee = parseMoney(order.pricing?.shipping_total ?? order.shipping_fee)
  const discountAmount = parseMoney(order.pricing?.discount_total ?? order.discount_amount) ?? 0
  const totalAmount = parseMoney(
    order.pricing?.grand_total ??
    order.grand_total ??
    order.payable_amount ??
    order.orderTotal ??
    order.amount
  )
  const settlementAmount = parseMoney((order as Order & { payment_settlement_amount?: string | number | null }).payment_settlement_amount)
  const chargeableAmount = parseMoney((order as Order & { chargeable_amount?: string | number | null }).chargeable_amount)
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
  const supplyLineItems = Array.isArray(order.pricing?.supply_line_items)
    ? order.pricing?.supply_line_items
    : []
  const hasNonIncludedSupplies = supplyLineItems.some((supply) => !supply?.is_included)
  const pricingMedicationSubtotal = parseMoney(order.pricing?.medication_subtotal)
  const pricingSuppliesSubtotal = parseMoney(order.pricing?.supplies_subtotal)
  const fallbackSuppliesSubtotal = supplyLineItems.reduce((acc, supply) => {
    const qty = Number.parseFloat(String(supply.quantity ?? 1))
    const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1
    const unitPrice = parseMoney(supply.unit_price) ?? 0
    return acc + (supply.is_included ? 0 : unitPrice * safeQty)
  }, 0)
  const suppliesSubtotalBeforeDiscount =
    pricingSuppliesSubtotal != null ? pricingSuppliesSubtotal : fallbackSuppliesSubtotal
  const medicationSubtotalAfterDiscount =
    productSubtotalAfterDiscount != null
      ? Math.max(0, productSubtotalAfterDiscount - suppliesSubtotalBeforeDiscount)
      : null
  const medicationOriginalSubtotal =
    medicationSubtotalAfterDiscount != null
      ? medicationSubtotalAfterDiscount + discountAmount
      : null

  const previewOriginalPrice = pendingProductChange != null
    ? pendingProductChange.subtotal
    : (shouldPreferPrescribedDisplay ? (parseMoney(order.original_price) ?? originalPrice) : originalPrice)

  const previewDiscountAmount = pendingProductChange != null
    ? pendingProductChange.discountAmount
    : discountAmount

  const previewProductSubtotal = pendingProductChange != null
    ? Math.max(0, pendingProductChange.subtotal - pendingProductChange.discountAmount)
    : productSubtotalAfterDiscount

  const previewShippingFee = pendingProductChange != null
    ? pendingProductChange.shippingFee
    : shippingFee

  const chargeableAmountSource = order.chargeable_amount_source || "requested_medicine"
  const prescribedDisplayTotal = settlementState === "captured"
    ? settlementAmount
    : (prescribedFinalAmount ?? chargeableAmount)

  const shouldPreferPrescribedDisplay =
    pendingProductChange == null &&
    chargeableAmountSource === "prescribed_medicine" &&
    prescribedDisplayTotal != null

  const calculatedTotal = hasBreakdown
    ? ((productSubtotalAfterDiscount ?? 0) + (shippingFee ?? 0))
    : totalAmount

  const previewTotal = pendingProductChange != null
    ? pendingProductChange.newAmount
    : (shouldPreferPrescribedDisplay ? prescribedDisplayTotal : calculatedTotal)

  const previewNetTotal = previewTotal != null
    ? Math.max(0, previewTotal - refundedAmount)
    : netTotalAmount

  // In split-capture rows, always reconcile remaining amount against the
  // currently displayed prescribed total to avoid stale-context mismatch.
  const effectivePrescribedTotalForSplit =
    hasSplitSettlement
      ? (shouldPreferPrescribedDisplay ? prescribedDisplayTotal : previewTotal)
      : null
  const splitCapturedSoFar =
    (baseCapturedAmount ?? 0) + (supplementalCapturedAmount ?? 0)
  const derivedRemainingSupplemental =
    hasSplitSettlement && effectivePrescribedTotalForSplit != null
      ? Math.max(0, effectivePrescribedTotalForSplit - splitCapturedSoFar)
      : null
  const remainingSupplementalAmount =
    derivedRemainingSupplemental != null
      ? derivedRemainingSupplemental
      : rawRemainingSupplementalAmount
  const hasRemainingSupplemental =
    isPrescribedStatus && remainingSupplementalAmount != null && remainingSupplementalAmount > 0

  const baseCapturedDisplay = hasSplitSettlement
    ? formatMoney(baseCapturedAmount ?? 0)
    : null
  const supplementalCapturedDisplay = hasSplitSettlement
    ? formatMoney(supplementalCapturedAmount ?? 0)
    : null
  const prescribedFinalDisplay = hasSplitSettlement
    ? formatMoney(effectivePrescribedTotalForSplit ?? prescribedFinalAmount ?? 0)
    : null

  const retryAmount = hasRemainingSupplemental
    ? remainingSupplementalAmount
    : (totalAmount ?? previewTotal ?? netTotalAmount)
  const canRetryPayment = hasRemainingSupplemental || baseRetryEligibility
  const paymentInfoAmount = hasRemainingSupplemental
    ? formatMoney(remainingSupplementalAmount)
    : formatMoney(previewNetTotal)
  const paymentInfoAmountLabel = hasRemainingSupplemental ? "Remaining to Capture" : "Amount"

  const displayProductName = pendingProductChange?.productName || order.product_name || "—"
  const displayQuantity = String(qty)
  const requestedMedicineName =
    order.requested_medicines?.[0]?.name ||
    order.product_name ||
    "—"
  const rawPrescribedMedicineName =
    order.prescribed_medicines?.[0]?.name ||
    order.prescription_medications?.[0]?.name ||
    null
  const prescribedNameNormalized = rawPrescribedMedicineName?.trim().toLowerCase()
  const isSameMedicinePlaceholder =
    prescribedNameNormalized === "same med" ||
    prescribedNameNormalized === "same medicine" ||
    prescribedNameNormalized === "same medication"
  const prescribedMedicineName = isSameMedicinePlaceholder
    ? requestedMedicineName
    : rawPrescribedMedicineName
  const orderLifecycleStatus = String(order.orderStatus || order.status || "").toLowerCase()
  const isLikelyLegacyPrescribed =
    Boolean(order.datePrescribed) ||
    chargeableAmountSource === "prescribed_medicine" ||
    ["prescribed", "rx_sent", "shipped", "completed", "delivered"].includes(orderLifecycleStatus)
  const legacyPrescribedFallbackName =
    requestedMedicineName && requestedMedicineName !== "—"
      ? requestedMedicineName
      : "Legacy prescribed order"
  const prescribedMedicineDisplayName =
    prescribedMedicineName ||
    (isLikelyLegacyPrescribed ? legacyPrescribedFallbackName : "Awaiting provider decision")
  const requestedPillClass =
    "inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300"
  const prescribedPillClass =
    "inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300"
  const amountSourcePillClass =
    chargeableAmountSource === "prescribed_medicine"
      ? "inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300"
      : chargeableAmountSource === "requested_medicine_fallback"
        ? "inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300"
        : "inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300"
  const amountSourceLabel =
    chargeableAmountSource === "prescribed_medicine"
      ? "Prescribed (Doctor Final)"
      : chargeableAmountSource === "requested_medicine_fallback"
        ? "Requested Fallback"
        : "Requested (Original)"
  const pharmacyDisplayName =
    order.pharmacy_name ||
    order.pharmacy_display ||
    order.booking_location ||
    "—"

  const previewOriginalUnitPrice = pendingProductChange != null
    ? pendingProductChange.unitPrice
    : (medicationOriginalSubtotal != null ? medicationOriginalSubtotal / quantity : null)

  const displayDiscountPerUnit = pendingProductChange != null
    ? pendingProductChange.discountAmount / Math.max(quantity, 1)
    : discountPerUnit

  const displayItemUnitPrice = pendingProductChange != null
    ? pendingProductChange.unitPrice - displayDiscountPerUnit
    : hasNonIncludedSupplies
      ? ((pricingMedicationSubtotal != null ? pricingMedicationSubtotal : medicationSubtotalAfterDiscount) != null
        ? (pricingMedicationSubtotal != null ? pricingMedicationSubtotal : medicationSubtotalAfterDiscount) / quantity
        : itemUnitPrice)
      : (medicationSubtotalAfterDiscount != null ? medicationSubtotalAfterDiscount / quantity : itemUnitPrice)

  const displayLineTotal = pendingProductChange != null
    ? (previewProductSubtotal != null ? previewProductSubtotal : productSubtotalAfterDiscount)
    : shouldPreferPrescribedDisplay
      ? Math.max(0, (previewTotal ?? 0) - (previewShippingFee ?? 0))
    : hasNonIncludedSupplies
      ? ((pricingMedicationSubtotal != null ? pricingMedicationSubtotal : medicationSubtotalAfterDiscount) != null
        ? (pricingMedicationSubtotal != null ? pricingMedicationSubtotal : medicationSubtotalAfterDiscount)
        : (previewProductSubtotal != null ? previewProductSubtotal : productSubtotalAfterDiscount))
      : (medicationSubtotalAfterDiscount != null ? medicationSubtotalAfterDiscount : (previewProductSubtotal != null ? previewProductSubtotal : productSubtotalAfterDiscount))

  const itemPrice = formatMoney(displayItemUnitPrice)
  const lineTotalPrice = formatMoney(displayLineTotal)
  const productSubtotalPrice = formatMoney(
    shouldPreferPrescribedDisplay
      ? Math.max(0, (previewTotal ?? 0) - (previewShippingFee ?? 0))
      : (previewProductSubtotal != null ? previewProductSubtotal : productSubtotalAfterDiscount)
  )
  const totalPrice = formatMoney(previewTotal)
  const netTotalPrice = formatMoney(previewNetTotal)

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

  const retryGatewayLabel = gatewayLabel(retryGateway)
  const orderProcessorGateway = normalizeGateway(order?.paymentProcessor)
  const orderProcessorGatewayLabel = gatewayLabel(orderProcessorGateway)
  const retryAmountLabel = hasRemainingSupplemental ? "Remaining supplemental amount" : "Amount to retry"
  const retryModalDescription = hasRemainingSupplemental
    ? `This retry charges only the remaining supplemental amount via ${retryGatewayLabel}.`
    : `Select a saved card to retry the patient charge via ${retryGatewayLabel}.`
  const retryGatewayMismatch =
    Boolean(retryGateway && orderProcessorGateway) && retryGateway !== orderProcessorGateway
  const processorReferenceLabel =
    orderProcessorGateway === "nmi"
      ? "NMI Trans ID"
      : orderProcessorGateway === "stripe"
        ? "Stripe Intent ID"
        : orderProcessorGateway === "authorize_net"
          ? "Authorize.Net Trans ID"
          : "Processor Ref"
  const settlementTransactions = Array.isArray(order.payment_settlement_transactions)
    ? order.payment_settlement_transactions
    : []

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
              {canChangeProduct ? (
                <Button
                  size="sm"
                  onClick={handleUpdateOrder}
                  disabled={!pendingProductChange || updateOrderLoading}
                >
                  {updateOrderLoading ? "Updating..." : "Update Order"}
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex cursor-not-allowed">
                      <Button size="sm" disabled className="pointer-events-none">
                        Update Order
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {changeProductTooltip}
                  </TooltipContent>
                </Tooltip>
              )}
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
                        <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          {order.product_image ? (
                            <img
                              src={order.product_image}
                              alt={displayProductName || "Product"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 dark:text-white">
                              {displayProductName}
                            </p>
                            {canChangeProduct ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs px-2 py-0"
                                onClick={() => setShowChangeProductModal(true)}
                              >
                                Change
                              </Button>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex cursor-not-allowed">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-6 text-xs px-2 py-0 pointer-events-none"
                                      disabled
                                    >
                                      Change
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                  {changeProductTooltip}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {order.prescription_medications?.[0]?.strength
                              ? `${order.prescription_medications[0].strength}`
                              : order.treatment_type || ""}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Requested (Original):{" "}
                            <span className={requestedPillClass}>{requestedMedicineName}</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Prescribed (Doctor Final):{" "}
                            <span className={prescribedPillClass}>
                              {prescribedMedicineDisplayName}
                            </span>
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Doctor: <span className="text-slate-700 dark:text-slate-300">{order.doctor_name || "—"}</span>
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
                        {previewDiscountAmount > 0 && previewOriginalUnitPrice != null && !hasNonIncludedSupplies && (
                          <span className="text-xs text-slate-400 line-through">
                            ${formatMoney(previewOriginalUnitPrice)}
                          </span>
                        )}
                        <span>${itemPrice}</span>
                        {previewDiscountAmount > 0 && !hasNonIncludedSupplies && (
                          <span className="text-[11px] text-green-600 dark:text-green-400 font-medium">
                            Save ${formatMoney(displayDiscountPerUnit)} / unit
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right align-top text-slate-600 dark:text-slate-300">
                      {displayQuantity}
                    </td>
                    <td className="px-6 py-4 text-right align-top font-medium text-slate-900 dark:text-white">
                      <div className="flex flex-col items-end">
                        <span>${lineTotalPrice}</span>
                        <span className="text-[11px] font-normal text-slate-400">Excl. shipping</span>
                      </div>
                    </td>
                  </tr>
                  {supplyLineItems.map((supply, idx) => {
                    const qty = Number.parseFloat(String(supply.quantity ?? 1))
                    const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1
                    const unitPrice = parseMoney(supply.unit_price) ?? 0
                    const lineTotal = (supply.is_included ? 0 : unitPrice * safeQty)
                    return (
                      <tr key={`supply-${idx}`} className="bg-slate-50/40 dark:bg-slate-800/40">
                        <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-slate-400" />
                            <span>{supply.name || "Supply item"}</span>
                            {supply.is_included && (
                              <span className="rounded bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 text-[10px]">Included</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right text-sm text-slate-700 dark:text-slate-300">
                          {supply.is_included ? "$0.00" : `$${formatMoney(unitPrice)}`}
                        </td>
                        <td className="px-6 py-3 text-right text-sm text-slate-700 dark:text-slate-300">
                          {safeQty}
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-medium text-slate-900 dark:text-white">
                          ${formatMoney(lineTotal)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-muted/30">
                  {hasBreakdown && previewOriginalPrice != null && (
                    <tr>
                      <td className="px-6 py-3 text-right text-slate-500 dark:text-slate-400" colSpan={3}>
                        {shouldPreferPrescribedDisplay
                          ? "Requested original total (reference):"
                          : "Product list price:"}
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-slate-900 dark:text-white">
                        ${previewOriginalPrice.toFixed(2)}
                      </td>
                    </tr>
                  )}
                  {previewDiscountAmount > 0 && (
                    <tr>
                      <td className="px-6 py-3 text-right text-slate-500 dark:text-slate-400" colSpan={3}>
                        Product discount{appliedCouponCodes ? ` (${appliedCouponCodes})` : ""}:
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-green-600 dark:text-green-400">
                        −${previewDiscountAmount.toFixed(2)}
                      </td>
                    </tr>
                  )}
                  {productSubtotalAfterDiscount != null && (
                    <tr>
                      <td className="px-6 py-3 text-right text-slate-500 dark:text-slate-400" colSpan={3}>
                        {shouldPreferPrescribedDisplay ? "Prescribed subtotal:" : "Product subtotal:"}
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-slate-900 dark:text-white">
                        ${productSubtotalPrice}
                      </td>
                    </tr>
                  )}
                  {(hasBreakdown || previewShippingFee != null) && (
                    <tr>
                      <td className="px-6 py-3 text-right text-slate-500 dark:text-slate-400" colSpan={3}>
                        Shipping:
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-slate-900 dark:text-white">
                        ${formatMoney(previewShippingFee)}
                      </td>
                    </tr>
                  )}
                  {!hasBreakdown && (
                    <tr>
                      <td className="px-6 py-3 text-right text-slate-500 dark:text-slate-400" colSpan={3}>
                        {shouldPreferPrescribedDisplay ? "Prescribed subtotal:" : "Product subtotal:"}
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-slate-900 dark:text-white">
                        ${totalPrice}
                      </td>
                    </tr>
                  )}
                  {hasSplitSettlement && (
                    <tr>
                      <td className="px-6 py-3 text-right text-slate-500 dark:text-slate-400" colSpan={3}>
                        Prescribed total:
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-slate-900 dark:text-white">
                        ${prescribedFinalDisplay}
                      </td>
                    </tr>
                  )}
                  {hasSplitSettlement && (
                    <tr>
                      <td className="px-6 py-3 text-right text-slate-500 dark:text-slate-400" colSpan={3}>
                        Captured (base):
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-slate-900 dark:text-white">
                        ${baseCapturedDisplay}
                      </td>
                    </tr>
                  )}
                  {hasSplitSettlement && supplementalCapturedAmount != null && (
                    <tr>
                      <td className="px-6 py-3 text-right text-slate-500 dark:text-slate-400" colSpan={3}>
                        Captured (supplemental):
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-slate-900 dark:text-white">
                        ${supplementalCapturedDisplay}
                      </td>
                    </tr>
                  )}
                  {hasRemainingSupplemental && (
                    <tr>
                      <td className="px-6 py-3 text-right text-amber-600 dark:text-amber-400" colSpan={3}>
                        Remaining supplemental amount:
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-amber-600 dark:text-amber-400">
                        ${formatMoney(remainingSupplementalAmount)}
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
                        <span className="mt-1 text-[11px] font-normal text-slate-500 dark:text-slate-400">
                          Amount Source:
                        </span>
                        <span className={`mt-1 text-[11px] ${amountSourcePillClass}`}>
                          {amountSourceLabel} + shipping
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
                    "px-2.5 py-0.5 rounded-full text-xs font-medium border inline-flex items-center gap-1.5",
                    statusColors[status] || "bg-slate-100 text-slate-700 border-slate-200"
                  )}
                >
                  {getStatusIcon(status)}
                  {statusDisplay.toUpperCase().replace(/_/g, " ")}
                </span>
                {paymentRecoveryLabel ? (
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                      recoveryStatusColors[paymentRecoveryState] || "bg-amber-100 text-amber-700 border-amber-200"
                    )}
                  >
                    {paymentRecoveryLabel}
                  </span>
                ) : null}
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
                  {renderedTimelineItems.map((item, idx) => (
                    <div key={idx} className="relative flex gap-4">
                      <TimelineIcon name={item.icon} iconBg={item.iconBg} />
                      <div className="flex-1 pt-1">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                          <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                          <span className="text-xs text-slate-400 whitespace-nowrap">{item.date}</span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-line">{item.description}</p>
                        )}
                        {item.actions && item.actions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.actions.map((action) => (
                              <a
                                key={`${item.title}-${action.label}-${action.url}`}
                                href={action.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
                              >
                                {action.label}
                              </a>
                            ))}
                          </div>
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
          {/* Medical + Pharmacy Tabs */}
          <div className="bg-card rounded-xl shadow-sm border p-4 sm:p-6">
            <Tabs defaultValue="medical" className="w-full">
              <div className="px-4 pt-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <TabsList className="h-10 grid grid-cols-3 w-full sm:w-auto p-1">
                  <TabsTrigger value="product" className="h-8 text-xs sm:text-sm leading-none">Product</TabsTrigger>
                  <TabsTrigger value="medical" className="h-8 text-xs sm:text-sm leading-none">Medical</TabsTrigger>
                  <TabsTrigger value="pharmacy" className="h-8 text-xs sm:text-sm leading-none">Pharmacy</TabsTrigger>
                </TabsList>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 text-xs h-8 px-3"
                  onClick={handleTrackThread}
                  disabled={!orderThreadMasterId}
                >
                  Track
                </Button>
              </div>

              <TabsContent value="product" className="space-y-4 mt-0">
                <div className="p-3 bg-muted/40 rounded-lg border">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Product</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{displayProductName}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Requested (Original):{" "}
                    <span className={requestedPillClass}>{requestedMedicineName}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Prescribed (Doctor Final):{" "}
                    <span className={prescribedPillClass}>
                      {prescribedMedicineDisplayName}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Doctor: <span className="text-slate-700 dark:text-slate-300">{order.doctor_name || "—"}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Amount Source:{" "}
                    <span className={amountSourcePillClass}>
                      {amountSourceLabel}
                    </span>
                  </p>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg border">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Pricing</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Subtotal: <span className="text-slate-700 dark:text-slate-200 font-medium">${productSubtotalPrice}</span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Shipping: <span className="text-slate-700 dark:text-slate-200 font-medium">${formatMoney(previewShippingFee)}</span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Total: <span className="text-slate-700 dark:text-slate-200 font-semibold">${netTotalPrice}</span>
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="medical" className="space-y-4 mt-0">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center shrink-0">
                    <Stethoscope className="h-7 w-7" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-base">
                      {order.provider_network || "Medical Network"}
                    </h4>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Provider: <span className="text-slate-700 dark:text-slate-300 font-medium">{order.doctor_name || order.provider_network || "—"}</span>
                    </p>
                    {order.prescription_source_received_at && (
                      <p className="text-sm text-slate-500 mt-1">
                        RX Received: <span className="text-slate-700 dark:text-slate-300">{formatDateTime(order.prescription_source_received_at)}</span>
                      </p>
                    )}
                    {order.prescription_source_event_id && (
                      <p className="text-xs text-slate-500 mt-2 break-all">
                        RX Event ID: <span className="font-mono text-slate-600 dark:text-slate-400">{order.prescription_source_event_id}</span>
                      </p>
                    )}
                  </div>
                </div>
                {(order.mrn || order.visitStatus) && (
                  <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Master ID</p>
                    <p className="text-sm font-mono text-slate-700 dark:text-slate-300 break-all leading-relaxed">
                      {order.mrn || order.visitStatus || "—"}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pharmacy" className="space-y-4 mt-0">
                <div className="p-4 bg-muted/40 rounded-lg border border-border/50">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">Pharmacy</p>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">{pharmacyDisplayName}</p>
                  {order.booking_location && (
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {order.booking_location}
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Prescription Details</p>
                  {(order.prescription_medications || []).length > 0 ? (
                    <div className="space-y-3">
                      {(order.prescription_medications || []).map((med, idx) => (
                        <div key={`pharm-med-${idx}`} className="rounded-lg border p-4 bg-background/60 shadow-sm">
                          <p className="font-medium text-slate-900 dark:text-white">{med.name || "Medication"}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <span className="text-slate-400">Strength:</span>
                              <span className="text-slate-700 dark:text-slate-300 font-medium">{med.strength || "—"}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="text-slate-400">Qty:</span>
                              <span className="text-slate-700 dark:text-slate-300 font-medium">{med.quantity || "—"}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="text-slate-400">Refills:</span>
                              <span className="text-slate-700 dark:text-slate-300 font-medium">{med.refills || "0"}</span>
                            </span>
                          </div>
                          {(med.rxId || med.medId) && (
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
                              {med.rxId && (
                                <span className="flex items-center gap-1">
                                  <span>RX ID:</span>
                                  <span className="font-mono text-slate-600 dark:text-slate-400">{med.rxId}</span>
                                </span>
                              )}
                              {med.medId && (
                                <span className="flex items-center gap-1">
                                  <span>Med ID:</span>
                                  <span className="font-mono text-slate-600 dark:text-slate-400">{med.medId}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic bg-muted/30 p-3 rounded-lg">No pharmacy prescription details available yet.</p>
                  )}
                </div>
                <div className="p-4 bg-muted/40 rounded-lg border border-border/50">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-3">Fulfillment</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Tracking Number</p>
                      <p className="font-mono text-slate-700 dark:text-slate-300 text-xs break-all">{order.tracking_number || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Carrier</p>
                      <p className="text-slate-700 dark:text-slate-300">{order.shipping_carrier || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Status</p>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {getStatusIcon(status)}
                        {statusDisplay}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Booking Info */}
          {(order.doctor_name || order.booking_scheduled_at || order.booking_location) && (
            <div className="bg-card rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                Booking Information
              </h3>
              <ul className="space-y-3 text-sm">
                {order.doctor_name && (
                  <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                    <Stethoscope className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <span>Doctor: <span className="font-medium text-slate-900 dark:text-white">{order.doctor_name}</span></span>
                  </li>
                )}
                {order.booking_scheduled_at && (
                  <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                    <Calendar className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <span>Scheduled: <span className="font-medium text-slate-900 dark:text-white">{formatBookingSchedule(order.booking_scheduled_at)}</span></span>
                  </li>
                )}
                {order.booking_location && (
                  <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <span>Location: <span className="font-medium text-slate-900 dark:text-white">{order.booking_location}</span></span>
                  </li>
                )}
              </ul>
            </div>
          )}

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
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-1 h-6 px-2 text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                  onClick={handleSendCheckoutLink}
                  disabled={sendCheckoutLinkLoading}
                >
                  {sendCheckoutLinkLoading ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Email Checkout Link"
                  )}
                </Button>
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
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{processorReferenceLabel}</span>
                <span className="text-slate-900 dark:text-white font-mono text-xs">
                  {order.paymentProcessorTransactionId || "—"}
                </span>
              </div>
              {hasSplitSettlement && settlementTransactions.length > 0 && (
                <div className="space-y-2 rounded border border-slate-200 dark:border-slate-700 p-2">
                  <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Split Capture Transactions
                  </div>
                  {settlementTransactions.map((tx) => {
                    const role = tx.settlement_role || "base"
                    const ref = tx.processor_transaction_id || "—"
                    return (
                      <div key={tx.id} className="grid grid-cols-3 gap-2 text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">{role}</span>
                        <span className="font-mono text-slate-900 dark:text-white truncate">{ref}</span>
                        <span className="text-right text-slate-600 dark:text-slate-300">
                          ${formatMoney(parseMoney(tx.amount))}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
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
                <span className="text-slate-900 dark:text-white font-bold">{paymentInfoAmountLabel}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-900 dark:text-white font-bold">${paymentInfoAmount}</span>
                  {canRetryPayment && (
                    <PermissionGate permission={Permissions.ORDER_UPDATE}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-6 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-300"
                        onClick={() => setShowRetryPaymentDialog(true)}
                      >
                        <RotateCw className="h-3 w-3 mr-1" /> Retry Payment
                      </Button>
                    </PermissionGate>
                  )}
                  {canRefundOrVoid && (
                    <PermissionGate permission={Permissions.REFUND_CREATE}>
                      <div className="flex items-center gap-2">
                        {(order as any)?.rx_revision_tag === "refund_required" && (
                          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded border border-red-200 dark:border-red-800">
                            Refund Required: ${parseFloat((order as any)?.rx_revision_refund_required_amount || "0").toFixed(2)}
                          </span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] h-6 border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400"
                          onClick={() => {
                            if ((order as any)?.rx_revision_tag === "refund_required") {
                              const amt = parseFloat((order as any)?.rx_revision_refund_required_amount || "0");
                              if (amt > 0) setRefundAmount(amt.toFixed(2));
                            } else {
                              setRefundAmount("");
                            }
                            setShowRefundDialog(true);
                          }}
                        >
                          <Undo2 className="h-3 w-3 mr-1" /> Refund
                        </Button>
                      </div>
                    </PermissionGate>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Retry Payment Dialog */}
      <Dialog open={showRetryPaymentDialog} onOpenChange={setShowRetryPaymentDialog}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Retry Patient Payment</DialogTitle>
            <DialogDescription>
              {retryModalDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div
              className={cn(
                "rounded-md border px-3 py-2 text-xs",
                retryGatewayMismatch
                  ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                  : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              )}
            >
              This order was originally processed via <strong>{orderProcessorGatewayLabel}</strong>. Before retrying,
              ensure the client gateway is set to <strong>{orderProcessorGatewayLabel}</strong>.
              {retryGatewayMismatch ? (
                <> Current retry gateway is <strong>{retryGatewayLabel}</strong>.</>
              ) : null}
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">{retryAmountLabel}</span>
              <span className="text-slate-900 dark:text-white font-medium">${formatMoney(retryAmount)}</span>
            </div>

            {paymentMethodsLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading saved payment methods...
              </div>
            )}

            {!paymentMethodsLoading && paymentMethodsError && (
              <p className="text-sm text-destructive">{paymentMethodsError}</p>
            )}

            {!paymentMethodsLoading && !paymentMethodsError && paymentMethods.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No saved payment methods found for this patient.
              </p>
            )}

            {retryGatewayMismatch && (
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Retry is disabled until client gateway matches the order processor ({orderProcessorGatewayLabel}).
              </p>
            )}

            {!paymentMethodsLoading && paymentMethods.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Saved payment method</label>
                <Select value={selectedPaymentMethodId} onValueChange={setSelectedPaymentMethodId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a card" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => {
                      const brand = method.card_brand ? method.card_brand.toUpperCase() : "CARD"
                      const last4 = method.masked_card_number ? method.masked_card_number.slice(-4) : "----"
                      const expMonth = method.card_expiry_month ? String(method.card_expiry_month).padStart(2, "0") : ""
                      const expYear = method.card_expiry_year ? String(method.card_expiry_year) : ""
                      const expLabel = expMonth && expYear ? `exp ${expMonth}/${expYear}` : ""
                      const defaultLabel = method.is_default ? " • default" : ""
                      return (
                        <SelectItem key={method.id} value={method.id}>
                          {brand} •••• {last4}{expLabel ? ` (${expLabel})` : ""}{defaultLabel}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRetryPaymentDialog(false)}
                disabled={retryPaymentLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleRetryPayment}
                disabled={
                  retryPaymentLoading ||
                  paymentMethodsLoading ||
                  retryGatewayMismatch ||
                  Boolean(paymentMethodsError) ||
                  !selectedPaymentMethodId
                }
              >
                {retryPaymentLoading ? "Retrying..." : "Retry Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
      {order && (
        <ChangeProductModal
          order={order}
          open={showChangeProductModal}
          quantity={quantity}
          onOpenChange={setShowChangeProductModal}
          onApply={(change) => setPendingProductChange(change)}
        />
      )}
    </div>
  )
}
