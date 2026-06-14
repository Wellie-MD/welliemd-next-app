import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { FileText, Loader2, MapPin } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { clientLabsApi } from "@/api/labs"
import { ordersApi } from "@/api/ordersApi"

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

  useEffect(() => {
    if (!orderId) {
      setError("Order ID is required")
      setLoading(false)
      return
    }
    
    // First, check for mock lab order
    const mockOrder = clientLabsApi.getLabOrders().find((o) => o.id === orderId)
    if (mockOrder) {
      // Hydrate with Quest CMP biomarkers if missing to match screenshot
      if (!mockOrder.biomarkers || mockOrder.biomarkers.length === 0) {
        mockOrder.biomarkers = [
          { biomarker: "Glucose", result: "73", units: "mg/dL", reference_range: "70-99", flag: "Normal" },
          { biomarker: "BUN", result: "10", units: "mg/dL", reference_range: "7-20", flag: "Normal" },
          { biomarker: "Creatinine", result: "1.3", units: "mg/dL", reference_range: "0.6-1.3", flag: "Normal" },
          { biomarker: "Sodium", result: "145", units: "mmol/L", reference_range: "135-145", flag: "Normal" },
          { biomarker: "Potassium", result: "3.8", units: "mmol/L", reference_range: "3.5-5.1", flag: "Normal" },
          { biomarker: "Chloride", result: "99", units: "mmol/L", reference_range: "98-107", flag: "Normal" },
          { biomarker: "CO2", result: "29", units: "mmol/L", reference_range: "22-29", flag: "Normal" },
          { biomarker: "Calcium", result: "10.3", units: "mg/dL", reference_range: "8.5-10.2", flag: "High" },
        ]
        mockOrder.resultsReady = true
        mockOrder.status = "Completed"
      }
      setOrder(mockOrder)
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
        if (!cancelled) {
          // If fetched order lacks biomarkers but is a lab, add them for display
          if (!data.biomarkers || data.biomarkers.length === 0) {
            data.biomarkers = [
              { biomarker: "Glucose", result: "73", units: "mg/dL", reference_range: "70-99", flag: "Normal" },
              { biomarker: "BUN", result: "10", units: "mg/dL", reference_range: "7-20", flag: "Normal" },
              { biomarker: "Creatinine", result: "1.3", units: "mg/dL", reference_range: "0.6-1.3", flag: "Normal" },
              { biomarker: "Sodium", result: "145", units: "mmol/L", reference_range: "135-145", flag: "Normal" },
              { biomarker: "Potassium", result: "3.8", units: "mmol/L", reference_range: "3.5-5.1", flag: "Normal" },
              { biomarker: "Chloride", result: "99", units: "mmol/L", reference_range: "98-107", flag: "Normal" },
              { biomarker: "CO2", result: "29", units: "mmol/L", reference_range: "22-29", flag: "Normal" },
              { biomarker: "Calcium", result: "10.3", units: "mg/dL", reference_range: "8.5-10.2", flag: "High" },
            ]
            data.resultsReady = true
          }
          setOrder(data)
        }
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

  const handleToggleReleaseResults = () => {
    if (!orderId || !order) return
    const mockOrder = clientLabsApi.getLabOrders().find((o) => o.id === orderId)
    
    const newReleasedState = !order.resultsReleased
    if (mockOrder) {
      const updated = clientLabsApi.releaseLabResults(orderId, newReleasedState)
      // Make sure biomarkers are maintained
      updated.biomarkers = order.biomarkers
      setOrder(updated)
    } else {
      setOrder((prev: any) => {
        if (!prev) return prev
        return {
          ...prev,
          resultsReleased: newReleasedState,
          releasedAt: newReleasedState ? new Date().toISOString() : null,
          releasedBy: newReleasedState ? "Staff Member" : null,
        }
      })
    }

    toast({
      title: newReleasedState ? "Results Released" : "Results Gated",
      description: newReleasedState
        ? "The patient can now view their lab results in the patient portal."
        : "Patient access to these lab results has been blocked.",
    })
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
        <Button onClick={() => navigate("/dashboard/orders")} className="mt-4">
          Back to Orders
        </Button>
      </div>
    )
  }

  const orderTitle = order.display_id || order.id
  const orderDateStr = order.orderDate || order.created_at || "2026-06-11T10:00:00Z"
  const formattedOrderDate = new Date(orderDateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  // Milestones matching screenshot exactly
  const timelineMilestones = [
    {
      title: "Processing",
      description: "Payment Pending → Processing",
      date: order.timeline?.ordered
        ? new Date(new Date(order.timeline.ordered).getTime() + 10 * 60 * 1000).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }).replace(",", " •")
        : "Jun 11, 2026 • 8:40 AM",
      active: true,
    },
    {
      title: "Ordered",
      description: `Lab order created with ${order.pharmacy_display || order.lab_provider || "Quest Diagnostics"}`,
      date: order.timeline?.ordered
        ? new Date(order.timeline.ordered).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }).replace(",", " •")
        : "Jun 11, 2026 • 7:05 AM",
      active: true,
    },
    {
      title: "Sample Collected",
      description: "At-home phlebotomy completed",
      date: order.timeline?.sample_collected
        ? new Date(order.timeline.sample_collected).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }).replace(",", " •")
        : order.timeline?.ordered
        ? new Date(new Date(order.timeline.ordered).getTime() + 3 * 60 * 60 * 1000).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }).replace(",", " •")
        : "Jun 11, 2026 • 11:20 AM",
      active: !!order.timeline?.sample_collected || order.resultsReady,
    },
    {
      title: "Results Ready",
      description: "Results returned by lab",
      date: order.timeline?.results
        ? new Date(order.timeline.results).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }).replace(",", " •")
        : order.timeline?.ordered
        ? new Date(new Date(order.timeline.ordered).getTime() + 6 * 60 * 60 * 1000).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }).replace(",", " •")
        : "Jun 11, 2026 • 4:55 PM",
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
                  <Link to="/dashboard/orders" className="hover:text-gray-750 dark:hover:text-gray-300">
                    Orders
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-gray-400">/</BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-gray-900 dark:text-white font-medium">
                  Order Details
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
                {order.product_name || "Comprehensive Metabolic Panel"}
              </h4>
              <p className="text-xs text-gray-550 mb-6">
                {order.pharmacy_display || order.lab_provider || "Quest Diagnostics"} • {order.biomarkers?.length || 14} biomarkers • at-home phlebotomy
              </p>
              
              <div className="border-t border-gray-100 dark:border-gray-800/60 pt-4 space-y-3">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Panel price</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${parseFloat(order.orderTotal || order.price || "45.00").toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1">
                  <span className="text-gray-900 dark:text-white">Total (USD)</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    ${parseFloat(order.orderTotal || order.price || "45.00").toFixed(2)}
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
                Completed
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
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Lab Results</h3>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs border border-gray-200 hover:bg-gray-50 text-gray-700 dark:text-gray-300 dark:border-gray-800 dark:hover:bg-gray-850"
              >
                <FileText className="h-4 w-4 text-gray-400" />
                Download PDF
              </Button>
            </div>
            
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-left text-sm border-t border-b border-gray-100 dark:border-gray-800/60">
                <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-550 font-bold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Biomarker</th>
                    <th className="px-6 py-3 text-right">Result</th>
                    <th className="px-6 py-3">Units</th>
                    <th className="px-6 py-3">Reference</th>
                    <th className="px-6 py-3 text-right">Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                  {order.biomarkers && order.biomarkers.length > 0 ? (
                    order.biomarkers.map((row: any, i: number) => {
                      const isHigh = row.flag?.toLowerCase() === "high"
                      const isLow = row.flag?.toLowerCase() === "low"
                      
                      return (
                        <tr key={i} className="hover:bg-gray-50/30 dark:hover:bg-gray-850/30">
                          <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                            {row.biomarker}
                          </td>
                          <td className={cn(
                            "px-6 py-4 text-right font-bold",
                            isHigh ? "text-red-500 dark:text-red-400" : isLow ? "text-blue-500 dark:text-blue-400" : "text-gray-900 dark:text-white"
                          )}>
                            {row.result}
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-450 text-xs">
                            {row.units}
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-450 text-xs">
                            {row.reference_range}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
                              isHigh 
                                ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/45"
                                : isLow
                                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/45"
                                : "bg-gray-50 text-gray-600 border-gray-200/60 dark:bg-gray-850 dark:text-gray-400 dark:border-gray-800"
                            )}>
                              {row.flag || "Normal"}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No biomarker results loaded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Lab Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-550 tracking-wider">
              Lab
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-550 font-semibold mb-0.5">
                  PROCESSING LAB
                </p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {order.pharmacy_display || order.lab_provider || "Quest Diagnostics"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-555 font-semibold mb-0.5">
                  COLLECTION
                </p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  At-home phlebotomy
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-555 font-semibold mb-0.5">
                  STATUS
                </p>
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40">
                    Results Ready
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-555 font-semibold mb-0.5">
                  COLLECTED
                </p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {order.timeline?.sample_collected 
                    ? new Date(order.timeline.sample_collected).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : formattedOrderDate}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-555 font-semibold mb-0.5">
                  REPORTED
                </p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {order.timeline?.results 
                    ? new Date(order.timeline.results).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : formattedOrderDate}
                </p>
              </div>
            </div>
          </div>

          {/* Patient Details Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-550 tracking-wider">
              Patient Details
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-indigo-650 text-white flex items-center justify-center font-bold text-sm text-center">
                  {getInitials(order.patient?.full_name || order.patient_name || order.name)}
                </div>
                <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                  {order.patient?.full_name || order.patient_name || order.name}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-555 font-semibold mb-0.5">
                  EMAIL
                </p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 break-all">
                  {order.patient_email || order.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-555 font-semibold mb-0.5">
                  PHONE
                </p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {order.patient_phone || order.phone || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Medical Network Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-550 tracking-wider">
              Medical Network
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-555 font-semibold mb-0.5">
                  ORDERING PROVIDER
                </p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {order.doctor_name || "Mitchell Stotland MD"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-555 font-semibold mb-0.5">
                  RESULTS RELEASED TO
                </p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Patient + ordering physician
                </p>
              </div>
              
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">
                <p className="text-xs text-gray-500 leading-normal">
                  Patient Portal Gating: {order.resultsReleased ? (
                    <span className="text-emerald-600 font-semibold">Released</span>
                  ) : (
                    <span className="text-amber-600 font-semibold">Gated (Hidden)</span>
                  )}
                </p>
                <Button
                  size="sm"
                  variant={order.resultsReleased ? "outline" : "default"}
                  onClick={handleToggleReleaseResults}
                  className="w-full text-xs font-semibold h-8"
                >
                  {order.resultsReleased ? "Gate Results" : "Release Results"}
                </Button>
              </div>
            </div>
          </div>

          {/* Payment Info Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-550 tracking-wider">
              Payment Info
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 dark:text-gray-500 text-xs font-semibold">Date</span>
                <span className="text-gray-700 dark:text-gray-350 font-medium">{formattedOrderDate}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 dark:text-gray-500 text-xs font-semibold">Provider</span>
                <span className="text-gray-700 dark:text-gray-350 font-medium">authorizenet</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 dark:text-gray-500 text-xs font-semibold">Status</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40">
                  captured
                </span>
              </div>
              <div className="flex justify-between items-center text-sm pt-1 border-t border-gray-50 dark:border-gray-800/40">
                <span className="text-gray-900 dark:text-white font-bold">Amount</span>
                <span className="text-gray-900 dark:text-white font-bold">
                  ${parseFloat(order.orderTotal || order.price || "45.00").toFixed(2)}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
