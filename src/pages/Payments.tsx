import { useState, useEffect, useCallback } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { fetchTransactions, PaymentTransaction, TransactionListResponse } from "@/api/paymentTransactionsApi"
import { exportToCSV } from "@/utils/exportUtils"

type DisplayPaymentRow = PaymentTransaction & {
  split_children?: PaymentTransaction[];
  split_total_amount?: string;
  split_supplemental_amount?: string;
}

// Status filters from PaymentTransaction model
const statusFilters = ["All", "Pending", "Authorized", "Captured", "Approved", "Declined", "Error", "Voided", "Refunded"]

// Processor filters
const processorFilters = ["All", "NMI", "Authorize.Net", "Stripe"]

// Refund status filters
const refundStatusFilters = ["All", "None", "Pending", "Partial", "Refunded"]

const tabs = ["Payments", "Subscriptions", "Subscription Invoices"]

// Transform transaction data for display
function transformTransactionForDisplay(transaction: DisplayPaymentRow) {
  const totalRefunded = transaction.total_refunded ? parseFloat(transaction.total_refunded) : 0
  const refundableAmount = transaction.refundable_amount ? parseFloat(transaction.refundable_amount) : 0
  const refundStatus = transaction.refund_status || 'none'
  const splitChildren = transaction.split_children || []
  const hasSplit = splitChildren.length > 0
  const splitSupplemental = transaction.split_supplemental_amount
    ? parseFloat(transaction.split_supplemental_amount)
    : 0
  const splitTotal = transaction.split_total_amount
    ? parseFloat(transaction.split_total_amount)
    : parseFloat(transaction.amount || "0")

  return {
    ...transaction,
    patient_name: transaction.patient_name || '-',
    order_number: transaction.order_number || '-',
    created_at: format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm'),
    status: transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1),
    refund_status: refundStatus.charAt(0).toUpperCase() + refundStatus.slice(1),
    processor: transaction.processor === 'nmi' ? 'NMI' 
      : transaction.processor === 'authorizenet' ? 'Authorize.Net' 
      : transaction.processor === 'stripe' ? 'Stripe' 
      : transaction.processor,
    card_display: transaction.payment_method_details 
      ? `${transaction.payment_method_details.card_brand} ${transaction.payment_method_details.masked_card_number}`
      : '-',
    amount: hasSplit
      ? `$${splitTotal.toFixed(2)} (Base $${parseFloat(transaction.amount).toFixed(2)} + Sup $${splitSupplemental.toFixed(2)})`
      : `$${parseFloat(transaction.amount).toFixed(2)}`,
    total_refunded: `$${(Number.isNaN(totalRefunded) ? 0 : totalRefunded).toFixed(2)}`,
    refundable_amount: `$${(Number.isNaN(refundableAmount) ? 0 : refundableAmount).toFixed(2)}`,
    split_display: hasSplit
      ? `Split capture (${splitChildren.length + 1} tx)`
      : "-",
    split_children_display: splitChildren.map((tx) => ({
      processor_transaction_id: tx.processor_transaction_id,
      amount: parseFloat(tx.amount || "0").toFixed(2),
      status: tx.status,
    })),
  }
}

// Column configuration for the data table
const paymentColumns = [
  { key: "created_at", label: "Created At" },
  { key: "patient_name", label: "Patient Name" },
  { key: "order_number", label: "Order ID" },
  {
    key: "processor_transaction_id",
    label: "Transaction ID",
    render: (value: unknown, row: any) => {
      const children = row?.split_children_display || []
      return (
        <div className="space-y-1">
          <div className="font-medium">{String(value || "-")}</div>
          {children.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {children.map((child: any) => (
                <div key={child.processor_transaction_id}>
                  ↳ {child.processor_transaction_id} (${child.amount})
                </div>
              ))}
            </div>
          )}
        </div>
      )
    },
  },
  { key: "status", label: "Status" },
  { key: "refund_status", label: "Refund Status" },
  { key: "total_refunded", label: "Refunded" },
  { key: "refundable_amount", label: "Refundable" },
  { key: "processor", label: "Gateway" },
  { key: "card_display", label: "Card" },
  { key: "split_display", label: "Settlement" },
  { key: "amount", label: "Amount" },
  { key: "currency", label: "Currency" },
  { key: "auth_code", label: "Auth Code" },
]

export default function Payments() {
  const [activeTab, setActiveTab] = useState("Payments")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeStatusFilter, setActiveStatusFilter] = useState("All")
  const [activeProcessorFilter, setActiveProcessorFilter] = useState("All")
  const [activeRefundStatusFilter, setActiveRefundStatusFilter] = useState("All")
  const [date, setDate] = useState<DateRange | undefined>()
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  
  // Data state
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch transactions from API
  const loadTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
        status: activeStatusFilter !== 'All' ? activeStatusFilter : undefined,
        processor: activeProcessorFilter !== 'All' 
          ? (activeProcessorFilter === 'NMI' ? 'nmi' 
            : activeProcessorFilter === 'Authorize.Net' ? 'authorizenet' 
            : activeProcessorFilter === 'Stripe' ? 'stripe' 
            : undefined)
          : undefined,
        refund_status: activeRefundStatusFilter !== 'All'
          ? activeRefundStatusFilter.toLowerCase()
          : undefined,
        date_from: date?.from ? format(date.from, 'yyyy-MM-dd') : undefined,
        date_to: date?.to ? format(date.to, 'yyyy-MM-dd') : undefined,
        search: searchTerm || undefined,
      }
      
      const response = await fetchTransactions(params)
      setTransactions(response.results)
      setTotalCount(response.count)
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
      setError('Failed to load transactions. Please try again.')
      setTransactions([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, activeStatusFilter, activeProcessorFilter, activeRefundStatusFilter, date, searchTerm])

  // Load transactions on mount and when filters change
  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeStatusFilter, activeProcessorFilter, activeRefundStatusFilter, date, searchTerm])

  // Explicit API-driven grouping for split settlements.
  const groupedTransactions: DisplayPaymentRow[] = (() => {
    const supplementalByParent = new Map<string, PaymentTransaction[]>()
    transactions.forEach((tx) => {
      if (tx.settlement_role !== "supplemental_delta" || !tx.settlement_parent_transaction) return
      const bucket = supplementalByParent.get(tx.settlement_parent_transaction) || []
      bucket.push(tx)
      supplementalByParent.set(tx.settlement_parent_transaction, bucket)
    })

    const rows: DisplayPaymentRow[] = []
    transactions.forEach((tx) => {
      if (tx.settlement_role === "supplemental_delta") return
      const children = supplementalByParent.get(tx.id) || []
      const supplementalTotal = children.reduce((sum, child) => sum + parseFloat(child.amount || "0"), 0)
      const total = parseFloat(tx.amount || "0") + supplementalTotal
      rows.push({
        ...tx,
        split_children: children,
        split_supplemental_amount: supplementalTotal.toFixed(2),
        split_total_amount: total.toFixed(2),
      })
    })
    return rows
  })()

  // Transform transactions for display
  const displayData = groupedTransactions.map(transformTransactionForDisplay)

  // Create filter configuration
  const filters = [
    // Status filters
    ...statusFilters.map(status => ({
      key: `status-${status}`,
      label: status,
      type: 'button' as const,
      value: activeStatusFilter === status ? status : undefined,
      onClick: () => setActiveStatusFilter(status)
    })),
    // Processor filters
    ...processorFilters.slice(1).map(processor => ({
      key: `processor-${processor}`,
      label: processor,
      type: 'button' as const,
      value: activeProcessorFilter === processor ? processor : undefined,
      onClick: () => setActiveProcessorFilter(processor)
    })),
    // Refund status filters
    ...refundStatusFilters.map(status => ({
      key: `refund-status-${status}`,
      label: `Refund: ${status}`,
      type: 'button' as const,
      value: activeRefundStatusFilter === status ? status : undefined,
      onClick: () => setActiveRefundStatusFilter(status)
    })),
  ]

  const handleResetFilters = useCallback(() => {
    setActiveStatusFilter("All")
    setActiveProcessorFilter("All")
    setActiveRefundStatusFilter("All")
    setDate(undefined)
    setSearchTerm("")
    setCurrentPage(1)
  }, [])

  const handleRefresh = useCallback(() => {
    loadTransactions()
  }, [loadTransactions])

  const handleExport = useCallback(() => {
    exportToCSV(displayData, paymentColumns, 'payments_export')
  }, [displayData])

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / pageSize)

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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <DataTable
        data={displayData}
        columns={paymentColumns}
        searchPlaceholder="Search by transaction ID or auth code"
        showDatePicker={true}
        showExport={true}
        showResetFilters={true}
        filters={filters}
        dateRange={date}
        onDateRangeChange={setDate}
        onSearch={handleSearch}
        onResetFilters={handleResetFilters}
        onExport={handleExport}
        onRefresh={handleRefresh}
        loading={loading}
        getRowClassName={(row: any) =>
          row?.split_display && row.split_display !== "-"
            ? "bg-amber-50/40 dark:bg-amber-900/10"
            : ""
        }
        pagination={{
          currentPage,
          totalPages,
          pageSize,
          totalCount,
          onPageChange: setCurrentPage,
          onPageSizeChange: (size) => {
            setPageSize(size)
            setCurrentPage(1)
          }
        }}
      />
    </div>
  )
}
