import { useState, useEffect, useMemo, useRef } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Order, ordersApi, PrescriptionHistoryEvent, PrescriptionHistoryMedication } from "@/api/ordersApi"
import { paymentGatewayApi } from "@/api/paymentGatewayApi"
import { patientPaymentMethodsApi, PatientPaymentMethod, PatientPaymentGateway } from "@/api/patientPaymentMethodsApi"
import { useToast } from "@/hooks/use-toast"
import { useClientMessages } from "@/contexts/MessagesContext"
import {
  Calendar,
  CreditCard,
  FileText,
  Stethoscope,
  Truck,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

// Import Sub-Components
import { OrderHeaderCard } from "@/components/orders/details/OrderHeaderCard"
import { OrderProductsSection } from "@/components/orders/details/OrderProductsSection"
import { TreatmentRoutingSection } from "@/components/orders/details/TreatmentRoutingSection"
import { OrderPricingBreakdown } from "@/components/orders/details/OrderPricingBreakdown"
import { ClientReimbursementSection } from "@/components/orders/details/ClientReimbursementSection"
import { OrderPatientCard } from "@/components/orders/details/OrderPatientCard"
import { OrderPaymentCard } from "@/components/orders/details/OrderPaymentCard"
import { OrderTimelineCard } from "@/components/orders/details/OrderTimelineCard"
import { OrderMetadataSection } from "@/components/orders/details/OrderMetadataSection"
import { OrderMedicalCard } from "@/components/orders/details/OrderMedicalCard"
import { OrderPharmacyCard } from "@/components/orders/details/OrderPharmacyCard"
import { RefundVoidModal } from "@/components/orders/details/RefundVoidModal"
import { UpdateStatusModal } from "@/components/orders/details/UpdateStatusModal"
import { RetryPaymentModal } from "@/components/orders/details/RetryPaymentModal"
import { PatientResponsesModal } from "@/components/orders/PatientResponsesModal"
import { ChangeProductModal, PendingProductChange } from "@/components/orders/ChangeProductModal"

const normalizeGateway = (value?: string | null): PatientPaymentGateway | null => {
  if (!value) return null
  const normalized = value.toLowerCase()
  if (normalized.includes("authorize")) return "authorize_net"
  if (normalized.includes("stripe")) return "stripe"
  if (normalized.includes("nmi")) return "nmi"
  return null
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
  shipped: "Shipped",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  delivery_failed: "Delivery Failed",
  canceled: "Canceled",
}

const recoveryStatusLabels: Record<string, string> = {
  recovery_pending: "Recovery Pending",
}

const gatewayLabel = (gateway: PatientPaymentGateway | null) => {
  if (gateway === "authorize_net") return "Authorize.Net"
  if (gateway === "nmi") return "NMI"
  if (gateway === "stripe") return "Stripe"
  return "payment gateway"
}

type TimelineItem = {
  title: string
  date: string
  description?: string
  icon: "schedule" | "payments" | "prescriptions" | "medical_services" | "local_shipping" | "event" | "credit_card" | "description"
  iconBg: string
}

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  // Modals state
  const [showPatientResponses, setShowPatientResponses] = useState(false)
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [refundAmount, setRefundAmount] = useState("")
  const [refundTarget, setRefundTarget] = useState<"auto" | "base" | "supplemental">("auto")
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

  // Retry payment state
  const [paymentMethods, setPaymentMethods] = useState<PatientPaymentMethod[]>([])
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false)
  const [paymentMethodsError, setPaymentMethodsError] = useState<string | null>(null)
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("")
  const [retryPaymentLoading, setRetryPaymentLoading] = useState(false)
  const [retryGateway, setRetryGateway] = useState<PatientPaymentGateway | null>(null)
  const retrySingleFlightRef = useRef(false)

  // Quick actions loading states
  const [sendCheckoutLinkLoading, setSendCheckoutLinkLoading] = useState(false)
  const [resendReceiptLoading, setResendReceiptLoading] = useState(false)
  const [downloadReceiptLoading, setDownloadReceiptLoading] = useState(false)
  const [showPrescriptionHistory, setShowPrescriptionHistory] = useState(false)
  const [prescriptionHistory, setPrescriptionHistory] = useState<{
    patient_name?: string | null
    prescription_event_count: number
    revision_count: number
    events: PrescriptionHistoryEvent[]
  } | null>(null)
  const [prescriptionHistoryLoading, setPrescriptionHistoryLoading] = useState(false)
  const [prescriptionHistoryError, setPrescriptionHistoryError] = useState<string | null>(null)
  const { toast } = useToast()
  const { conversations: messages = [], conversationsLoading } = useClientMessages()

  const openPrescriptionHistory = async () => {
    if (!order) return
    setShowPrescriptionHistory(true)
    setPrescriptionHistoryLoading(true)
    setPrescriptionHistoryError(null)
    try {
      const history = await ordersApi.fetchPrescriptionHistory(order.id)
      setPrescriptionHistory(history)
    } catch (err: any) {
      setPrescriptionHistoryError(err?.response?.data?.detail || "Unable to load prescription history.")
    } finally {
      setPrescriptionHistoryLoading(false)
    }
  }

  const isUuid = (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

  const patientUserId = order?.patient?.user_id
  const orderThreadMasterId = order?.mrn?.trim() || ""
  const hasExistingThread = Boolean(
    orderThreadMasterId && (messages || []).some((message) => message.master_id === orderThreadMasterId)
  )

  // Initial Fetch
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
    return () => {
      cancelled = true
    }
  }, [orderId])

  const refetchOrder = async (forceFresh = true): Promise<void> => {
    if (!orderId) return
    const fetchFn = isUuid(orderId)
      ? ordersApi.fetchOrder(orderId, forceFresh)
      : ordersApi.fetchOrderByOrderId(orderId, forceFresh)
    try {
      const fresh = await fetchFn
      setOrder(fresh)
    } catch {
      // Best effort refetch
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

  // Handle Track Message Thread
  const handleTrackThread = () => {
    if (!orderThreadMasterId) {
      toast({
        title: "Chat thread unavailable",
        description: "This order does not have a visit thread yet.",
        variant: "destructive",
      })
      return
    }
    if (conversationsLoading) {
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

  // Quick Action Handlers
  const handleSendCheckoutLink = async () => {
    if (!order?.id || sendCheckoutLinkLoading) return
    try {
      setSendCheckoutLinkLoading(true)
      const response = await ordersApi.sendCheckoutLink(order.id)
      toast({ title: response.message || "Checkout link email processed." })
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        "Failed to send checkout link email."
      toast({ title: message, variant: "destructive" })
    } finally {
      setSendCheckoutLinkLoading(false)
    }
  }

  const handleDownloadReceipt = async () => {
    if (!order?.id || downloadReceiptLoading) return
    try {
      setDownloadReceiptLoading(true)
      const blob = await ordersApi.downloadReceipt(order.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `receipt-${order.order_id || order.display_id || order.id}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.response?.data?.error || "Failed to download receipt."
      toast({ title: message, variant: "destructive" })
    } finally {
      setDownloadReceiptLoading(false)
    }
  }

  const handleResendReceipt = async () => {
    if (!order?.id || resendReceiptLoading) return
    try {
      setResendReceiptLoading(true)
      const response = await ordersApi.resendReceipt(order.id)
      toast({
        title: response.message || "Receipt email sent.",
        description: response.recipient_email ? `Sent to ${response.recipient_email}` : undefined,
      })
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.response?.data?.error || "Failed to resend receipt."
      toast({ title: message, variant: "destructive" })
    } finally {
      setResendReceiptLoading(false)
    }
  }

  // Handle Update Status
  const handleStatusUpdateSubmit = async (newStatus: string, statusTrackingNumber?: string) => {
    if (!order?.id || !newStatus) return
    try {
      setStatusUpdateLoading(true)
      const payload: Partial<Order> = { status: newStatus } as Partial<Order>
      if (newStatus === "shipped" && statusTrackingNumber?.trim()) {
        payload.tracking_number = statusTrackingNumber.trim()
      }
      await ordersApi.updateOrder(order.id, payload)
      setShowStatusDialog(false)
      toast({ title: `Status updated to ${newStatus}` })
      await refetchOrderWithRetries()
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.response?.data?.detail || "Failed to update status"
      toast({ title: message, variant: "destructive" })
    } finally {
      setStatusUpdateLoading(false)
    }
  }

  // Handle Refund / Void
  const handleRefundSubmit = async (data: {
    amount?: string
    refundTarget: "auto" | "base" | "supplemental"
    reason: string
    reasonDescription: string
    notes: string
  }) => {
    if (!order?.id) return
    try {
      setRefundLoading(true)
      await ordersApi.refundOrder(order.id, {
        amount: data.amount,
        refund_target: data.refundTarget,
        reason: data.reason,
        reason_description: data.reasonDescription,
        notes: data.notes,
      })
      setShowRefundDialog(false)
      toast({ title: isAuthorized ? "Authorization voided" : "Refund processed successfully" })
      await refetchOrderWithRetries()
    } catch (err: any) {
      const message = err?.response?.data?.detail || "Failed to process refund"
      toast({ title: message, variant: "destructive" })
    } finally {
      setRefundLoading(false)
    }
  }

  // Load Payment Methods for Retry Modal
  useEffect(() => {
    if (!showRetryPaymentDialog || !order) {
      setPaymentMethods([])
      setPaymentMethodsError(null)
      return
    }

    let cancelled = false
    const loadMethods = async () => {
      setPaymentMethodsLoading(true)
      setPaymentMethodsError(null)

      let resolvedGateway = normalizeGateway(order.paymentProcessor)
      try {
        const config = await paymentGatewayApi.getConfig()
        resolvedGateway = normalizeGateway(config?.payment_config?.payment_gateway) || resolvedGateway
      } catch {
        // Fallback
      }

      if (!resolvedGateway || !patientUserId) {
        if (!cancelled) {
          setPaymentMethodsError("Unable to determine gateway or missing patient user ID")
          setPaymentMethodsLoading(false)
        }
        return
      }

      if (!cancelled) setRetryGateway(resolvedGateway)

      try {
        const methods = await patientPaymentMethodsApi.listPaymentMethods(resolvedGateway, patientUserId)
        if (!cancelled) setPaymentMethods(methods)
      } catch (err: any) {
        if (!cancelled) {
          setPaymentMethodsError(err?.response?.data?.detail || "Failed to load payment methods")
        }
      } finally {
        if (!cancelled) setPaymentMethodsLoading(false)
      }
    }

    loadMethods()
    return () => {
      cancelled = true
    }
  }, [showRetryPaymentDialog, order, patientUserId])

  // Handle Retry Payment Submit
  const handleRetryPaymentSubmit = async (selectedPaymentMethodId: string) => {
    if (retrySingleFlightRef.current || retryPaymentLoading || !order?.id) return
    try {
      retrySingleFlightRef.current = true
      setRetryPaymentLoading(true)
      const result = await ordersApi.retryPayment(order.id, {
        saved_payment_method_id: selectedPaymentMethodId,
      })

      if (!result.success) {
        toast({ title: result.error || result.detail || "Retry payment failed", variant: "destructive" })
        return
      }

      toast({ title: "Payment retry completed successfully." })
      setShowRetryPaymentDialog(false)
      await refetchOrderWithRetries()
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.response?.data?.detail || "Retry payment failed"
      toast({ title: message, variant: "destructive" })
    } finally {
      setRetryPaymentLoading(false)
      retrySingleFlightRef.current = false
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-6 lg:p-8 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/orders")}>
          Back to Orders
        </Button>
        <p className="text-destructive font-medium">{error || "Order not found."}</p>
      </div>
    )
  }

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "—"
    try {
      return format(new Date(dateString), "MMM dd, yyyy • h:mm a")
    } catch {
      return dateString
    }
  }

  // Calculated values
  const status = order.orderStatus || order.status || "created"
  const canonicalStatus = String(order.status || order.orderStatus || "").toLowerCase()
  const isPrescribedStatus = String(status || "").toLowerCase() === "prescribed"
  const revisionCount = Math.max(0, Number(order.rx_revision_count || 0))
  const statusDisplay = statusLabels[status] || status
  const orderTitle = order.order_id ? `#${order.order_id}` : order.display_id ? `#${order.display_id}` : order.id?.slice(0, 8) || ""
  const paymentRecoveryState = (order.payment_recovery_state || "").toLowerCase()
  const paymentRecoveryLabel = isPrescribedStatus && paymentRecoveryState
    ? (recoveryStatusLabels[paymentRecoveryState] || paymentRecoveryState)
    : null
  const paymentStatus = (order.paymentStatus || "").toLowerCase()
  const terminalPaymentDateStatuses = new Set(["voided", "refunded", "canceled", "cancelled"])
  const paymentDisplayDate = terminalPaymentDateStatuses.has(paymentStatus)
    ? (order.paymentUpdatedAt || order.paymentDate)
    : order.paymentDate
  const paymentAuthorizationDate = order.paymentDate || paymentDisplayDate
  const settlementState = (order.payment_settlement_state || "").toLowerCase()
  const remainingRefundable = order?.refundableAmount ? parseFloat(order.refundableAmount) || 0 : 0
  const baseRemainingRefundable = order?.baseRefundableAmount ? parseFloat(order.baseRefundableAmount) || 0 : 0
  const supplementalRemainingRefundable = order?.supplementalRefundableAmount ? parseFloat(order.supplementalRefundableAmount) || 0 : 0

  const isAuthorized = paymentStatus === "authorized"
  const isRefundable = remainingRefundable > 0
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
  const isPreCheckoutProductChange = status === "created" || status === "payment_pending"
  const isSubmittedVisitProductChange =
    ["processing", "visit_pending", "consult_scheduled", "consult_rescheduled", "prescribed"].includes(canonicalStatus) &&
    Boolean(String(order.visitStatus || order.mrn || "").trim())
  const isAllowedStatus = isPreCheckoutProductChange || isSubmittedVisitProductChange
  const canChangeProduct = isAllowedStatus && (!isLocked || isSubmittedVisitProductChange)
  const canRefundOrVoid = isAuthorized || isRefundable
  const canUseReceipt = ["captured", "approved", "succeeded", "refunded"].includes(paymentStatus)
  const changeProductTooltip =
    isSubmittedVisitProductChange
      ? "Product change will resend the updated prescription to the submitted visit."
      : "Product change is available before payment authorization or for eligible submitted visits before fulfillment is shipped."

  const parseTimelineAmount = (value: unknown): number | null => {
    if (value === null || value === undefined || value === "") return null
    const parsed = Number.parseFloat(String(value))
    return Number.isFinite(parsed) ? parsed : null
  }
  const initialRequestedPrice =
    parseTimelineAmount(order.requested_medicines?.[0]?.price) ??
    parseTimelineAmount(order.pricing?.subtotal_before_discount ?? order.original_price) ??
    0
  const initialRequestedShipping = parseTimelineAmount(order.requested_medicines?.[0]?.shipping_fee) ?? 0
  const initialRequestedDiscount =
    parseTimelineAmount(order.pricing?.discount_total ?? order.discount_amount) ?? 0
  let trueAuthAmount = parseTimelineAmount(
    (order as Order & { base_authorization_amount?: string | number | null }).base_authorization_amount,
  )
  if (trueAuthAmount == null) {
    trueAuthAmount = Math.max(0, initialRequestedPrice - initialRequestedDiscount) + initialRequestedShipping
  }
  const timelineCapturedStatuses = new Set(["captured", "approved", "succeeded"])
  const timelineSettlementTransactions = Array.isArray(order.payment_settlement_transactions)
    ? order.payment_settlement_transactions
    : []
  const timelineCapturedFromTransactions = timelineSettlementTransactions.reduce((total, transaction) => {
    const transactionStatus = String(transaction.status || "").toLowerCase()
    if (!timelineCapturedStatuses.has(transactionStatus)) return total
    return total + (parseTimelineAmount(transaction.amount) ?? 0)
  }, 0)
  const timelineCapturedFromFields =
    (parseTimelineAmount(order.base_captured_amount) ?? 0) +
    (parseTimelineAmount(order.supplemental_captured_amount) ?? 0)
  const timelineCapturedAmount = Math.max(timelineCapturedFromTransactions, timelineCapturedFromFields)
  const hasActualCapturedTimelineAmount = timelineCapturedAmount > 0

  const appliedCouponCodes = (() => {
    const data = order as unknown as Record<string, unknown>
    const codes = new Set<string>()
    const addCode = (value: unknown) => {
      if (typeof value === "string" && value.trim()) codes.add(value.trim())
    }

    addCode(data.coupon_code)
    if (data.coupon && typeof data.coupon === "object") {
      addCode((data.coupon as { code?: unknown }).code)
    }
    if (Array.isArray(data.coupon_codes)) data.coupon_codes.forEach(addCode)
    if (Array.isArray(data.applied_coupons)) {
      data.applied_coupons.forEach((coupon) => {
        if (typeof coupon === "string") addCode(coupon)
        else if (coupon && typeof coupon === "object") addCode((coupon as { code?: unknown }).code)
      })
    }
    return Array.from(codes).join(", ")
  })()

  const refundReasonOptions = [
    { value: "customer_request", label: "Customer Request" },
    { value: "duplicate_charge", label: "Duplicate Charge" },
    { value: "fraud", label: "Fraud" },
    { value: "product_not_received", label: "Product Not Received" },
    { value: "product_defective", label: "Product Defective" },
    { value: "service_not_rendered", label: "Service Not Rendered" },
    { value: "other", label: "Other" },
  ]

  const handleUpdateOrder = async () => {
    if (!order?.id || !pendingProductChange) return
    if (!canChangeProduct) {
      toast({
        title: "Product change is available before payment authorization or for eligible submitted visits before fulfillment is shipped.",
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
  const timelineStatus = String(order.orderStatus || order.status || "").toLowerCase()
  const hasRxSentMilestone = Boolean(order.rx_sent_at) || [
    "rx_sent",
    "shipped",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "delivery_failed",
  ].includes(timelineStatus)
  if (order.datePrintedShipped && hasRxSentMilestone) {
    timelineItems.push({
      title: "Rx Sent",
      date: formatDateTime(order.datePrintedShipped),
      description: order.product_name
        ? `Prescription Sent to ${order.pharmacy_display || "Pharmacy"} (${order.product_name}).${order.prescription_medications?.[0]?.rxId ? ` Rx ID: ${order.prescription_medications[0].rxId}.` : ""}`
        : undefined,
      icon: "schedule",
      iconBg: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-4 border-white dark:border-slate-800",
    })
  }
  if (order.paymentDate || order.paymentUpdatedAt) {
    const normalizedPaymentStatus = paymentStatus
    const authorizedDescription = (trueAuthAmount != null && trueAuthAmount > 0)
      ? `Authorized $${trueAuthAmount.toFixed(2)}.`
      : (order.pricing?.grand_total || order.grand_total || order.payable_amount || order.orderTotal || order.amount)
        ? `Authorized $${order.pricing?.grand_total || order.grand_total || order.payable_amount || order.orderTotal || order.amount}.`
        : undefined
    let paymentTitle = "Payment Updated"
    if (normalizedPaymentStatus === "authorized" || ["captured", "approved", "succeeded"].includes(normalizedPaymentStatus)) paymentTitle = "Order amount authorized"
    else if (["failed", "declined", "error"].includes(normalizedPaymentStatus)) paymentTitle = "Payment Failed"
    else if (normalizedPaymentStatus === "voided") paymentTitle = "Payment Voided"
    else if (normalizedPaymentStatus === "refunded") paymentTitle = "Payment Refunded"

    if (["voided", "refunded", "canceled", "cancelled"].includes(normalizedPaymentStatus)) {
      timelineItems.push({
        title: "Order amount authorized",
        date: formatDateTime(paymentAuthorizationDate),
        description: authorizedDescription,
        icon: "payments",
        iconBg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-4 border-white dark:border-slate-800",
      })
    }

    timelineItems.push({
      title: paymentTitle,
      date: formatDateTime(paymentDisplayDate),
      description: normalizedPaymentStatus === "voided"
        ? authorizedDescription
        : (order.pricing?.grand_total || order.grand_total || order.payable_amount || order.orderTotal || order.amount)
          ? `${normalizedPaymentStatus === "refunded" ? "Refunded" : "Authorized"} $${order.pricing?.grand_total || order.grand_total || order.payable_amount || order.orderTotal || order.amount}.`
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
  if (order.status === "shipped" || order.tracking_number) {
    timelineItems.push({
      title: "Shipped",
      date: formatDateTime(order.updated_at || (order as any).updatedAt || order.orderDate),
      description: order.tracking_number ? `Tracking ${order.tracking_number} - ${(order as any).pharmacy_name || (order as any).pharmacy_display || (order as any).pharmacy || "Pharmacy"}` : undefined,
      icon: "local_shipping",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-4 border-white dark:border-slate-800",
    })
  }
  if (order.datePrescribed || isPrescribedStatus) {
    timelineItems.push({
      title: "Prescribed",
      date: formatDateTime(order.datePrescribed),
      description: order.product_name || undefined,
      icon: "prescriptions",
      iconBg: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-4 border-white dark:border-slate-800",
    })
  }
  if ((order.visitStatus || order.mrn) && order.status !== "created" && order.status !== "payment_pending" && order.status !== "abandoned" && order.status !== "") {
    timelineItems.push({
      title: "Visit Pending",
      date: formatDateTime(order.orderDate),
      description: order.provider_network ? `Provider: ${order.provider_network}` : undefined,
      icon: "medical_services",
      iconBg: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-4 border-white dark:border-slate-800",
    })
  }
  if (order.status === "payment_pending") {
    timelineItems.push({
      title: "Payment Pending",
      date: formatDateTime(order.orderDate),
      icon: "credit_card",
      iconBg: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-4 border-white dark:border-slate-800",
    })
  }
  if (order.status !== "created" && order.status !== "payment_pending" && order.status !== "abandoned" && order.status !== "") {
    timelineItems.push({
      title: "Processing",
      date: formatDateTime(order.orderDate),
      icon: "event",
      iconBg: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-4 border-white dark:border-slate-800",
    })
  }

  timelineItems.push({
    title: "Created",
    date: formatDateTime(order.orderDate),
    icon: "description",
    iconBg: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-4 border-white dark:border-slate-800",
  })
  timelineItems.reverse()

  const orderedActivityEvents = Array.isArray(order.activity_events)
    ? [...order.activity_events].sort((a, b) => {
      const aType = (a.event_type || "").toLowerCase()
      const bType = (b.event_type || "").toLowerCase()
      const isRxRevisionPair = (
        (aType === "rx_revision" && bType === "status.rx_sent")
        || (aType === "status.rx_sent" && bType === "rx_revision")
      )
      if (isRxRevisionPair && formatDateTime(a.occurred_at) === formatDateTime(b.occurred_at)) {
        return aType === "rx_revision" ? -1 : 1
      }
      return 0
    })
    : []

  const eventTimelineItems: TimelineItem[] = orderedActivityEvents.map((evt) => {
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
          return proof ? `Delivery proof: ${proof.replace(/_/g, " ")}` : "Lab kit delivered to patient."
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
        let desc = baseDesc || evt.description || ""
        const transitionMatch = desc.match(/^([^\n]+? -> [^\n]+?)(?:\n|$)/);
        if (transitionMatch) {
          const parts = transitionMatch[1].split(" -> ");
          if (parts.length === 2 && parts[0].length < 30 && parts[1].length < 30) {
            desc = desc.substring(transitionMatch[1].length).trim();
          }
        }
        if (evt.event_type === "rx_revision" && desc.includes("Unknown Product")) {
          const pName = order.prescribed_medicines?.[0]?.name || order.prescription_medications?.[0]?.name;
          if (pName) desc = desc.replace("Unknown Product", pName);
        }
        if (evt.event_type === "rx_revision" && desc.includes("Newly prescribed: ")) {
          const match = desc.match(/Newly prescribed:\s*([\s\S]*?)(?=(?:\.\s*|\n)(?:Supplemental|Refund)|$)/)
          if (match) {
            let newDesc = `Prescribed: ${match[1].trim()}`
            if (!newDesc.endsWith(".")) newDesc += "."
            if (desc.includes("Supplemental capture triggered")) {
              const suppMatch = desc.match(/Supplemental capture triggered for (\$[\d,.]+)/)
              if (suppMatch) newDesc += `\nSupplemental capture of ${suppMatch[1]}.`
            }
            if (desc.includes("Refund required")) {
              const refundMatch = desc.match(/Refund required for (\$[\d,.]+)/)
              if (refundMatch) newDesc += `\nRefund of ${refundMatch[1]}.`
            }
            return newDesc
          }
        }

        // Show unresolved product name on billing_pending events
        if (evt.event_type === "status.billing_pending") {
          const evtPayload = evt.payload || {} as any;
          if (evtPayload.mapping_status === "unresolved" || evtPayload.decision === "unresolved") {
            const rawName = evtPayload.prescribed_medication_name || "";
            desc = rawName
              ? `${desc}\nPrescribed: ${rawName} — catalog mapping unresolved.`.trim()
              : `${desc}\nPrescription catalog mapping unresolved.`.trim()
          }
        }

        // Inject prescribed product into initial Prescribed event if missing
        if (evt.event_type === "status.prescribed") {
          if (!desc.includes("Prescribed: ")) {
            const evtPayload = evt.payload || {} as any;
            const mappingUnresolved = evtPayload.mapping_status === "unresolved" || evtPayload.decision === "unresolved";

            if (mappingUnresolved) {
              const rawName = evtPayload.prescribed_medication_name || "";
              desc = rawName
                ? `${desc}\nPrescribed: ${rawName} (mapping unresolved).`.trim()
                : `${desc}\nPrescription mapping unresolved.`.trim()
            } else {
              let pName = order.prescribed_medicines?.[0]?.name || order.prescription_medications?.[0]?.name;

              if (pName && pName.toLowerCase() !== "same med" && pName.toLowerCase() !== "same medicine" && pName !== "Unknown Product") {
                desc = `${desc}\nPrescribed: ${pName}.`.trim()
              }
            }
          }

          // Inject capture details if missing
          if (!desc.includes("Captured $") && hasActualCapturedTimelineAmount) {
            if (trueAuthAmount != null && trueAuthAmount > timelineCapturedAmount) {
              const holdReleased = Math.max(0, trueAuthAmount - timelineCapturedAmount)
              desc += `\nCaptured $${timelineCapturedAmount.toFixed(2)} of $${trueAuthAmount.toFixed(2)} authorized.\nRemaining $${holdReleased.toFixed(2)} hold released.`
            } else if (trueAuthAmount != null && timelineCapturedAmount > trueAuthAmount) {
              const supplemental = timelineCapturedAmount - trueAuthAmount
              desc += `\nCaptured $${trueAuthAmount.toFixed(2)}.\nSupplemental capture of $${supplemental.toFixed(2)}.`
            } else {
              desc += `\nCaptured $${timelineCapturedAmount.toFixed(2)}.`
            }
          }
        }

        return desc || undefined
      }

      let rawTitle = evt.title || evt.event_type.replace(/\./g, " ")
      if (rawTitle === "Order Created") rawTitle = "Created"
      if (rawTitle === "Patient Payment Authorized") rawTitle = "Order amount authorized"
      if (rawTitle === "Patient Payment Captured") rawTitle = "Payment Captured"
      if (rawTitle === "Patient Payment Failed") rawTitle = "Payment Failed"
      if (rawTitle === "Patient Authorization Voided") rawTitle = "Payment Voided"
      if (rawTitle === "Patient Payment Refunded") rawTitle = "Payment Refunded"
      if (rawTitle === "Order status updated to Rx Sent") rawTitle = "Rx Sent"
      if (rawTitle === "Product Prescribed") rawTitle = "Prescribed"
      if (rawTitle === "Visit Created") rawTitle = "Visit Pending"

      return {
        title: rawTitle,
        date: formatDateTime(evt.occurred_at),
        description: cleanDescription(evt, labDescription),
        icon,
        iconBg,
        actions,
      }
    })

  const deduplicatedTimelineItems = eventTimelineItems.reduce((acc, current) => {
    if (acc.length === 0) return [current]
    const prev = acc[acc.length - 1]

    // Deduplicate consecutive events with the same title and date
    if (prev.title === current.title && prev.date === current.date) {
      if (!prev.description && current.description) {
        acc[acc.length - 1] = current
        return acc
      }
      if (prev.description && !current.description) {
        return acc
      }
      if (prev.description && current.description) {
        if (current.description.length > prev.description.length) {
          acc[acc.length - 1] = current
        }
        return acc
      }
      return acc
    }

    acc.push(current)
    return acc
  }, [] as typeof eventTimelineItems)

  let renderedTimelineItems = deduplicatedTimelineItems.length > 0 ? deduplicatedTimelineItems : timelineItems
  if (status === "visit_pending") {
    renderedTimelineItems = renderedTimelineItems.filter(i => i.title !== "Visit Failed")
  }

  if (deduplicatedTimelineItems.length > 0) {
    // Inject missing manual events that backend doesn't provide
    const missingEventsToInject = ["Created", "Payment Pending", "Processing", "Consult Scheduled", "Rx Sent", "Shipped"];
    missingEventsToInject.forEach(evtTitle => {
      const hasEvt = renderedTimelineItems.some(i => i.title === evtTitle);
      if (!hasEvt && timelineItems.some(i => i.title === evtTitle)) {
        const item = timelineItems.find(i => i.title === evtTitle);
        if (item) renderedTimelineItems.push(item);
      }
    });

    const hasAuthorizedPayment = renderedTimelineItems.some(i => i.title.toLowerCase().includes("amount authorized"))
    const authorizedPaymentItem = timelineItems.find(i => i.title.toLowerCase().includes("amount authorized"))
    if (!hasAuthorizedPayment && authorizedPaymentItem) {
      renderedTimelineItems.push(authorizedPaymentItem)
    }

    const hasTerminalPaymentUpdate = renderedTimelineItems.some(i => {
      const title = i.title.toLowerCase()
      return title.includes("payment") && !title.includes("pending") && !title.includes("amount authorized")
    })
    const terminalPaymentItem = timelineItems.find(i => {
      const title = i.title.toLowerCase()
      return title.includes("payment") && !title.includes("pending") && !title.includes("amount authorized")
    })
    if (!hasTerminalPaymentUpdate && terminalPaymentItem) {
      renderedTimelineItems.push(terminalPaymentItem)
    }
  }

  const normalizedOrderStatus = canonicalStatus
  const hasCanceledEvent = renderedTimelineItems.some((i) => i.title.toLowerCase().includes("cancel"))
  if (normalizedOrderStatus === "canceled" && !hasCanceledEvent) {
    renderedTimelineItems.push({
      title: "Canceled",
      date: formatDateTime(order.updated_at || (order as any).updatedAt || order.orderDate),
      description: "Order was canceled.",
      icon: "schedule",
      iconBg: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-4 border-white dark:border-slate-800",
    })
  }

  if (deduplicatedTimelineItems.length > 0 || normalizedOrderStatus === "canceled") {
    const orderScore = (title: string) => {
      const t = title.toLowerCase();
      if (t === "created") return 0;
      if (t === "payment pending") return 1;
      if (t === "processing") return 2;
      if (t.includes("authorized")) return 3;
      if (t.includes("captured") || t.includes("payment updated") || t.includes("payment failed") || t.includes("voided") || t.includes("refunded")) return 4;
      if (t.includes("visit pending") || t.includes("visit failed")) return 4;
      if (t.includes("consult")) return 5;
      if (t === "prescribed") return 6;
      if (t.includes("rx sent")) return 7;
      if (t === "shipped") return 8;
      if (t.includes("cancel")) return 9;
      return 10;
    }

    renderedTimelineItems.sort((a, b) => {
      const parseDate = (d: string) => new Date(d.replace(" • ", " ")).getTime();
      const timeDiff = parseDate(a.date) - parseDate(b.date);
      if (timeDiff !== 0 && !Number.isNaN(timeDiff)) return timeDiff;

      const aTitle = a.title.toLowerCase()
      const bTitle = b.title.toLowerCase()
      const isRxRevisionPair = (
        (aTitle === "prescription revised" && bTitle.includes("rx sent"))
        || (aTitle.includes("rx sent") && bTitle === "prescription revised")
      )
      if (isRxRevisionPair) {
        return aTitle === "prescription revised" ? -1 : 1
      }

      return orderScore(a.title) - orderScore(b.title);
    })
  }

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
  const settlementTransactions = Array.isArray(order.payment_settlement_transactions)
    ? order.payment_settlement_transactions
    : []
  const standaloneCapturedAmount = settlementTransactions.reduce((total, tx) => {
    if ((tx.settlement_role || "").toLowerCase() !== "standalone") return total
    return total + (parseMoney(tx.amount) ?? 0)
  }, 0)

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
  const netCollectedAmount = parseMoney(order.netCollected)
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

  const chargeableAmountSource = order.chargeable_amount_source || "requested_medicine"
  const prescribedDisplayTotal = settlementState === "captured"
    ? settlementAmount
    : (prescribedFinalAmount ?? chargeableAmount)

  const shouldPreferPrescribedDisplay =
    pendingProductChange == null &&
    chargeableAmountSource === "prescribed_medicine" &&
    prescribedDisplayTotal != null

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

  const calculatedTotal = hasBreakdown
    ? ((productSubtotalAfterDiscount ?? 0) + (shippingFee ?? 0))
    : totalAmount

  const previewTotal = pendingProductChange != null
    ? pendingProductChange.newAmount
    : (shouldPreferPrescribedDisplay ? prescribedDisplayTotal : calculatedTotal)

  const previewNetTotal = previewTotal != null
    ? (shouldPreferPrescribedDisplay ? previewTotal : Math.max(0, previewTotal - refundedAmount))
    : netTotalAmount

  // In split-capture rows, prefer explicit base/supplemental contract fields and
  // fall back to the displayed prescribed total only if the component amounts are
  // unavailable on older records.
  const effectivePrescribedTotalForSplit =
    hasSplitSettlement
      ? (shouldPreferPrescribedDisplay ? prescribedDisplayTotal : previewTotal)
      : null
  const splitComponentCapturedTotal =
    (baseCapturedAmount ?? 0) + (supplementalCapturedAmount ?? 0)
  const hasStandaloneFullCapture =
    hasSplitSettlement &&
    settlementState === "captured" &&
    standaloneCapturedAmount > 0 &&
    effectivePrescribedTotalForSplit != null &&
    standaloneCapturedAmount >= Math.max(0, effectivePrescribedTotalForSplit - 0.01)
  const splitCapturedSoFar = hasStandaloneFullCapture
    ? standaloneCapturedAmount
    : splitComponentCapturedTotal
  const derivedRemainingSupplemental =
    hasSplitSettlement && effectivePrescribedTotalForSplit != null
      ? Math.max(0, effectivePrescribedTotalForSplit - splitCapturedSoFar)
      : null
  const splitRemainingBaseAmount = hasSplitSettlement
    ? hasStandaloneFullCapture
      ? 0
      : Math.max(0, (baseCaptureAmount ?? 0) - (baseCapturedAmount ?? 0))
    : null
  const splitRemainingSupplementalAmount = hasSplitSettlement
    ? hasStandaloneFullCapture
      ? 0
      : Math.max(0, (supplementalDeltaAmount ?? 0) - (supplementalCapturedAmount ?? 0))
    : null
  const remainingToCaptureAmount = hasSplitSettlement
    ? (
      splitRemainingBaseAmount != null && splitRemainingSupplementalAmount != null
        ? splitRemainingBaseAmount + splitRemainingSupplementalAmount
        : (derivedRemainingSupplemental != null ? derivedRemainingSupplemental : rawRemainingSupplementalAmount)
    )
    : (derivedRemainingSupplemental != null ? derivedRemainingSupplemental : rawRemainingSupplementalAmount)
  const hasRemainingToCapture =
    isPrescribedStatus && remainingToCaptureAmount != null && remainingToCaptureAmount > 0

  const baseCapturedDisplay = hasSplitSettlement
    ? formatMoney(baseCapturedAmount ?? 0)
    : null
  const supplementalCapturedDisplay = hasSplitSettlement
    ? formatMoney(supplementalCapturedAmount ?? 0)
    : null
  const prescribedFinalDisplay = hasSplitSettlement
    ? formatMoney(effectivePrescribedTotalForSplit ?? prescribedFinalAmount ?? 0)
    : null
  const splitRemainingBaseDisplay = hasSplitSettlement
    ? formatMoney(splitRemainingBaseAmount ?? 0)
    : "0.00"
  const splitRemainingSupplementalDisplay = hasSplitSettlement
    ? formatMoney(splitRemainingSupplementalAmount ?? 0)
    : "0.00"
  const splitRemainingTotalDisplay = hasSplitSettlement
    ? formatMoney(remainingToCaptureAmount ?? 0)
    : "0.00"

  const retryAmount = hasRemainingToCapture
    ? remainingToCaptureAmount
    : (totalAmount ?? previewTotal ?? netTotalAmount)
  const canRetryPayment = hasRemainingToCapture || baseRetryEligibility
  const paymentInfoAmount = hasSplitSettlement
    ? formatMoney(splitCapturedSoFar)
    : hasRemainingToCapture
      ? formatMoney(remainingToCaptureAmount)
      : formatMoney(previewNetTotal)
  const paymentInfoAmountLabel = hasSplitSettlement
    ? "Captured total"
    : (hasRemainingToCapture ? "Remaining to Capture" : "Amount")

  const displayQuantity = String(qty)
  const requestedMedicineName =
    order.requested_medicines?.[0]?.name ||
    order.product_name ||
    "—"
  const rawPrescribedMedicineName =
    order.prescribed_pricing_summary?.items?.length
      ? order.prescribed_pricing_summary.items.map((item: any) => `${item.name}${Number(item.quantity) > 1 ? ` (x${item.quantity})` : ''}`).join(", ")
      : order.prescribed_medicines?.[0]?.name ||
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

  const showFullSplitLayout =
    pendingProductChange == null &&
    (chargeableAmountSource === "prescribed_medicine" || isLikelyLegacyPrescribed || (order.prescribed_medicines && order.prescribed_medicines.length > 0))

  const isPrescribed = chargeableAmountSource === "prescribed_medicine"
  const displayProductName = pendingProductChange?.productName
    || prescribedMedicineName
    || order.product_name
    || "—"
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

  const renderHistoryMedication = (med: PrescriptionHistoryMedication, index: number) => (
    <div key={`${med.med_id || med.product_name || "med"}-${index}`} className="border-t border-slate-200 pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0">
      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        {med.product_name || med.medication || "Prescription"}
      </span>
      <div className="mt-2 space-y-1.5 text-xs">
        <div className="flex justify-between gap-4"><span className="text-slate-400">Medication</span><span className="text-right text-slate-700">{med.medication || "—"}</span></div>
        <div className="flex justify-between gap-4"><span className="text-slate-400">Pharmacy</span><span className="text-right text-slate-700">{med.pharmacy_name || "—"}</span></div>
        <div className="flex justify-between gap-4"><span className="text-slate-400">Qty / Refills / Strength</span><span className="text-right text-slate-700">{[med.quantity, med.refills, med.strength].filter(Boolean).join(" · ") || "—"}</span></div>
        <div className="flex justify-between gap-4"><span className="text-slate-400">RX ID</span><span className="text-right font-mono text-[11px] text-slate-700">{med.rx_id || "—"}</span></div>
        <div className="flex justify-between gap-4"><span className="text-slate-400">Med ID</span><span className="max-w-[65%] break-all text-right font-mono text-[11px] text-slate-700">{med.med_id || "—"}</span></div>
      </div>
    </div>
  )

  const renderHistoryEvent = (event: PrescriptionHistoryEvent, index: number) => {
    const requested = event.kind === "requested_at_checkout"
    const badgeClass = requested
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : event.label === "Initial Prescription"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-blue-200 bg-blue-50 text-blue-700"
    return (
      <div key={`${event.event_id || event.kind}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>{event.label}</span>
          <span className="text-[11px] text-slate-400 whitespace-nowrap">{formatDateTime(event.occurred_at)}</span>
        </div>
        <div className="mt-3 flex items-center gap-2 border-b border-slate-200 pb-3">
          <Avatar className="h-6 w-6"><AvatarFallback className={requested ? "bg-violet-100 text-violet-700 text-[10px]" : "bg-cyan-100 text-cyan-700 text-[10px]"}>{(event.actor_name || "P").slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
          <span className="text-sm font-semibold text-slate-900">{event.actor_name || (requested ? "Patient" : "Provider")}</span>
          <span className="text-xs text-slate-400">{event.actor_role || (requested ? "Patient" : "Provider")}</span>
        </div>
        {requested ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {event.medications.map((med, medIndex) => (
              <span key={`${med.product_name || "product"}-${medIndex}`} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                {med.product_name || med.medication || "Prescription"}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-3">{event.medications.map(renderHistoryMedication)}</div>
        )}
        {!requested && event.event_id && (
          <div className="mt-3 flex justify-between gap-4 border-t border-slate-200 pt-3 text-xs">
            <span className="text-slate-400">Event ID</span>
            <span className="break-all text-right font-mono text-[11px] text-slate-700">{event.event_id}</span>
          </div>
        )}
      </div>
    )
  }

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

  const displayItemOriginalUnitPrice = pendingProductChange != null
    ? pendingProductChange.unitPrice
    : (medicationOriginalSubtotal != null ? medicationOriginalSubtotal / quantity : null)

  const prescribedProductOriginalAmount = showFullSplitLayout
    ? Math.max(0, (previewTotal ?? 0) - (previewShippingFee ?? 0)) + previewDiscountAmount
    : null
  const displayLineTotal = prescribedProductOriginalAmount != null
    ? prescribedProductOriginalAmount
    : (displayItemOriginalUnitPrice != null
      ? displayItemOriginalUnitPrice * quantity
      : (previewOriginalPrice ?? 0))
  const requestedProductAmount =
    parseMoney(order.requested_medicines?.[0]?.price) ??
    (parseMoney(order.pricing?.subtotal_before_discount ?? order.original_price) != null
      ? parseMoney(order.pricing?.subtotal_before_discount ?? order.original_price)! / Math.max(quantity, 1)
      : null) ??
    0
  const requestedProductShippingAmount =
    parseMoney(order.requested_medicines?.[0]?.shipping_fee) ??
    0

  const itemPrice = formatMoney(displayItemUnitPrice)
  const lineTotalPrice = formatMoney(displayLineTotal)
  const productSubtotalPrice = formatMoney(
    shouldPreferPrescribedDisplay
      ? Math.max(0, (previewTotal ?? 0) - (previewShippingFee ?? 0))
      : (previewProductSubtotal != null ? previewProductSubtotal : productSubtotalAfterDiscount)
  )
  const totalPrice = formatMoney(previewTotal)
  const netTotalPrice = formatMoney(previewNetTotal)
  const netCollectedPrice = formatMoney(netCollectedAmount ?? previewNetTotal)

  const TimelineIcon = ({ name, iconBg }: { name: TimelineItem["icon"]; iconBg: string }) => {
    const iconMap = {
      schedule: Calendar,
      payments: CreditCard,
      prescriptions: FileText,
      medical_services: Stethoscope,
      local_shipping: Truck,
      event: Calendar,
      credit_card: CreditCard,
      description: FileText,
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
  const retryAmountLabel = hasSplitSettlement
    ? "Total remaining to capture"
    : (hasRemainingToCapture ? "Remaining to capture" : "Amount to retry")
  const retryModalDescription = hasSplitSettlement
    ? (
      (splitRemainingBaseAmount ?? 0) > 0 && (splitRemainingSupplementalAmount ?? 0) > 0
        ? `This retry charges the remaining base and supplemental split amounts via ${retryGatewayLabel}.`
        : (splitRemainingBaseAmount ?? 0) > 0
          ? `This retry charges the remaining base amount via ${retryGatewayLabel}.`
          : `This retry charges the remaining supplemental amount via ${retryGatewayLabel}.`
    )
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
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <OrderHeaderCard
        order={order}
        onTrackThread={handleTrackThread}
        onSendCheckoutLink={handleSendCheckoutLink}
        onResendReceipt={handleResendReceipt}
        onDownloadReceipt={handleDownloadReceipt}
        onOpenStatusModal={() => setShowStatusDialog(true)}
        sendCheckoutLinkLoading={sendCheckoutLinkLoading}
        resendReceiptLoading={resendReceiptLoading}
        downloadReceiptLoading={downloadReceiptLoading}
        canUseReceipt={canUseReceipt}
      />

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Primary Operational Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Treatment Routing & Multi-Treatment Aggregate */}
          <TreatmentRoutingSection order={order} />

          {/* Products & Line Items Section */}
          <OrderProductsSection
            order={order}
            selectedProductId={selectedProductId}
            onSelectProduct={setSelectedProductId}
            canChangeProduct={canChangeProduct}
            changeProductTooltip={changeProductTooltip}
            onChangeProductClick={() => setShowChangeProductModal(true)}
            pendingProductChange={pendingProductChange}
          />

          {/* Pricing Breakdown & Split Capture */}
          <OrderPricingBreakdown
            order={order}
            selectedProductId={selectedProductId}
            onSelectProduct={setSelectedProductId}
          />

          {/* B2B Client Reimbursement Section */}
          <ClientReimbursementSection
            order={order}
            selectedProductId={selectedProductId}
          />

          {/* Clinical & System Metadata */}
          <OrderMetadataSection order={order} />


              {/* Prescribed Block */}
              <div className="px-6 py-1 mt-1">
                {!showFullSplitLayout ? (
                  <div className="text-[11px] font-bold tracking-wide uppercase text-slate-500 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                    Prescribed (Latest)
                    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border normal-case tracking-normal bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                      Awaiting provider decision
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="text-[11px] font-bold tracking-wide uppercase text-slate-500 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                      Prescribed (Latest)
                      {order.prescribed_pricing_summary?.items?.length > 0 ? (
                        order.prescribed_pricing_summary.items.map((item: any, idx: number) => (
                          <span key={idx} className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border normal-case tracking-normal bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                            {item.name} {Number(item.quantity) > 1 ? `(x${item.quantity})` : ""}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border normal-case tracking-normal bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                          {prescribedMedicineDisplayName}
                        </span>
                      )}
                      {showFullSplitLayout && (
                        <button
                          type="button"
                          onClick={openPrescriptionHistory}
                          className="text-xs font-medium normal-case tracking-normal text-blue-600 hover:underline whitespace-nowrap"
                        >
                          {revisionCount > 0
                            ? `${revisionCount} ${revisionCount === 1 ? "revision" : "revisions"} — view history`
                            : "view history"}
                        </button>
                      )}
                    </div>
                    {order.billing_pending_reason === "prescription_mapping_unresolved" ? (
                      <>
                        <div className="flex justify-between items-center py-1.5 text-[13.5px]">
                          <span className="text-slate-500 dark:text-slate-400">Product amount</span>
                          <span className="font-semibold tabular-nums text-slate-900 dark:text-white">—</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 text-[13.5px]">
                          <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                          <span className="font-semibold tabular-nums text-slate-900 dark:text-white">—</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 text-[13.5px]">
                          <span className="text-slate-500 dark:text-slate-400">Shipping</span>
                          <span className="font-semibold tabular-nums text-slate-900 dark:text-white">—</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 text-[13.5px] border-t border-slate-100 dark:border-slate-800 mt-0.5">
                          <span className="text-slate-900 dark:text-white font-bold">Prescribed total</span>
                          <span className="text-slate-900 dark:text-white font-bold tabular-nums">—</span>
                        </div>
                      </>
                    ) : (
                      <>
                        {order.prescribed_pricing_summary?.items?.length > 0 ? (
                          order.prescribed_pricing_summary.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center py-1.5 text-[13.5px]">
                              <span className="text-slate-500 dark:text-slate-400">
                                {item.name} {Number(item.quantity) > 1 ? `(x${item.quantity})` : ""}
                              </span>
                              <span className="font-semibold tabular-nums text-slate-900 dark:text-white">${formatMoney(Number(item.subtotal))}</span>
                            </div>
                          ))
                        ) : (
                          <div className="flex justify-between items-center py-1.5 text-[13.5px]">
                            <span className="text-slate-500 dark:text-slate-400">Product amount</span>
                            <span className="font-semibold tabular-nums text-slate-900 dark:text-white">${formatMoney(prescribedProductOriginalAmount)}</span>
                          </div>
                        )}
                        {(Number(order.prescribed_pricing_summary?.coupon_discount || previewDiscountAmount)) > 0 && (
                          <div className="flex justify-between items-center py-1.5 text-[13.5px]">
                            <span className="text-slate-500 dark:text-slate-400">Discount{appliedCouponCodes ? ` (${appliedCouponCodes})` : ""}</span>
                            <span className="font-semibold tabular-nums text-green-600 dark:text-green-400">−${Number(order.prescribed_pricing_summary?.coupon_discount || previewDiscountAmount).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center py-1.5 text-[13.5px]">
                          <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                          <span className="font-semibold tabular-nums text-slate-900 dark:text-white">${order.prescribed_pricing_summary ? formatMoney(Number(order.prescribed_pricing_summary.subtotal)) : productSubtotalPrice}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 text-[13.5px]">
                          <span className="text-slate-500 dark:text-slate-400">Shipping</span>
                          <span className="font-semibold tabular-nums text-slate-900 dark:text-white">${formatMoney(Number(order.prescribed_pricing_summary?.shipping || previewShippingFee))}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 text-[13.5px] border-t border-slate-100 dark:border-slate-800 mt-0.5">
                          <span className="text-slate-900 dark:text-white font-bold">Prescribed total</span>
                          <span className="text-slate-900 dark:text-white font-bold tabular-nums">${order.prescribed_pricing_summary ? formatMoney(Number(order.prescribed_pricing_summary.final_total)) : (prescribedFinalDisplay ?? totalPrice)}</span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
          {/* Order Activity & History Timeline */}
          <OrderTimelineCard order={order} />
        </div>

        {/* Right Sidebar Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Medical Details Card */}
          <OrderMedicalCard order={order} />
          {/* Prescription & Fulfillment */}
          <div className="bg-card rounded-xl shadow-sm border p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                Prescription & Fulfillment
              </h3>
              {order.visitStatus && (
                <button type="button" onClick={openPrescriptionHistory} className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap">
                  View Change History
                </button>
              )}
            </div>
            {status === 'processing' || status === 'created' || status === 'payment_pending' ? (
              <div className="bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 text-xs font-semibold py-1.5 px-3 rounded-lg mb-4 text-center">
                Consult scheduled — not yet fulfilled
              </div>
            ) : order.tracking_number ? (
              <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg border mb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tracking</span>
                  <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{order.tracking_number}</span>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400">
                  Shipped
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg border mb-4">
                <span className="text-sm font-semibold text-slate-600">No tracking info</span>
              </div>
            )}
          {/* Patient Details Card */}
          <OrderPatientCard
            order={order}
            onOpenPatientResponses={() => setShowPatientResponses(true)}
          />

          {/* Pharmacy & Fulfillment Card */}
          <OrderPharmacyCard order={order} />

          {/* Payment Card & Actions */}
          <OrderPaymentCard
            order={order}
            canRefundOrVoid={canRefundOrVoid}
            canRetryPayment={canRetryPayment}
            isAuthorized={isAuthorized}
            isRefundable={isRefundable}
            onRefundClick={() => setShowRefundDialog(true)}
            onRetryClick={() => setShowRetryPaymentDialog(true)}
          />
        </div>
      </div>
      </div>

      {/* Modals & Dialogs */}
      <RefundVoidModal
        open={showRefundDialog}
        onOpenChange={setShowRefundDialog}
        order={order}
        onSubmit={handleRefundSubmit}
        loading={refundLoading}
        remainingRefundable={remainingRefundable}
        baseRemainingRefundable={baseRemainingRefundable}
        supplementalRemainingRefundable={supplementalRemainingRefundable}
        isAuthorized={isAuthorized}
        isRefundable={isRefundable}
      />

      <UpdateStatusModal
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        currentStatus={status}
        onSubmit={handleStatusUpdateSubmit}
        loading={statusUpdateLoading}
      />

      <RetryPaymentModal
        open={showRetryPaymentDialog}
        onOpenChange={setShowRetryPaymentDialog}
        paymentMethods={paymentMethods}
        loadingMethods={paymentMethodsLoading}
        methodsError={paymentMethodsError}
        onSubmit={handleRetryPaymentSubmit}
        retryLoading={retryPaymentLoading}
        retryAmount={remainingRefundable || parseFloat(order.amount || "0")}
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
            {isRefundable && supplementalRemainingRefundable > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Refund Target</label>
                <Select
                  value={refundTarget}
                  onValueChange={(value: "auto" | "base" | "supplemental") => setRefundTarget(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="base">Refund Base</SelectItem>
                    <SelectItem value="supplemental">Refund Supplemental</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Base refundable: ${baseRemainingRefundable.toFixed(2)}</p>
                  <p>Supplemental refundable: ${supplementalRemainingRefundable.toFixed(2)}</p>
                  <p>Total remaining refundable: ${remainingRefundable.toFixed(2)}</p>
                </div>
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
                  {(["shipped", "canceled"] as const).map((value) => (
                    <SelectItem key={value} value={value}>
                      {statusLabels[value] || value}
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

      <Sheet open={showPrescriptionHistory} onOpenChange={setShowPrescriptionHistory}>
        <SheetContent side="right" className="w-full sm:max-w-[560px] p-0 bg-slate-50">
          <SheetHeader className="border-b bg-white px-6 py-5 text-left">
            <SheetTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Prescription Change History</SheetTitle>
            <SheetDescription className="space-y-1 text-left">
              <span className="block text-base font-semibold text-slate-900">Order {orderTitle}</span>
              <span className="block text-xs text-slate-400">
                {order.name || prescriptionHistory?.patient_name || "Patient"} · {prescriptionHistory?.prescription_event_count || 0} prescription events · {prescriptionHistory?.revision_count || 0} revisions
              </span>
            </SheetDescription>
          </SheetHeader>
          <div className="h-[calc(100vh-118px)] overflow-y-auto px-4 py-4">
            {prescriptionHistoryLoading && (
              <div className="flex items-center justify-center py-16 text-sm text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading history...</div>
            )}
            {!prescriptionHistoryLoading && prescriptionHistoryError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{prescriptionHistoryError}</div>
            )}
            {!prescriptionHistoryLoading && !prescriptionHistoryError && prescriptionHistory && prescriptionHistory.events.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No persisted prescription history is available for this order.</div>
            )}
            {!prescriptionHistoryLoading && !prescriptionHistoryError && prescriptionHistory && prescriptionHistory.events.length > 0 && (
              <div className="space-y-3">{prescriptionHistory.events.map(renderHistoryEvent)}</div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <PatientResponsesModal
        open={showPatientResponses}
        onOpenChange={setShowPatientResponses}
        patientResponses={order.patient_responses}
        intakeResponseSummary={order.intake_response_summary}
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
      {showChangeProductModal && (
        <ChangeProductModal
          open={showChangeProductModal}
          onOpenChange={setShowChangeProductModal}
          order={order}
          onProductChanged={(updatedOrder) => {
            setOrder(updatedOrder as Order)
            toast({ title: "Product changed successfully" })
          }}
        />
      )}
    </div>
  )
}
