import React from "react"
import { Order } from "@/api/ordersApi"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, Phone, MapPin, ClipboardList, Copy, Check } from "lucide-react"

interface OrderPatientCardProps {
  order: Order
  onOpenPatientResponses: () => void
}

export const OrderPatientCard: React.FC<OrderPatientCardProps> = ({ order, onOpenPatientResponses }) => {
  const { toast } = useToast()
  const [copied, setCopied] = React.useState(false)

  const patientName = order.patient?.full_name || order.name || "Unknown Patient"
  const initials = patientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const email = order.email || order.patient_responses?.patientInfo?.email || "—"
  const phone = order.phone || order.patient_responses?.patientInfo?.phone || "—"
  const address = order.shipping_address_snapshot?.formatted || order.shipping_address || order.address || "—"
  const addressIsSnapshot = Boolean(order.shipping_address_snapshot?.formatted)
  const isPhaseTwoOrder = Boolean(order.treatment_case_id || order.combined_submission_id)

  const handleCopyAddress = () => {
    if (address === "—") return
    navigator.clipboard.writeText(address)
    setCopied(true)
    toast({ title: "Address copied to clipboard" })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden space-y-6">
      {/* Patient Profile Header */}
      <div className="p-6 border-b border-border space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary/20 bg-primary/10 text-primary font-bold text-base">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {patientName}
            </h3>
            {order.mrn && (
              <p className="text-xs text-muted-foreground font-mono">
                MRN: {order.mrn}
              </p>
            )}
          </div>
        </div>

        {/* Contact info list */}
        <div className="space-y-2.5 text-xs sm:text-sm pt-2">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <a href={`mailto:${email}`} className="hover:underline truncate">
              {email}
            </a>
          </div>

          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <a href={`tel:${phone}`} className="hover:underline">
              {phone}
            </a>
          </div>
        </div>
      </div>

      {/* Shipping & Pharmacy Info */}
      <div className="px-6 pb-6 space-y-4">
        {/* Shipping Address */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span>Shipping Address</span>
            </div>
            {address !== "—" && (
              <button
                type="button"
                onClick={handleCopyAddress}
                className="text-primary hover:underline flex items-center gap-1 text-[11px] font-normal"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-muted/40 p-3 rounded-xl border border-border">
            {address}
          </p>
          {address !== "—" && !addressIsSnapshot && (
            <p className="text-[11px] text-amber-700 dark:text-amber-300">
              {isPhaseTwoOrder
                ? "Order shipping snapshot unavailable; showing current patient profile address."
                : "Legacy order: current patient profile address."}
            </p>
          )}
        </div>

        {/* Questionnaire Responses Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenPatientResponses}
          className="w-full h-10 text-xs font-medium gap-2 rounded-xl"
        >
          <ClipboardList className="h-4 w-4 text-primary" />
          <span>View Patient Intake Responses</span>
        </Button>
      </div>
    </div>
  )
}
