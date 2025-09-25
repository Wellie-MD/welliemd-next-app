import { useState, useMemo, useCallback, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2 } from "lucide-react"
import { DateRange } from "react-day-picker"
import { isWithinInterval, parseISO } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/hooks/use-toast"
import { getPharmacies, deletePharmacy, type Pharmacy } from "@/api/pharmacy"
import { exportToCSV } from "@/utils/exportUtils"
import PharmacyForm from "@/components/pharmacies/PharmacyForm"

const pharmacyColumns = [
  { key: "name", label: "Pharmacy Name" },
  { key: "abbreviation", label: "Abbreviation" },
  { key: "provider_type_display", label: "Provider Type" },
  { key: "environment_display", label: "Environment" },
  { key: "onboarding_status_display", label: "Status" },
  { key: "onboarding_progress", label: "Progress %" },
  { key: "primary_contact_name", label: "Contact Name" },
  { key: "primary_contact_email", label: "Email" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "product_count", label: "Products" },
  { key: "max_daily_orders", label: "Max Daily Orders", render: (value: any) => value || 'Unlimited' },
  { key: "sla_shipping_days", label: "Shipping Days" },
  { key: "is_active", label: "Active", render: (value: boolean) => value ? '✔' : '✘' },
  { key: "is_billable", label: "Billable", render: (value: boolean) => value ? '✔' : '✘' },
  { key: "sync_to_tenants", label: "Synced", render: (value: boolean) => value ? '✔' : '✘' },
  { key: "created_at", label: "Created At", render: (value: string) => new Date(value).toLocaleDateString() }
]

const statusFilters = ["All", "pending", "testing", "live", "suspended"]
const environmentFilters = ["All", "sandbox", "production"]
const additionalFilters = ["Active Only", "Billable Only", "Ready for Orders"]

export default function Pharmacies() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("All")
  const [environmentFilter, setEnvironmentFilter] = useState("All")
  const [activeAdditionalFilters, setActiveAdditionalFilters] = useState<string[]>([])
  const [date, setDate] = useState<DateRange | undefined>()
  const [refreshKey, setRefreshKey] = useState(0)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pharmacyToDelete, setPharmacyToDelete] = useState<Pharmacy | null>(null)
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch pharmacies data
  const fetchPharmacies = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getPharmacies()
      setPharmacies(data)
    } catch (error: any) {
      console.error('Failed to fetch pharmacies:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch pharmacies',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPharmacies()
  }, [fetchPharmacies, refreshKey])

  // Comprehensive filtering logic
  const filteredPharmacies = useMemo(() => {
    return pharmacies.filter(pharmacy => {
      // Search filter
      const matchesSearch = !searchTerm || 
        pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pharmacy.abbreviation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pharmacy.primary_contact_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pharmacy.primary_contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pharmacy.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pharmacy.state.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter
      const matchesStatus = activeFilter === "All" || pharmacy.onboarding_status === activeFilter

      // Environment filter
      const matchesEnvironment = environmentFilter === "All" || pharmacy.environment === environmentFilter

      // Date range filter - using created_at field
      let matchesDateRange = true
      if (date?.from || date?.to) {
        const pharmacyCreatedDate = parseISO(pharmacy.created_at)
        
        if (date.from && date.to) {
          matchesDateRange = isWithinInterval(pharmacyCreatedDate, {
            start: date.from,
            end: date.to
          })
        } else if (date.from) {
          matchesDateRange = pharmacyCreatedDate >= date.from
        } else if (date.to) {
          matchesDateRange = pharmacyCreatedDate <= date.to
        }
      }

      // Additional filters logic
      let matchesAdditionalFilters = true
      if (activeAdditionalFilters.length > 0) {
        if (activeAdditionalFilters.includes("Active Only")) {
          matchesAdditionalFilters = matchesAdditionalFilters && pharmacy.is_active
        }
        if (activeAdditionalFilters.includes("Billable Only")) {
          matchesAdditionalFilters = matchesAdditionalFilters && pharmacy.is_billable
        }
        if (activeAdditionalFilters.includes("Ready for Orders")) {
          matchesAdditionalFilters = matchesAdditionalFilters && pharmacy.is_ready_for_orders
        }
      }

      return matchesSearch && matchesStatus && matchesEnvironment && matchesDateRange && matchesAdditionalFilters
    })
  }, [pharmacies, searchTerm, activeFilter, environmentFilter, date, activeAdditionalFilters, refreshKey])

  // Create filter configuration for DataTable
  const filters = [
    // Status filters
    ...statusFilters.map(status => ({
      key: `status-${status}`,
      label: status === "All" ? "All Status" : status.charAt(0).toUpperCase() + status.slice(1),
      type: 'button' as const,
      value: activeFilter === status ? status : undefined,
      onClick: () => setActiveFilter(status)
    })),
    // Environment filters
    ...environmentFilters.map(env => ({
      key: `env-${env}`,
      label: env === "All" ? "All Environments" : env.charAt(0).toUpperCase() + env.slice(1),
      type: 'button' as const,
      value: environmentFilter === env ? env : undefined,
      onClick: () => setEnvironmentFilter(env)
    })),
    // Additional filters
    ...additionalFilters.map(filter => ({
      key: `additional-${filter}`,
      label: filter,
      type: 'button' as const,
      value: activeAdditionalFilters.includes(filter) ? filter : undefined,
      onClick: () => {
        setActiveAdditionalFilters(prev => 
          prev.includes(filter) 
            ? prev.filter(f => f !== filter)
            : [...prev, filter]
        )
      }
    }))
  ]

  // Actions configuration for DataTable
  const actions = [
    {
      key: 'edit',
      label: 'Edit Pharmacy',
      icon: Edit,
      onClick: (pharmacy: Pharmacy) => handleEdit(pharmacy),
      variant: 'ghost' as const,
      className: 'hover:bg-blue-50 hover:text-blue-600'
    },
    {
      key: 'delete',
      label: 'Delete Pharmacy',
      icon: Trash2,
      onClick: (pharmacy: Pharmacy) => handleDeleteClick(pharmacy),
      variant: 'ghost' as const,
      className: 'hover:bg-red-50 hover:text-red-600'
    }
  ]

  const handleResetFilters = useCallback(() => {
    setActiveFilter("All")
    setEnvironmentFilter("All")
    setActiveAdditionalFilters([])
    setDate(undefined)
    setSearchTerm("")
  }, [])

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
    console.log("Refreshing pharmacy data...")
  }, [])

  const handleExport = useCallback(() => {
    // Transform data for export - convert booleans and format dates
    const exportData = filteredPharmacies.map(pharmacy => ({
      ...pharmacy,
      is_active: pharmacy.is_active ? 'Yes' : 'No',
      is_billable: pharmacy.is_billable ? 'Yes' : 'No',
      sync_to_tenants: pharmacy.sync_to_tenants ? 'Yes' : 'No',
      is_ready_for_orders: pharmacy.is_ready_for_orders ? 'Yes' : 'No',
      created_at: new Date(pharmacy.created_at).toLocaleDateString(),
      updated_at: new Date(pharmacy.updated_at).toLocaleDateString(),
      max_daily_orders: pharmacy.max_daily_orders || 'Unlimited'
    }))
    
    exportToCSV(exportData, pharmacyColumns, 'pharmacies_export')
  }, [filteredPharmacies])

  const handlePharmacySuccess = () => {
    setCreateModalOpen(false)
    setEditModalOpen(false)
    setSelectedPharmacyId(null)
    setRefreshKey(prev => prev + 1) // Trigger refresh
  }

  const handleAddNew = () => {
    setCreateModalOpen(true)
  }

  const handleEdit = (pharmacy: Pharmacy) => {
    setSelectedPharmacyId(pharmacy.id)
    setEditModalOpen(true)
  }

  const handleDeleteClick = (pharmacy: Pharmacy) => {
    setPharmacyToDelete(pharmacy)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!pharmacyToDelete) return
    
    try {
      await deletePharmacy(pharmacyToDelete.id)
      toast({
        title: 'Success',
        description: 'Pharmacy deleted successfully'
      })
      setRefreshKey(prev => prev + 1)
    } catch (error: any) {
      console.error('Failed to delete pharmacy:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete pharmacy',
        variant: 'destructive'
      })
    } finally {
      setDeleteDialogOpen(false)
      setPharmacyToDelete(null)
    }
  }

  if (loading && pharmacies.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pharmacies</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Pharmacies</span>
            <span>›</span>
            <span>Pharmacy Management</span>
          </div>
        </div>
        
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Pharmacy
        </Button>
      </div>

      <DataTable
        data={filteredPharmacies}
        columns={pharmacyColumns}
        actions={actions}
        searchPlaceholder="Search by pharmacy name, abbreviation, contact name, email, city..."
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
        isLoading={loading}
      />

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Create New Pharmacy</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-120px)] overflow-hidden">
            <div className="pr-6">
              <PharmacyForm onSuccess={handlePharmacySuccess} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit Pharmacy</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-120px)] overflow-hidden">
            <div className="pr-6">
              {selectedPharmacyId && (
                <PharmacyForm pharmacyId={selectedPharmacyId} onSuccess={handlePharmacySuccess} />
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pharmacy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{pharmacyToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
