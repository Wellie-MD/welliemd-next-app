import React, { useState } from "react"
import { Order } from "@/api/ordersApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

interface RefundVoidModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order
  onSubmit: (data: {
    amount?: string
    refundTarget: "auto" | "base" | "supplemental"
    reason: string
    reasonDescription: string
    notes: string
  }) => Promise<void>
  loading: boolean
  remainingRefundable: number
  baseRemainingRefundable: number
  supplementalRemainingRefundable: number
  isAuthorized: boolean
  isRefundable: boolean
}

const refundReasonOptions = [
  { value: "customer_request", label: "Customer Request" },
  { value: "duplicate_charge", label: "Duplicate Charge" },
  { value: "fraud", label: "Fraud" },
  { value: "product_not_received", label: "Product Not Received" },
  { value: "product_defective", label: "Product Defective" },
  { value: "service_not_rendered", label: "Service Not Rendered" },
  { value: "other", label: "Other" },
]

export const RefundVoidModal: React.FC<RefundVoidModalProps> = ({
  open,
  onOpenChange,
  order,
  onSubmit,
  loading,
  remainingRefundable,
  baseRemainingRefundable,
  supplementalRemainingRefundable,
  isAuthorized,
  isRefundable,
}) => {
  const { toast } = useToast()
  const [refundAmount, setRefundAmount] = useState("")
  const [refundTarget, setRefundTarget] = useState<"auto" | "base" | "supplemental">("auto")
  const [refundReason, setRefundReason] = useState("customer_request")
  const [refundReasonDescription, setRefundReasonDescription] = useState("")
  const [refundNotes, setRefundNotes] = useState("")

  const handleSubmit = async () => {
    if (isRefundable) {
      if (!refundAmount) {
        toast({ title: "Refund amount required", variant: "destructive" })
        return
      }
      const amountNum = parseFloat(refundAmount)
      if (Number.isNaN(amountNum) || amountNum <= 0) {
        toast({ title: "Enter a valid refund amount", variant: "destructive" })
        return
      }
      if (amountNum > remainingRefundable) {
        toast({ title: "Refund amount exceeds remaining refundable amount", variant: "destructive" })
        return
      }
      if (refundTarget === "base" && amountNum > baseRemainingRefundable) {
        toast({ title: "Refund amount exceeds base refundable amount", variant: "destructive" })
        return
      }
      if (refundTarget === "supplemental" && amountNum > supplementalRemainingRefundable) {
        toast({ title: "Refund amount exceeds supplemental refundable amount", variant: "destructive" })
        return
      }
    }
    await onSubmit({
      amount: isRefundable ? refundAmount : undefined,
      refundTarget,
      reason: refundReason,
      reasonDescription: refundReasonDescription,
      notes: refundNotes,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isAuthorized ? "Void Authorization" : "Process Refund"}</DialogTitle>
          <DialogDescription>
            {isAuthorized
              ? "Void the uncaptured card authorization for this order."
              : `Process a partial or full refund (Max refundable: $${remainingRefundable.toFixed(2)}).`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isRefundable && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Refund Amount ($)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={remainingRefundable}
                placeholder={`Max $${remainingRefundable.toFixed(2)}`}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
            </div>
          )}

          {isRefundable && supplementalRemainingRefundable > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Refund Target
              </label>
              <Select
                value={refundTarget}
                onValueChange={(value: "auto" | "base" | "supplemental") => setRefundTarget(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="base">Refund Base</SelectItem>
                  <SelectItem value="supplemental">Refund Supplemental</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Base refundable: ${baseRemainingRefundable.toFixed(2)}</p>
                <p>Supplemental refundable: ${supplementalRemainingRefundable.toFixed(2)}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Refund Reason
            </label>
            <Select value={refundReason} onValueChange={setRefundReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {refundReasonOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Additional Notes (Optional)
            </label>
            <Textarea
              placeholder="Internal staff notes regarding this action..."
              value={refundNotes}
              onChange={(e) => setRefundNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isAuthorized ? "Confirm Void" : "Confirm Refund"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
