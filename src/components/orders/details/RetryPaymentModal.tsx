import React, { useState } from "react"
import { PatientPaymentMethod } from "@/api/patientPaymentMethodsApi"
import { Button } from "@/components/ui/button"
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
import { Loader2, CreditCard, AlertCircle } from "lucide-react"
import { getMaskedCardLast4 } from "@/utils/paymentMethodDisplay"

interface RetryPaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentMethods: PatientPaymentMethod[]
  loadingMethods: boolean
  methodsError: string | null
  onSubmit: (selectedMethodId: string) => Promise<void>
  retryLoading: boolean
  retryAmount: number
}

export const RetryPaymentModal: React.FC<RetryPaymentModalProps> = ({
  open,
  onOpenChange,
  paymentMethods,
  loadingMethods,
  methodsError,
  onSubmit,
  retryLoading,
  retryAmount,
}) => {
  const [selectedMethodId, setSelectedMethodId] = useState("")

  React.useEffect(() => {
    if (paymentMethods.length > 0 && !selectedMethodId) {
      const defaultMethod = paymentMethods.find((m) => m.is_default) || paymentMethods[0]
      setSelectedMethodId(defaultMethod.id)
    }
  }, [paymentMethods, selectedMethodId])

  const handleSubmit = async () => {
    if (!selectedMethodId) return
    await onSubmit(selectedMethodId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Retry Payment Charge</DialogTitle>
          <DialogDescription>
            Retry the patient charge of ${retryAmount.toFixed(2)} using a saved payment method.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {loadingMethods ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : methodsError ? (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/30 text-xs text-rose-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{methodsError}</span>
            </div>
          ) : paymentMethods.length === 0 ? (
            <p className="text-xs text-muted-foreground">No saved payment methods found for this patient.</p>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Select Saved Card
              </label>
              <Select value={selectedMethodId} onValueChange={setSelectedMethodId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select card" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((pm) => (
                    <SelectItem key={pm.id} value={pm.id}>
                      {pm.card_brand || "Card"} ending in {getMaskedCardLast4(pm.masked_card_number)} {pm.is_default ? "(Default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={retryLoading}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={retryLoading || !selectedMethodId || paymentMethods.length === 0}
          >
            {retryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Process Charge"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
