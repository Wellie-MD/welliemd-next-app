import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UpdateStatusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStatus: string
  onSubmit: (status: string, trackingNumber?: string) => Promise<void>
  loading: boolean
}

const statusOptions = [
  { value: "created", label: "Created" },
  { value: "processing", label: "Processing" },
  { value: "payment_pending", label: "Payment Pending" },
  { value: "visit_pending", label: "Visit Pending" },
  { value: "consult_scheduled", label: "Consult Scheduled" },
  { value: "prescribed", label: "Prescribed" },
  { value: "billing_pending", label: "Billing Pending" },
  { value: "rx_sent", label: "Rx Sent" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "canceled", label: "Canceled" },
]

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  open,
  onOpenChange,
  currentStatus,
  onSubmit,
  loading,
}) => {
  const { toast } = useToast()
  const [newStatus, setNewStatus] = useState(currentStatus || "created")
  const [trackingNumber, setTrackingNumber] = useState("")

  const handleSubmit = async () => {
    if (newStatus === "shipped" && !trackingNumber.trim()) {
      toast({ title: "Tracking number is required for shipped status", variant: "destructive" })
      return
    }
    await onSubmit(newStatus, trackingNumber)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Manually update the lifecycle status of this order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Select New Status
            </label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {newStatus === "shipped" && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Tracking Number (Required for Shipped)
              </label>
              <Input
                placeholder="Enter carrier tracking number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Status"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
