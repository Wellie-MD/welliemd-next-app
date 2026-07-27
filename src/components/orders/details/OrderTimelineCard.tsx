import React from "react"
import { Order, OrderActivityEvent } from "@/api/ordersApi"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  CreditCard,
  FileText,
  Stethoscope,
  Truck,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
} from "lucide-react"

interface TimelineItem {
  title: string
  date: string
  description?: string
  icon: "schedule" | "payments" | "prescriptions" | "medical_services" | "local_shipping"
  iconBg: string
  badgeText?: string
  actions?: Array<{ label: string; url: string }>
}

interface OrderTimelineCardProps {
  order: Order
}

const formatDateTime = (dateString?: string | null) => {
  if (!dateString) return "—"
  try {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return dateString
  }
}

export const OrderTimelineCard: React.FC<OrderTimelineCardProps> = ({ order }) => {
  const timelineItems: TimelineItem[] = React.useMemo(() => {
    // 1. Process activity_events if present
    if (Array.isArray(order.activity_events) && order.activity_events.length > 0) {
      return order.activity_events.map((evt) => {
        const payload = (evt.payload && typeof evt.payload === "object") ? (evt.payload as Record<string, unknown>) : {}
        const status = (evt.status || "").toLowerCase()
        const eventType = (evt.event_type || "").toLowerCase()

        let icon: TimelineItem["icon"] = "schedule"
        let iconBg = "bg-primary/10 text-primary border-primary/20"

        if (status.includes("payment") || eventType.includes("payment")) {
          icon = "payments"
          iconBg = "bg-primary/10 text-primary border-primary/20"
        } else if (eventType.startsWith("lab.") || eventType.includes("lab_")) {
          icon = "medical_services"
          iconBg = "bg-primary/10 text-primary border-primary/20"
        } else if (status === "prescribed" || status === "rx_sent" || status === "referred") {
          icon = "prescriptions"
          iconBg = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
        } else if (status.includes("shipped") || status.includes("delivered")) {
          icon = "local_shipping"
          iconBg = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
        }

        const toUrl = (raw: unknown): string | null => {
          if (typeof raw !== "string") return null
          const trimmed = raw.trim()
          if (!trimmed) return null
          if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:application/pdf;base64,")) return trimmed
          return null
        }

        const pick = (obj: Record<string, unknown>, ...keys: string[]): string | null => {
          for (const key of keys) {
            const value = obj[key]
            if (typeof value === "string" && value.trim()) return value.trim()
          }
          return null
        }

        const info = payload.info && typeof payload.info === "object" ? (payload.info as Record<string, unknown>) : {}
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
          (payload.info && typeof payload.info === "object"
            ? toUrl((payload.info as Record<string, unknown>).trackingUrl) ||
              toUrl((payload.info as Record<string, unknown>).tracking_url)
            : null)

        const trackingNumber = pick(payload, "trackingNumber", "tracking") || pick(info, "tracking")
        const carrier = pick(payload, "carrier") || pick(info, "carrier")

        const actions: Array<{ label: string; url: string }> = []
        if (requisitionUrl) actions.push({ label: "Requisition PDF", url: requisitionUrl })
        if (bookingUrl) actions.push({ label: "Book Consult", url: bookingUrl })
        if (trackingUrl) actions.push({ label: "Track Package", url: trackingUrl })
        else if (trackingNumber) {
          const carrierLower = (carrier || "").toLowerCase()
          const fallbackTrackingUrl = carrierLower.includes("fedex")
            ? `https://www.fedex.com/en-us/tracking.html?tracknumbers=${encodeURIComponent(trackingNumber)}`
            : carrierLower.includes("ups")
              ? `https://www.ups.com/track?tracknum=${encodeURIComponent(trackingNumber)}`
              : `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(trackingNumber)}`
          actions.push({ label: carrier ? `Track ${carrier}` : "Track Shipment", url: fallbackTrackingUrl })
        }

        const resultPdfUrl = toUrl(payload.resultPdfUrl) || toUrl(payload.result_pdf_url)
        if (resultPdfUrl) actions.push({ label: "Lab Report PDF", url: resultPdfUrl })

        // Clean event titles
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

        let cleanDesc = evt.description || ""
        if (evt.event_type === "rx_revision" && cleanDesc.includes("Newly prescribed: ")) {
          const match = cleanDesc.match(/Newly prescribed:\s*([\s\S]*?)(?=(?:\.\s*|\n)(?:Supplemental|Refund)|$)/)
          if (match) {
            cleanDesc = `Prescribed: ${match[1].trim()}`
          }
        }

        return {
          title: rawTitle,
          date: formatDateTime(evt.occurred_at),
          description: cleanDesc,
          icon,
          iconBg,
          badgeText: evt.event_type.split(".").pop(),
          actions,
        }
      })
    }

    // 2. Fallback milestone timeline
    const items: TimelineItem[] = []
    if (order.datePrintedShipped) {
      items.push({
        title: "Rx Sent to Pharmacy",
        date: formatDateTime(order.datePrintedShipped),
        description: order.product_name ? `Prescription sent for ${order.product_name}` : undefined,
        icon: "prescriptions",
        iconBg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300",
      })
    }
    if (order.paymentDate) {
      items.push({
        title: "Payment Processed",
        date: formatDateTime(order.paymentDate),
        icon: "payments",
        iconBg: "bg-primary/10 text-primary border-primary/20",
      })
    }
    if (order.datePrescribed) {
      items.push({
        title: "Medication Prescribed",
        date: formatDateTime(order.datePrescribed),
        description: order.product_name || undefined,
        icon: "prescriptions",
        iconBg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300",
      })
    }
    if (order.orderDate) {
      items.push({
        title: "Order Placed via Questionnaire",
        date: formatDateTime(order.orderDate),
        icon: "schedule",
        iconBg: "bg-primary/10 text-primary border-primary/20",
      })
    }
    return items
  }, [order])

  const renderIcon = (iconName: TimelineItem["icon"]) => {
    switch (iconName) {
      case "payments":
        return <CreditCard className="h-3.5 w-3.5" />
      case "prescriptions":
        return <FileText className="h-3.5 w-3.5" />
      case "medical_services":
        return <FlaskConical className="h-3.5 w-3.5" />
      case "local_shipping":
        return <Truck className="h-3.5 w-3.5" />
      default:
        return <Calendar className="h-3.5 w-3.5" />
    }
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <Clock className="h-4 w-4 text-primary" />
          <span>Activity & Event History</span>
        </div>
        <Badge variant="outline" className="text-xs font-medium">
          {timelineItems.length} Milestones
        </Badge>
      </div>

      <div className="p-6">
        <div className="space-y-0 relative">
          {timelineItems.map((item, idx) => {
            const isLast = idx === timelineItems.length - 1
            return (
              <div key={idx} className="relative flex items-start gap-4 group pb-6 last:pb-0">
                {/* Left Connector Thread */}
                <div className="flex flex-col items-center self-stretch">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center border shadow-xs flex-shrink-0 z-10 ${item.iconBg}`}
                  >
                    {renderIcon(item.icon)}
                  </div>

                  {!isLast && (
                    <div className="w-0.5 flex-1 bg-border/80 my-1.5 min-h-[32px]" />
                  )}
                </div>

                {/* Event Details Card Container */}
                <div className="flex-1 bg-muted/20 border border-border rounded-xl p-4 space-y-2 hover:bg-muted/40 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                        {item.title}
                      </h4>
                      {item.badgeText && (
                        <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
                          {item.badgeText}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {item.date}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {item.description}
                    </p>
                  )}

                  {item.actions && item.actions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                      {item.actions.map((act, actIdx) => (
                        <a
                          key={actIdx}
                          href={act.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          <span>{act.label}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
