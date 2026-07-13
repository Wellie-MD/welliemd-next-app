import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import LabResultsTable from "@/features/labs/components/LabResultsTable";
import LabOrderDetailRightColumn from "@/features/labs/components/LabOrderDetailRightColumn";
import LabOrderTimeline from "@/features/labs/components/LabOrderTimeline";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useToast } from "@/hooks/use-toast"
import { clientLabsApi } from "@/features/labs/api"
import type { LabOrderView } from "@/features/labs/types"
import { formatLabCollectionMethod, formatLabOrderDate } from "@/features/labs/utils/formatting"
import { humanizeLabStatus } from "@/features/labs/constants/status"
import { eventTime } from "@/features/labs/utils/lifecycle"
import { extractLabResultRows } from "@/features/labs/utils/resultRows"

const getInitials = (name?: string) => {
  if (!name) return "U"
  const parts = name.split(" ")
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

export default function LabOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [order, setOrder] = useState<LabOrderView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadingRequisition, setDownloadingRequisition] = useState(false)
  const [togglingRelease, setTogglingRelease] = useState(false)

  useEffect(() => {
    if (!orderId) {
      setError("Order ID is required")
      setLoading(false)
      return
    }
    let cancelled = false
    const loadLabOrder = async () => {
      setLoading(true)
      setError(null)
      try {
        if (!isUuid(orderId)) {
          throw new Error("Standalone lab order id must be a UUID")
        }
        const detail = await clientLabsApi.getLabOrderDetail(orderId)
        const events = detail.lifecycle_events || []
        const resultRows = extractLabResultRows(detail.result)
        if (!cancelled) {
          setOrder({
            ...detail.order,
            product_name: detail.order.lab_panel_name,
            pharmacy_display: detail.order.lab_provider,
            orderTotal: String(detail.order.total_paid),
            price: detail.order.total_paid,
            status: detail.order.order_status,
            resultsReady: detail.order.results_status?.toLowerCase().includes("result") || resultRows.length > 0,
            resultsReleased: detail.result_access_allowed,
            biomarkers: resultRows,
            timeline: {
              ordered: detail.order.created_at,
              requisition: eventTime(events, (e) => String(e.status || e.event_type || "").toLowerCase().includes("requisition")),
              appointment_pending: eventTime(events, (e) => String(e.status || e.event_type || "").toLowerCase().includes("appointment pending")),
              appointment_scheduled: eventTime(events, (e) => String(e.status || e.event_type || "").toLowerCase().includes("appointment scheduled") || String(e.status || e.event_type || "").toLowerCase().includes("booked")),
              sample_collected: eventTime(events, (event) =>
                String(event.status || event.event_type || "").toLowerCase().includes("sample")
              ),
              at_lab: eventTime(events, (e) => String(e.status || e.event_type || "").toLowerCase().includes("at lab")),
              results: eventTime(events, (event) =>
                String(event.status || event.event_type || "").toLowerCase().includes("result")
              ),
            },
            lifecycle_events: events,
            result_access_message: detail.result_access_message,
          })
        }
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } }; message?: string }
        if (!cancelled) setError(error.response?.data?.detail || error.message || "Failed to load lab order")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadLabOrder()
    return () => {
      cancelled = true
    }
  }, [orderId])

  const handleToggleReleaseResults = async () => {
    if (!orderId || !order) return
    const newReleasedState = !order.resultsReleased
    setTogglingRelease(true)
    try {
      await clientLabsApi.toggleResultAccess(orderId, newReleasedState)
      setOrder((prev) => {
        if (!prev) return prev
        return { ...prev, resultsReleased: newReleasedState }
      })
      toast({
        title: newReleasedState ? "Results Released" : "Results Gated",
        description: newReleasedState
          ? "The patient can now view their lab results in the patient portal."
          : "Patient access to these lab results has been blocked.",
      })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast({
        title: "Failed to update result access",
        description: error.response?.data?.detail ?? "Please try again.",
        variant: "destructive",
      })
    } finally {
      setTogglingRelease(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!orderId) return
    setDownloadingPdf(true)
    try {
      const blob = await clientLabsApi.getLabOrderResultPdf(orderId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `lab-result-${order?.display_id ?? orderId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast({
        title: "Download failed",
        description: error.response?.data?.detail ?? "Could not download the result PDF.",
        variant: "destructive",
      })
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleDownloadRequisition = async () => {
    if (!orderId) return
    setDownloadingRequisition(true)
    try {
      const blob = await clientLabsApi.getLabOrderRequisitionPdf(orderId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `lab-requisition-${order?.display_id ?? orderId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast({
        title: "Download failed",
        description: error.response?.data?.detail ?? "Could not download the requisition PDF.",
        variant: "destructive",
      })
    } finally {
      setDownloadingRequisition(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold text-red-600">Error</h2>
        <p className="text-slate-500 mt-2">{error || "Order not found"}</p>
        <Button onClick={() => navigate("/dashboard/orders/labs")} className="mt-4">
          Back to Lab Orders
        </Button>
      </div>
    )
  }

  const orderTitle = order.display_id || order.id
  const orderDateStr = order.orderDate || order.created_at
  const formattedOrderDate = formatLabOrderDate(orderDateStr)
  const collectionMethodLabel = formatLabCollectionMethod(order.collection_method)
  const statusLabel = humanizeLabStatus(order.ui_lab_event_label || order.results_status || order.order_status || "In Process")
  const orderStatusLabel = humanizeLabStatus(order.ui_order_status || order.order_status || "In Process")

  return (
    <div className="p-5 lg:p-6">
      {/* Breadcrumbs & Title */}
      <div className="mb-3 flex flex-col gap-1">
        <div>
          <Breadcrumb className="mb-1">
            <BreadcrumbList className="text-xs text-gray-400 dark:text-gray-500">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard/orders/labs" className="hover:text-gray-750 dark:hover:text-gray-300">
                    Orders
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-gray-400">/</BreadcrumbSeparator>
              <BreadcrumbItem>
                  <BreadcrumbPage className="font-medium text-gray-900 dark:text-white">
                  Order Details
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Order #{orderTitle}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(320px,1fr)]">
        {/* Left Column (col-span-8) */}
        <div className="space-y-5">
          
          {/* Lab Test Details Card */}
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-none dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-gray-200">Lab Test Details</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadRequisition}
                  disabled={downloadingRequisition}
                  className="h-8 gap-1 px-3 text-xs text-slate-600"
                >
                  {downloadingRequisition ? "Downloading…" : "Requisition form"}
                </Button>
                <span className="rounded border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-400">Lab</span>
              </div>
            </div>
            <div className="p-4">
              <h4 className="mb-1 text-base font-semibold text-slate-800 dark:text-gray-200">
                {order.product_name || "Lab Panel"}
              </h4>
              <p className="text-xs text-slate-400 dark:text-gray-500">
                {order.pharmacy_display || order.lab_provider || "Lab provider unavailable"} • {order.biomarkers?.length || 0} biomarkers • {collectionMethodLabel}
              </p>
              
              <div className="mt-4 space-y-3 border-t border-slate-100 pt-3 dark:border-gray-800/60">
                <div className="flex justify-between text-sm text-slate-500 dark:text-gray-400">
                  <span>Panel price</span>
                  <span className="font-semibold text-slate-800 dark:text-gray-200">
                    ${parseFloat(order.orderTotal || order.price || "0").toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-3 text-sm font-bold dark:border-gray-800">
                  <span className="text-slate-800 dark:text-gray-200">Total (USD)</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    ${parseFloat(order.orderTotal || order.price || "0").toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Status Card */}
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-none dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-gray-200">Order Status</h3>
              <span className="rounded border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-400">
                {orderStatusLabel}
              </span>
              <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {order.ui_lab_event_label || statusLabel}
              </span>
            </div>
            <div className="p-4">
              <LabOrderTimeline
                createdAt={order.created_at}
                collectionMethod={order.collection_method}
                provider={order.pharmacy_display || order.lab_provider}
                currentLabel={order.ui_lab_event_label || statusLabel}
                events={order.lifecycle_events || []}
              />
            </div>
          </div>

          {/* Lab Results Table Card */}
          <LabResultsTable
            biomarkers={order.biomarkers ?? []}
            resultsReleased={!!order.resultsReleased}
            downloadingPdf={downloadingPdf}
            onDownloadPdf={handleDownloadPdf}
            statusLabel={order.ui_lab_event_label || statusLabel}
          />
        </div>

        {/* Right Column */}
        <LabOrderDetailRightColumn
          order={order}
          formattedOrderDate={formattedOrderDate}
          togglingRelease={togglingRelease}
          onToggleRelease={handleToggleReleaseResults}
          getInitials={getInitials}
        />
      </div>
    </div>
  )
}
