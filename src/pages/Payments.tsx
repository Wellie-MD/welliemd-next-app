import { useState, useMemo, useCallback } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DateRange } from "react-day-picker"
import { isWithinInterval } from "date-fns"
import mockData from "@/data/mockData.json"
import { exportToCSV } from "@/utils/exportUtils"

const resolutionColumns = [
  { key: "createdAt", label: "Created At" },
  { key: "patientId", label: "Patient ID" },
  { key: "patientName", label: "Patient Name" },
  { key: "patientEmail", label: "Patient Email" },
  { key: "orderNumber", label: "Order #" },
  { key: "friendlyId", label: "Friendly ID" },
  { key: "status", label: "Status" },
  { key: "gateway", label: "Gateway" },
  { key: "card", label: "Card" },
  { key: "paymentMethod", label: "Payment Method" },
  { key: "totalPrice", label: "Total Price" },
  { key: "discount", label: "Discount" },
  { key: "processingFee", label: "Processing Fee" },
  { key: "amountPaid", label: "Amount Paid" },
  { key: "net", label: "Net" }
]

// Meaningful filters based on payment data
const statusFilters = ["All", "Pending", "Paid", "Failed", "Cancelled", "Expired", "Requires Capture", "Draft"]
const gatewayFilters = ["All", "Stripe", "PayPal", "Square", "Authorize.net"]
const paymentMethodFilters = ["All", "Credit Card", "Debit Card", "Bank Transfer", "Digital Wallet"]

const tabs = ["Payments", "Subscriptions", "Subscription Invoices"]

// Helper function to parse date in DD/MM/YYYY format
const parseDate = (dateString: string) => {
  if (!dateString) return new Date()
  const [day, month, year] = dateString.split('/')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

export default function Payments() {
  const [activeTab, setActiveTab] = useState("Payments")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeStatusFilter, setActiveStatusFilter] = useState("All")
  const [activeGatewayFilter, setActiveGatewayFilter] = useState("All")
  const [activePaymentMethodFilter, setActivePaymentMethodFilter] = useState("All")
  const [additionalFilters, setAdditionalFilters] = useState<string[]>([])
  const [date, setDate] = useState<DateRange | undefined>()
  const [refreshKey, setRefreshKey] = useState(0)

  // Comprehensive filtering logic based on actual payment data
  const filteredPayments = useMemo(() => {
    return mockData.Payments.filter(payment => {
      // Search filter - search across multiple fields
      const matchesSearch = !searchTerm || 
        payment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.patientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.orderNumber.toString().includes(searchTerm) ||
        payment.friendlyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.patientId.toString().includes(searchTerm)

      // Status filter
      const matchesStatus = activeStatusFilter === "All" || payment.status === activeStatusFilter

      // Gateway filter (if your data has gateway field)
      const matchesGateway = activeGatewayFilter === "All" || payment.gateway === activeGatewayFilter

      // Payment Method filter
      const matchesPaymentMethod = activePaymentMethodFilter === "All" || payment.paymentMethod === activePaymentMethodFilter

      // Date range filter based on createdAt
      let matchesDateRange = true
      if (date?.from || date?.to) {
        const paymentDate = parseDate(payment.createdAt)
        
        if (date.from && date.to) {
          matchesDateRange = isWithinInterval(paymentDate, {
            start: date.from,
            end: date.to
          })
        } else if (date.from) {
          matchesDateRange = paymentDate >= date.from
        } else if (date.to) {
          matchesDateRange = paymentDate <= date.to
        }
      }

      return matchesSearch && matchesStatus && matchesGateway && matchesPaymentMethod && matchesDateRange
    })
  }, [mockData.Payments, searchTerm, activeStatusFilter, activeGatewayFilter, activePaymentMethodFilter, date, refreshKey])

  // Create filter configuration
  const filters = [
    // Sort button (as in original design)
    {
      key: 'sort',
      label: 'Sort',
      type: 'button' as const,
      value: additionalFilters.includes('Sort') ? 'Sort' : undefined,
      onClick: () => {
        setAdditionalFilters(prev => 
          prev.includes('Sort') 
            ? prev.filter(f => f !== 'Sort')
            : [...prev, 'Sort']
        )
      }
    },
    // Status filters
    ...statusFilters.map(status => ({
      key: `status-${status}`,
      label: status,
      type: 'button' as const,
      value: activeStatusFilter === status ? status : undefined,
      onClick: () => setActiveStatusFilter(status)
    })),
    // Gateway filters
    ...gatewayFilters.slice(1).map(gateway => ({ // Skip "All" to avoid duplicate
      key: `gateway-${gateway}`,
      label: gateway,
      type: 'button' as const,
      value: activeGatewayFilter === gateway ? gateway : undefined,
      onClick: () => setActiveGatewayFilter(gateway)
    })),
    // Payment Method filters
    ...paymentMethodFilters.slice(1).map(method => ({ // Skip "All" to avoid duplicate
      key: `method-${method}`,
      label: method,
      type: 'button' as const,
      value: activePaymentMethodFilter === method ? method : undefined,
      onClick: () => setActivePaymentMethodFilter(method)
    })),
    // Extra Filters button (as in original design)
    {
      key: 'extra-filters',
      label: 'Extra Filters',
      type: 'button' as const,
      value: additionalFilters.includes('Extra Filters') ? 'Extra Filters' : undefined,
      onClick: () => {
        setAdditionalFilters(prev => 
          prev.includes('Extra Filters') 
            ? prev.filter(f => f !== 'Extra Filters')
            : [...prev, 'Extra Filters']
        )
      }
    }
  ]

  const handleResetFilters = useCallback(() => {
    setActiveStatusFilter("All")
    setActiveGatewayFilter("All")
    setActivePaymentMethodFilter("All")
    setAdditionalFilters([])
    setDate(undefined)
    setSearchTerm("")
  }, [])

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
    console.log("Refreshing payments data...")
  }, [])

  const handleExport = useCallback(() => {
    exportToCSV(filteredPayments, resolutionColumns, 'payments_export')
  }, [filteredPayments])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Orders</span>
            <span>›</span>
            <span>Payments</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </Button>
        ))}
      </div>

      <DataTable
        data={filteredPayments}
        columns={resolutionColumns}
        searchPlaceholder="Search by order#, order ID, patient name or payment ID"
        showDatePicker={true}
        showExport={true}
        showResetFilters={true}
        filters={filters}
        dateRange={date}
        onDateRangeChange={setDate}
        onSearch={setSearchTerm}
        onResetFilters={handleResetFilters}
        onExport={handleExport}
        onRefresh={handleRefresh}
      />
    </div>
  )
}
