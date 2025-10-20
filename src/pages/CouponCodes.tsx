import { useEffect, useMemo, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, Link2 } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { DateRange } from "react-day-picker"
import { isWithinInterval } from "date-fns"
import AddCouponForm from "@/components/coupons/AddCouponForm"
import axiosInstance from "@/api/axiosInstance"
import { exportToCSV } from "@/utils/exportUtils"
import CouponLinksModal from "@/components/coupons/CouponLinksModal"

// ✨ NEW: modal imports
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Coupon = {
  id: string
  code: string
  type: "fixed" | "percent"
  value: string | number
  promo_link?: string
  is_active: boolean
  max_usage?: number | null
  max_usage_per_user?: number | null
  min_spend?: string | number | null
  expires_at?: string | null
  total_used: number
  created_at?: string | null
  applicable_products: string[]
  purchase_applicability: "both" | "first_only" | "followup_only"
  catalog_applicability: "medical_only" | "labs_only" | "both"
  subscription_applicability: "first_cycle_only" | "every_cycle"
}

type Product = { id: string; name: string }

const purchaseLabel: Record<Coupon["purchase_applicability"], string> = {
  both: "For Both First and Followup Purchase",
  first_only: "First Purchase Only",
  followup_only: "Follow-up Purchase Only",
}
const catalogLabel: Record<Coupon["catalog_applicability"], string> = {
  medical_only: "Apply Only to Medical Products",
  labs_only: "Apply Only to Lab Panels",
  both: "Apply to both Medical Products/Lab Panels",
}
const subLabel: Record<Coupon["subscription_applicability"], string> = {
  first_cycle_only: "Apply Only to First Billing Cycle",
  every_cycle: "Apply to Every Billing Cycle",
}

const statusFilters = ["All", "Active", "Inactive"]
const typeFilters = ["All", "Fixed Amount", "Percent"]
const usageFilters = ["All", "Used", "Unused", "Expired"]

function formatMoney(n?: number | string | null) {
  if (n === null || n === undefined || n === "") return "-"
  const num = typeof n === "string" ? parseFloat(n) : n
  if (Number.isNaN(num)) return "-"
  return `$${num.toFixed(2)}`
}

function formatDate(d?: string | null) {
  if (!d) return "-"
  try {
    const dt = new Date(d)
    return dt.toLocaleDateString()
  } catch {
    return "-"
  }
}

const getRow = <T,>(...args: any[]): T => (args.length >= 2 ? args[1] : args[0])

export default function CouponCodes() {
  const [showCreate, setShowCreate] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeStatusFilter, setActiveStatusFilter] = useState("All")
  const [activeTypeFilter, setActiveTypeFilter] = useState("All")
  const [activeUsageFilter, setActiveUsageFilter] = useState("All")
  const [date, setDate] = useState<DateRange | undefined>()
  const [refreshKey, setRefreshKey] = useState(0)
  const [linkCoupon, setLinkCoupon] = useState<Coupon | null>(null)

  // ✨ NEW: deletion modal state
  const [pendingDelete, setPendingDelete] = useState<Coupon | null>(null)
  const [deleting, setDeleting] = useState(false)

  const productMap = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p.name])),
    [products]
  )

  const fetchCoupons = async () => {
    try {
      const res = await axiosInstance.get("/coupons/")
      setCoupons(res.data?.results || [])
    } catch (error) {
      console.error("Failed to fetch coupons:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await axiosInstance.get("/products/")
      setProducts(res.data?.results || [])
    } catch {
      setProducts([])
    }
  }

  useEffect(() => {
    fetchCoupons()
    fetchProducts()
  }, [])

  const filteredCoupons = useMemo(() => {
    return coupons.filter(coupon => {
      const matchesSearch = !searchTerm || 
        coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coupon.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coupon.id.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = activeStatusFilter === "All" || 
        (activeStatusFilter === "Active" && coupon.is_active) ||
        (activeStatusFilter === "Inactive" && !coupon.is_active)

      const matchesType = activeTypeFilter === "All" || 
        (activeTypeFilter === "Fixed Amount" && coupon.type === "fixed") ||
        (activeTypeFilter === "Percent" && coupon.type === "percent")

      let matchesUsage = true
      if (activeUsageFilter !== "All") {
        const now = new Date()
        const expired = coupon.expires_at && new Date(coupon.expires_at) < now
        switch (activeUsageFilter) {
          case "Used":
            matchesUsage = coupon.total_used > 0
            break
          case "Unused":
            matchesUsage = coupon.total_used === 0
            break
          case "Expired":
            matchesUsage = expired || false
            break
        }
      }

      let matchesDateRange = true
      if (date?.from || date?.to) {
        if (coupon.created_at) {
          const couponDate = new Date(coupon.created_at)
          if (date.from && date.to) {
            matchesDateRange = isWithinInterval(couponDate, { start: date.from, end: date.to })
          } else if (date.from) {
            matchesDateRange = couponDate >= date.from
          } else if (date.to) {
            matchesDateRange = couponDate <= date.to
          }
        }
      }

      return matchesSearch && matchesStatus && matchesType && matchesUsage && matchesDateRange
    })
  }, [coupons, searchTerm, activeStatusFilter, activeTypeFilter, activeUsageFilter, date, refreshKey])

  const filters = [
    ...statusFilters.map(status => ({
      key: `status-${status}`,
      label: status,
      type: 'button' as const,
      value: activeStatusFilter === status ? status : undefined,
      onClick: () => setActiveStatusFilter(status)
    })),
    ...typeFilters.slice(1).map(type => ({
      key: `type-${type}`,
      label: type,
      type: 'button' as const,
      value: activeTypeFilter === type ? type : undefined,
      onClick: () => setActiveTypeFilter(type)
    })),
    ...usageFilters.slice(1).map(usage => ({
      key: `usage-${usage}`,
      label: usage,
      type: 'button' as const,
      value: activeUsageFilter === usage ? usage : undefined,
      onClick: () => setActiveUsageFilter(usage)
    }))
  ]

  const handleResetFilters = useCallback(() => {
    setActiveStatusFilter("All")
    setActiveTypeFilter("All")
    setActiveUsageFilter("All")
    setDate(undefined)
    setSearchTerm("")
  }, [])

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
    fetchCoupons()
  }, [])

  const handleExport = useCallback(() => {
    exportToCSV(filteredCoupons, columns, 'coupon_codes_export')
  }, [filteredCoupons])

  // ❌ OLD confirm removed
  const requestDelete = (row: Coupon) => setPendingDelete(row)

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      setDeleting(true)
      await axiosInstance.delete(`/coupons/${pendingDelete.id}/`)
      await fetchCoupons()
      setPendingDelete(null)
    } catch (e) {
      console.error("Failed to delete coupon", e)
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { key: "code", label: "Coupon" },
    {
      key: "is_active",
      label: "Active",
      render: (...args: any[]) => (getRow<Coupon>(...args).is_active ? "Active" : "Inactive"),
    },
    {
      key: "type",
      label: "Type",
      render: (...args: any[]) => (getRow<Coupon>(...args).type === "fixed" ? "fixed amount" : "percentage"),
    },
    {
      key: "value",
      label: "Discount",
      render: (...args: any[]) => {
        const row = getRow<Coupon>(...args)
        return row.type === "percent"
          ? (typeof row.value === "string" ? parseFloat(row.value) : row.value) + "%"
          : formatMoney(row.value)
      },
    },
    { key: "min_spend", label: "Min Spend", render: (...a: any[]) => formatMoney(getRow<Coupon>(...a).min_spend ?? null) },
    { key: "max_usage", label: "Max Usage", render: (...a: any[]) => getRow<Coupon>(...a).max_usage ?? "-" },
    { key: "max_usage_per_user", label: "Max/User", render: (...a: any[]) => getRow<Coupon>(...a).max_usage_per_user ?? "-" },
    {
      key: "applicable_products",
      label: "Applies To",
      render: (...args: any[]) => {
        const row = getRow<Coupon>(...args)
        const ids = row.applicable_products || []
        if (!ids.length) return "All products"
        const names = ids.map((id) => productMap[id]).filter(Boolean)
        const text = names.join(", ")
        return text.length > 60 ? text.slice(0, 60) + "…" : text || `${ids.length} product(s)`
      },
    },
    {
      key: "purchase_applicability",
      label: "Coupon Applicable To",
      render: (...a: any[]) => purchaseLabel[getRow<Coupon>(...a).purchase_applicability],
    },
    {
      key: "catalog_applicability",
      label: "Coupon Applicable To Meds/Lab Panel",
      render: (...a: any[]) => catalogLabel[getRow<Coupon>(...a).catalog_applicability],
    },
    {
      key: "subscription_applicability",
      label: "Apply To Subscription Products",
      render: (...a: any[]) => subLabel[getRow<Coupon>(...a).subscription_applicability],
    },
    { key: "expires_at", label: "Expiry Date", render: (...a: any[]) => formatDate(getRow<Coupon>(...a).expires_at) },
    { key: "total_used", label: "Total Used" },
    { key: "created_at", label: "Created At", render: (...a: any[]) => formatDate(getRow<Coupon>(...a).created_at ?? null) },
    {
      key: "__actions",
      label: "",
      render: (...args: any[]) => {
        const row = getRow<Coupon>(...args)
        return (
          <div className="flex items-center justify-end gap-3">
            <button type="button" className="hover:opacity-80" title="Links" onClick={() => setLinkCoupon(row)}>
              <Link2 className="h-4 w-4" />
            </button>
            <button type="button" className="hover:opacity-80" title="Edit" onClick={() => setEditingCoupon(row)}>
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="text-red-600 hover:opacity-80"
              title="Delete"
              onClick={() => requestDelete(row)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coupon Codes</h1>
        <Button className="gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Add New
        </Button>
      </div>

      {showCreate && (
        <div className="border p-4 rounded-md bg-white shadow">
          <AddCouponForm
            mode="create"
            open={showCreate}
            onOpenChange={setShowCreate}
            onSuccess={() => {
              setShowCreate(false)
              fetchCoupons()
            }}
          />
        </div>
      )}

      {editingCoupon && (
        <div className="border p-4 rounded-md bg-white shadow">
          <AddCouponForm
            mode="edit"
            coupon={editingCoupon}
            open={!!editingCoupon}
            onOpenChange={(v) => {
              if (!v) setEditingCoupon(null)
            }}
            onSuccess={() => {
              setEditingCoupon(null)
              fetchCoupons()
            }}
          />
        </div>
      )}

      <DataTable
        data={filteredCoupons}
        columns={columns}
        searchPlaceholder="Search by coupon name, code, or ID"
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

      <CouponLinksModal
        open={!!linkCoupon}
        onOpenChange={(v) => !v && setLinkCoupon(null)}
        coupon={linkCoupon}
      />

      {/* ✨ Delete confirmation modal */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && !deleting && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete coupon?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `This will permanently delete the coupon "${pendingDelete.code}". This action cannot be undone.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
