import { useState, useEffect, useMemo, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Order, ordersApi } from "@/api/ordersApi"
import { paymentGatewayApi } from "@/api/paymentGatewayApi"
import { patientPaymentMethodsApi, PatientPaymentMethod, PatientPaymentGateway } from "@/api/patientPaymentMethodsApi"
import { useToast } from "@/hooks/use-toast"
import { useClientMessages } from "@/contexts/MessagesContext"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

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
import { OrderSupportNotesSection } from "@/components/orders/details/OrderSupportNotesSection"
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
  const [refundLoading, setRefundLoading] = useState(false)
  const [showChangeProductModal, setShowChangeProductModal] = useState(false)
  const [pendingProductChange, setPendingProductChange] = useState<PendingProductChange | null>(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false)
  const [showRetryPaymentDialog, setShowRetryPaymentDialog] = useState(false)

  // Retry payment state
  const [paymentMethods, setPaymentMethods] = useState<PatientPaymentMethod[]>([])
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false)
  const [paymentMethodsError, setPaymentMethodsError] = useState<string | null>(null)
  const [retryPaymentLoading, setRetryPaymentLoading] = useState(false)
  const [retryGateway, setRetryGateway] = useState<PatientPaymentGateway | null>(null)
  const retrySingleFlightRef = useRef(false)

  // Quick actions loading states
  const [sendCheckoutLinkLoading, setSendCheckoutLinkLoading] = useState(false)
  const [resendReceiptLoading, setResendReceiptLoading] = useState(false)
  const [downloadReceiptLoading, setDownloadReceiptLoading] = useState(false)

  const { toast } = useToast()
  const { conversations: messages = [], conversationsLoading } = useClientMessages()

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

  // Calculated values
  const status = order.orderStatus || order.status || "created"
  const paymentStatus = (order.paymentStatus || "").toLowerCase()
  const remainingRefundable = order?.refundableAmount ? parseFloat(order.refundableAmount) || 0 : 0
  const baseRemainingRefundable = order?.baseRefundableAmount ? parseFloat(order.baseRefundableAmount) || 0 : 0
  const supplementalRemainingRefundable = order?.supplementalRefundableAmount ? parseFloat(order.supplementalRefundableAmount) || 0 : 0

  const isAuthorized = paymentStatus === "authorized"
  const isRefundable = remainingRefundable > 0
  const isLocked = isAuthorized || isRefundable
  const isAllowedStatus = status === "created" || status === "payment_pending"
  const canChangeProduct = isAllowedStatus && !isLocked
  const canRefundOrVoid = isAuthorized || isRefundable
  const canUseReceipt = ["captured", "approved", "succeeded", "refunded"].includes(paymentStatus)
  const canRetryPayment = !isRefundable && status === "payment_pending"

  const changeProductTooltip =
    "Product change is available only while order status is Created or Payment Pending and payment status is Pending."

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

          {/* Support Notes & Audit Logs */}
          <OrderSupportNotesSection order={order} />

          {/* Order Activity & History Timeline */}
          <OrderTimelineCard order={order} />
        </div>

        {/* Right Sidebar Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Medical Details Card */}
          <OrderMedicalCard order={order} />

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

      {showPatientResponses && (
        <PatientResponsesModal
          open={showPatientResponses}
          onOpenChange={setShowPatientResponses}
          patientResponses={order.patient_responses}
          intakeResponseSummary={order.intake_response_summary}
          patientName={order.patient?.full_name || order.name || "Patient"}
          checkoutUrl={order.checkout_url}
          orderId={order.id}
          onImagesSaved={(photos) => {
            setOrder((previous) => previous ? {
              ...previous,
              patient_responses: {
                ...(previous.patient_responses || {}),
                photos,
              },
            } : previous)
          }}
        />
      )}

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
