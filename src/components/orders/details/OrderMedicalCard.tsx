import React from "react"
import { Order } from "@/api/ordersApi"
import { Badge } from "@/components/ui/badge"
import { Stethoscope, Globe } from "lucide-react"

interface OrderMedicalCardProps {
  order: Order
}

export const OrderMedicalCard: React.FC<OrderMedicalCardProps> = ({ order }) => {
  const doctor = order.doctor_name || order.provider_network || "Junction Physician Network"
  const network = order.provider_network || "Beluga Health"
  const rxDate = order.datePrescribed || order.prescription_source_received_at || order.date || "—"
  const masterId = order.episode_id || order.display_id || order.id

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
      <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
          <Stethoscope className="h-4 w-4 text-primary" />
          <span>Medical Details & Provider Network</span>
        </div>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] uppercase font-semibold">
          Licensed Rx Network
        </Badge>
      </div>

      <div className="p-5 space-y-3.5 text-xs sm:text-sm">
        <div className="flex justify-between items-start text-muted-foreground gap-2">
          <span className="text-[11px] uppercase tracking-wider font-semibold flex-shrink-0">Prescribing Doctor:</span>
          <span className="font-semibold text-slate-900 dark:text-white text-right break-words">
            {doctor}
          </span>
        </div>

        <div className="flex justify-between items-start text-muted-foreground gap-2">
          <span className="text-[11px] uppercase tracking-wider font-semibold flex-shrink-0">Clinical Network:</span>
          <span className="font-semibold text-slate-900 dark:text-white text-right flex items-center gap-1 break-words">
            <Globe className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <span>{network}</span>
          </span>
        </div>

        <div className="flex justify-between items-start text-muted-foreground gap-2">
          <span className="text-[11px] uppercase tracking-wider font-semibold flex-shrink-0">Rx Received:</span>
          <span className="font-medium text-slate-800 dark:text-slate-200 text-right font-mono break-all">
            {rxDate}
          </span>
        </div>

        <div className="flex justify-between items-start text-muted-foreground gap-2 pt-2 border-t border-border/40">
          <span className="text-[11px] uppercase tracking-wider font-semibold flex-shrink-0">Master Episode ID:</span>
          <span className="font-mono text-xs text-slate-900 dark:text-white text-right break-all font-semibold">
            {masterId}
          </span>
        </div>
      </div>
    </div>
  )
}
