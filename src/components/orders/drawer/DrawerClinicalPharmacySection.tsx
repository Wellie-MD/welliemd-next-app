import React, { useState } from "react"
import { AdminOrder } from "@/api/dashboardApi"
import { useToast } from "@/hooks/use-toast"
import { Stethoscope, User, Mail, Phone, Building2, ExternalLink, Copy, Check, Calendar, Hash, MapPin, Truck } from "lucide-react"
import { parseStatusLabel, getPrototypePillClass } from "./drawerUtils"

interface DrawerClinicalPharmacySectionProps {
  order: AdminOrder
}

export const DrawerClinicalPharmacySection: React.FC<DrawerClinicalPharmacySectionProps> = ({ order }) => {
  const { toast } = useToast()
  const [copiedAddr, setCopiedAddr] = useState(false)

  const doctor = order.doctor_name || "—"
  const masterId = order.master_id || order.id

  const email = order.patient_email || "—"
  const phone = order.patient_phone || "—"
  const address = (order as any).shipping_address || (order as any).address || "—"

  const pharmacyName = order.pharmacy_name || (order as any).pharmacy?.name || "—"
  const pharmacyNpi = (order as any).pharmacy_npi || (order as any).pharmacy?.npi || (order as any).pharmacy_id || "—"
  const pharmacyPhone = (order as any).pharmacy_phone || (order as any).pharmacy?.phone || "—"
  const pharmacyAddress = (order as any).pharmacy_address || (order as any).pharmacy?.address || "—"

  const rawFulfillmentStatus = (order as any).fulfillmentStatus || (order as any).pharmacy_fulfillment_status || order.status || "processing"
  const fulfillmentStatusParsed = parseStatusLabel(rawFulfillmentStatus)
  const fulfillmentPillClass = getPrototypePillClass(rawFulfillmentStatus)

  const carrier = (order as any).shipment_provider || (order as any).carrier || "—"
  const trackingNumber = order.tracking_number
  const trackingUrl = (order as any).tracking_url

  const rxTransmittedDate = order.prescribed_at ? new Date(order.prescribed_at).toLocaleDateString() : "—"

  const handleCopyAddress = () => {
    if (address === "—") return
    navigator.clipboard.writeText(address)
    setCopiedAddr(true)
    toast({ title: "Shipping address copied" })
    setTimeout(() => setCopiedAddr(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Patient Section */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono border-b border-border/40 pb-1 flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-primary" />
          <span>Patient Details</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
            <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span>{order.patient_name}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <a href={`mailto:${email}`} className="hover:underline break-all">
              {email}
            </a>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <a href={`tel:${phone}`} className="hover:underline">
              {phone}
            </a>
          </div>

          {address !== "—" && (
            <div className="pt-2 border-t border-border/40 flex items-start justify-between gap-2 text-[11px]">
              <span className="text-muted-foreground flex-shrink-0">Shipping Address:</span>
              <div className="text-right">
                <span className="text-slate-900 dark:text-white block break-words">{address}</span>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="text-primary hover:underline inline-flex items-center gap-1 text-[10px] pt-0.5"
                >
                  {copiedAddr ? <Check className="h-2.5 w-2.5 text-emerald-600" /> : <Copy className="h-2.5 w-2.5" />}
                  <span>{copiedAddr ? "Copied" : "Copy address"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clinical Details Section */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono border-b border-border/40 pb-1 flex items-center gap-1.5">
          <Stethoscope className="h-3.5 w-3.5 text-primary" />
          <span>Clinical & Medical Network</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
            <span className="text-muted-foreground">Prescribing Doctor:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{doctor}</span>
          </div>

          <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
            <span className="text-muted-foreground">Client Organization:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{order.client_name}</span>
          </div>

          <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 pt-1.5 border-t border-border/40">
            <span className="text-muted-foreground">Master Episode ID:</span>
            <span className="font-mono text-[11px] text-slate-900 dark:text-white font-medium break-all">{masterId}</span>
          </div>
        </div>
      </div>

      {/* Pharmacy Details Section */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono border-b border-border/40 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span>Fulfillment Pharmacy Details</span>
          </div>
          <span className={fulfillmentPillClass}>
            {fulfillmentStatusParsed}
          </span>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
            <span className="text-muted-foreground">Fulfillment Pharmacy:</span>
            <span className="font-bold text-slate-900 dark:text-white">{pharmacyName}</span>
          </div>

          {pharmacyNpi !== "—" && (
            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
              <span className="text-muted-foreground">Pharmacy NPI / ID:</span>
              <span className="font-mono text-[11px] text-slate-900 dark:text-white">{pharmacyNpi}</span>
            </div>
          )}

          {pharmacyPhone !== "—" && (
            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
              <span className="text-muted-foreground">Pharmacy Phone:</span>
              <a href={`tel:${pharmacyPhone}`} className="hover:underline font-mono text-[11px] text-slate-900 dark:text-white">
                {pharmacyPhone}
              </a>
            </div>
          )}

          {pharmacyAddress !== "—" && (
            <div className="flex justify-between items-start text-slate-700 dark:text-slate-300">
              <span className="text-muted-foreground flex-shrink-0">Pharmacy Location:</span>
              <span className="text-right text-slate-900 dark:text-white break-words text-[11px]">{pharmacyAddress}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 pt-1.5 border-t border-border/40">
            <span className="text-muted-foreground">Rx Sent Date:</span>
            <span className="font-mono text-[11px] text-slate-900 dark:text-white font-medium">{rxTransmittedDate}</span>
          </div>

          <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
            <span className="text-muted-foreground">Shipping Carrier:</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">{carrier}</span>
          </div>

          {trackingNumber && (
            <div className="flex justify-between items-center pt-1.5 border-t border-border/40">
              <span className="text-muted-foreground">Tracking Number:</span>
              <div className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <span>{trackingNumber}</span>
                {trackingUrl && (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline ml-1"
                  >
                    <ExternalLink className="h-3 w-3 inline" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
