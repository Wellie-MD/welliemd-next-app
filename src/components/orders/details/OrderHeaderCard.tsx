import React from "react"
import { Link } from "react-router-dom"
import { Order } from "@/api/ordersApi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  MessageSquare,
  Mail,
  Receipt,
  Download,
  Edit,
  Truck,
  Stethoscope,
  Calendar,
  XCircle,
  AlertCircle,
  CheckCircle2,
  RotateCw,
  Loader2,
  AlertTriangle,
} from "lucide-react"

const statusColors: Record<string, string> = {
  created: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700",
  processing: "bg-primary/10 text-primary border-primary/20",
  visit_failed: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  payment_pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  visit_pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  consult_scheduled: "bg-primary/10 text-primary border-primary/20",
  consult_rescheduled: "bg-primary/10 text-primary border-primary/20",
  consult_canceled: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  no_show: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  referred: "bg-primary/10 text-primary border-primary/20",
  prescribed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  billing_pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  rx_sent: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  shipped: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  in_transit: "bg-primary/10 text-primary border-primary/20",
  out_for_delivery: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  delivery_failed: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  canceled: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800",
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

interface OrderHeaderCardProps {
  order: Order
  onTrackThread: () => void
  onSendCheckoutLink: () => void
  onResendReceipt: () => void
  onDownloadReceipt: () => void
  onOpenStatusModal: () => void
  sendCheckoutLinkLoading: boolean
  resendReceiptLoading: boolean
  downloadReceiptLoading: boolean
  canUseReceipt: boolean
}

export const OrderHeaderCard: React.FC<OrderHeaderCardProps> = ({
  order,
  onTrackThread,
  onSendCheckoutLink,
  onResendReceipt,
  onDownloadReceipt,
  onOpenStatusModal,
  sendCheckoutLinkLoading,
  resendReceiptLoading,
  downloadReceiptLoading,
  canUseReceipt,
}) => {
  const status = order.orderStatus || order.status || "created"
  const statusDisplay = statusLabels[status] || status
  const orderTitle = order.order_id
    ? `#${order.order_id}`
    : order.display_id
      ? `#${order.display_id}`
      : order.id?.slice(0, 8) || ""
  const isPrescribedStatus = String(status || "").toLowerCase() === "prescribed"
  const paymentRecoveryState = (order.payment_recovery_state || "").toLowerCase()
  const isRecoveryPending = isPrescribedStatus && paymentRecoveryState === "recovery_pending"

  return (
    <div className="space-y-4 mb-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/dashboard/orders" className="hover:text-primary transition-colors">
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

      {/* Main Header Container */}
      <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Side: Order Title & Badges */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
              Order {orderTitle}
            </h1>
            <Badge
              variant="outline"
              className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 border shadow-2xs ${statusColors[status] || "bg-slate-100 text-slate-700"}`}
            >
              {getStatusIcon(status)}
              <span>{statusDisplay}</span>
            </Badge>

            {isRecoveryPending && (
              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 px-2.5 py-0.5 text-xs font-medium rounded-full flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                <span>Recovery Pending</span>
              </Badge>
            )}
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground">
            Created on {order.orderDate ? new Date(order.orderDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
            {order.patient?.full_name ? ` for ${order.patient.full_name}` : ""}
          </p>
        </div>

        {/* Right Side: Quick Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onTrackThread}
                className="h-9 px-3 text-xs font-medium gap-1.5 rounded-lg border-primary/20 text-slate-700 dark:text-slate-200 hover:bg-primary/5 hover:text-primary"
              >
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">Message Thread</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open chat thread with patient</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onSendCheckoutLink}
                disabled={sendCheckoutLinkLoading}
                className="h-9 px-3 text-xs font-medium gap-1.5 rounded-lg border-primary/20 text-slate-700 dark:text-slate-200 hover:bg-primary/5 hover:text-primary"
              >
                {sendCheckoutLinkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-4 w-4 text-primary" />}
                <span className="hidden sm:inline">Send Checkout Email</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Email patient direct checkout link</TooltipContent>
          </Tooltip>

          {canUseReceipt && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onResendReceipt}
                    disabled={resendReceiptLoading}
                    className="h-9 px-3 text-xs font-medium gap-1.5 rounded-lg border-primary/20 text-slate-700 dark:text-slate-200 hover:bg-primary/5 hover:text-primary"
                  >
                    {resendReceiptLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Receipt className="h-4 w-4 text-primary" />}
                    <span className="hidden sm:inline">Resend Receipt</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Email payment receipt to patient</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDownloadReceipt}
                    disabled={downloadReceiptLoading}
                    className="h-9 px-3 text-xs font-medium gap-1.5 rounded-lg border-primary/20 text-slate-700 dark:text-slate-200 hover:bg-primary/5 hover:text-primary"
                  >
                    {downloadReceiptLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-4 w-4 text-primary" />}
                    <span className="hidden sm:inline">Download Receipt</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download receipt PDF</TooltipContent>
              </Tooltip>
            </>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={onOpenStatusModal}
            className="h-9 px-3 text-xs font-medium gap-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Update Status</span>
          </Button>
        </div>
      </div>

      {/* Recovery Pending Alert Banner */}
      {isRecoveryPending && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 flex items-start gap-3 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <span className="font-semibold">Payment Recovery Pending:</span> This prescribed order has a supplemental charge hold or pending recovery settlement. Staff can retry payment using a saved card below.
          </div>
        </div>
      )}
    </div>
  )
}
