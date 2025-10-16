import { useEffect, useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Link2 } from "lucide-react"
import axiosInstance from "@/api/axiosInstance"
import AffiliateForm from "@/components/affiliates/AffiliateForm"
import AffiliateLinksModal from "@/components/affiliates/AffiliateLinksModal"

// NEW: shadcn confirm modal
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

type Affiliate = {
  id: string
  name: string
  slug: string
  commission_type: "flat" | "percent"
  commission_value: number
  discount_type: "flat" | "percent"
  discount_value: number
  referral_link: string
  is_active: boolean
  created_at: string
}

export default function Affiliates() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null)
  const [linkAffiliate, setLinkAffiliate] = useState<Affiliate | null>(null)

  // NEW: delete modal state
  const [pendingDelete, setPendingDelete] = useState<Affiliate | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchAffiliates = async () => {
    try {
      const res = await axiosInstance.get("/affiliates/")
      setAffiliates(res.data?.results || res.data)
    } catch (e) {
      console.error("Failed to fetch affiliates", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAffiliates()
  }, [])

  // open modal
  const requestDelete = (row: Affiliate) => setPendingDelete(row)

  // confirm deletion
  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      setDeleting(true)
      await axiosInstance.delete(`/affiliates/${pendingDelete.id}/`)
      await fetchAffiliates()
      setPendingDelete(null)
    } catch (e) {
      console.error("Failed to delete affiliate", e)
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { key: "name", label: "Name" },
    { key: "slug", label: "Slug" },
    { key: "id", label: "ID" },
    { key: "created_at", label: "Created Date" },
    { key: "commission_type", label: "Commission Type" },
    { key: "commission_value", label: "Commission" },
    { key: "discount_type", label: "Discount Type" },
    { key: "discount_value", label: "Discount" },
    {
      key: "is_active",
      label: "Status",
      render: (val: boolean) => (
        <Badge variant={val ? "default" : "secondary"}>
          {val ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "__actions",
      label: "Actions",
      render: (_: any, row: Affiliate) => (
        <div className="flex items-center gap-3 justify-end">
          <button
            type="button"
            className="hover:opacity-80"
            title="Links"
            onClick={() => setLinkAffiliate(row)}
          >
            <Link2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="hover:opacity-80"
            title="Edit"
            onClick={() => setEditingAffiliate(row)}
          >
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
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Affiliate Programs</h1>
        <Button className="gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Add New
        </Button>
      </div>

      {showCreate && (
        <AffiliateForm
          mode="create"
          open={showCreate}
          onOpenChange={setShowCreate}
          onSuccess={() => {
            setShowCreate(false)
            fetchAffiliates()
          }}
        />
      )}

      {editingAffiliate && (
        <AffiliateForm
          mode="edit"
          affiliate={editingAffiliate}
          open={!!editingAffiliate}
          onOpenChange={(v) => !v && setEditingAffiliate(null)}
          onSuccess={() => {
            setEditingAffiliate(null)
            fetchAffiliates()
          }}
        />
      )}

      <DataTable
        data={affiliates}
        columns={columns}
        searchPlaceholder="Search by affiliate name, slug, or ID"
        loading={loading}
      />

      <AffiliateLinksModal
        open={!!linkAffiliate}
        onOpenChange={(v) => !v && setLinkAffiliate(null)}
        affiliate={linkAffiliate}
      />

      {/* Delete confirmation modal */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && !deleting && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete affiliate?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `This will permanently delete "${pendingDelete.name}". This action cannot be undone.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
