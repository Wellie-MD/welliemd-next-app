import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import LabResultsTable from "@/features/labs/components/LabResultsTable";
import LabOrderDetailRightColumn from "@/features/labs/components/LabOrderDetailRightColumn";
import { cn } from "@/lib/utils"
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
import { formatLabCollectionMethod, formatLabOrderDate, formatLabTimelineDate } from "@/features/labs/utils/formatting"
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
  
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadingRequisition, setDownloadingRequisition] = useState(false)
  const [downloadingCollection, setDownloadingCollection] = useState(false)
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
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.detail || err?.message || "Failed to load lab order")
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
      setOrder((prev: any) => {
        if (!prev) return prev
        return { ...prev, resultsReleased: newReleasedState }
      })
      toast({
        title: newReleasedState ? "Results Released" : "Results Gated",
        description: newReleasedState
          ? "The patient can now view their lab results in the patient portal."
          : "Patient access to these lab results has been blocked.",
      })
    } catch (err: any) {
      toast({
        title: "Failed to update result access",
        description: err?.response?.data?.detail ?? "Please try again.",
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
    } catch (err: any) {
      toast({
        title: "Download failed",
        description: err?.response?.data?.detail ?? "Could not download the result PDF.",
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
    } catch (err: any) {
      toast({
        title: "Download failed",
        description: err?.response?.data?.detail ?? "Could not download the requisition PDF.",
        variant: "destructive",
      })
    } finally {
      setDownloadingRequisition(false)
    }
  }

  const handleDownloadCollection = async () => {
    if (!orderId) return
    setDownloadingCollection(true)
    try {
      const blob = await clientLabsApi.getLabOrderCollectionInstructionsPdf(orderId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `lab-collection-instructions-${order?.display_id ?? orderId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      toast({
        title: "Download failed",
        description: err?.response?.data?.detail ?? "Could not download the collection instructions PDF.",
        variant: "destructive",
      })
    } finally {
      setDownloadingCollection(false)
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
  const statusLabel = order.results_status || order.order_status || "In Progress"

  const timelineMilestones = [
    {
      title: "Processing",
      description: "Payment Pending → Processing",
      date: formatLabTimelineDate(order.timeline?.ordered),
      active: !!order.timeline?.ordered,
    },
    {
      title: "Ordered",
      description: `Lab order created${order.pharmacy_display || order.lab_provider ? ` with ${order.pharmacy_display || order.lab_provider}` : ""}`,
      date: formatLabTimelineDate(order.timeline?.ordered),
      active: !!order.timeline?.ordered,
    },
    {
      title: "Requisition Created",
      description: "Requisition form generated",
      date: formatLabTimelineDate(order.timeline?.requisition),
      active: !!order.timeline?.requisition || !!order.timeline?.sample_collected || order.resultsReady,
    },
    {
      title: "Appointment",
      description: "Patient appointment booking",
      date: formatLabTimelineDate(order.timeline?.appointment_scheduled || order.timeline?.appointment_pending),
      active: !!order.timeline?.appointment_scheduled || !!order.timeline?.appointment_pending || !!order.timeline?.sample_collected || order.resultsReady,
    },
    {
      title: "Sample Collected",
      description: `${collectionMethodLabel} completed`,
      date: formatLabTimelineDate(order.timeline?.sample_collected),
      active: !!order.timeline?.sample_collected || order.resultsReady,
    },
    {
      title: "At Lab",
      description: "Sample arrived at the lab",
      date: formatLabTimelineDate(order.timeline?.at_lab),
      active: !!order.timeline?.at_lab || order.resultsReady,
    },
    {
      title: "Results Ready",
      description: "Results returned by lab",
      date: formatLabTimelineDate(order.timeline?.results),
      active: !!order.timeline?.results || order.resultsReady,
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Breadcrumbs & Title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Breadcrumb className="mb-1">
            <BreadcrumbList className="text-sm text-gray-500 dark:text-gray-400">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard/orders/labs" className="hover:text-gray-750 dark:hover:text-gray-300">
                    Lab Orders
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-gray-400">/</BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-gray-900 dark:text-white font-medium">
                  Lab Order Details
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order #{orderTitle}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Lab Test Details Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Lab Test Details</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                Lab
              </span>
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {order.product_name || "Lab Panel"}
              </h4>
              <p className="text-xs text-gray-550 mb-6">
                {order.pharmacy_display || order.lab_provider || "Lab provider unavailable"} • {order.biomarkers?.length || 0} biomarkers • {collectionMethodLabel}
              </p>
              
              <div className="border-t border-gray-100 dark:border-gray-800/60 pt-4 space-y-3">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Panel price</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${parseFloat(order.orderTotal || order.price || "0").toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1">
                  <span className="text-gray-900 dark:text-white">Total (USD)</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    ${parseFloat(order.orderTotal || order.price || "0").toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Status Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Order Status</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
                {statusLabel.replace(/_/g, " ")}
              </span>
              {order.resultsReady && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
                  Results Ready
                </span>
              )}
            </div>
            
            <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-3 pl-8 space-y-6">
              {timelineMilestones.map((m, index) => (
                <div key={index} className="relative">
                  {/* Milestone Dot Indicator */}
                  <div className="absolute -left-[41px] top-1 h-5 w-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full flex items-center justify-center">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      m.active ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-700"
                    )} />
                  </div>
                  
                  {/* Milestone Details */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4">
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {m.title}
                      </h4>
                      <p className="text-xs text-gray-550 mt-0.5">
                        {m.description}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap pt-0.5">
                      {m.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lab Results Table Card */}
          <LabResultsTable
            biomarkers={order.biomarkers ?? []}
            resultsReleased={!!order.resultsReleased}
            downloadingPdf={downloadingPdf}
            onDownloadPdf={handleDownloadPdf}
          />
        </div>

        {/* Right Column */}
        <LabOrderDetailRightColumn
          order={order}
          formattedOrderDate={formattedOrderDate}
          togglingRelease={togglingRelease}
          onToggleRelease={handleToggleReleaseResults}
          getInitials={getInitials}
          downloadingRequisition={downloadingRequisition}
          onDownloadRequisition={handleDownloadRequisition}
          downloadingCollection={downloadingCollection}
          onDownloadCollection={handleDownloadCollection}
        />
      </div>
    </div>
  )
}
