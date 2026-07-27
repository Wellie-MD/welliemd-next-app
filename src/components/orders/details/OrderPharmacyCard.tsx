import React from "react"
import { Order } from "@/api/ordersApi"
import { Badge } from "@/components/ui/badge"
import { Building2, Truck, ExternalLink } from "lucide-react"

interface OrderPharmacyCardProps {
  order: Order
}

export const OrderPharmacyCard: React.FC<OrderPharmacyCardProps> = ({ order }) => {
  const pharmacyName = order.pharmacy_name || order.pharmacy_display || order.booking_location || "Boothwyn Pharmacy"
  const fulfillmentStatus = order.fulfillmentStatus || order.fulfillment || order.status || "Processing"
  const carrier = order.shipment_provider || "FedEx Ground"
  const trackingNumber = order.tracking_number || order.tracking
  const trackingUrl = order.tracking_url

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
      <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
          <Building2 className="h-4 w-4 text-primary" />
          <span>Pharmacy & Fulfillment Details</span>
        </div>
        <Badge variant="outline" className="capitalize text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
          {fulfillmentStatus}
        </Badge>
      </div>

      <div className="p-5 space-y-3.5 text-xs sm:text-sm">
        <div className="flex justify-between items-start text-muted-foreground gap-2">
          <span className="text-[11px] uppercase tracking-wider font-semibold flex-shrink-0">Fulfillment Pharmacy:</span>
          <span className="font-semibold text-slate-900 dark:text-white text-right break-words">
            {pharmacyName}
          </span>
        </div>

        <div className="flex justify-between items-start text-muted-foreground gap-2">
          <span className="text-[11px] uppercase tracking-wider font-semibold flex-shrink-0">Fulfillment Status:</span>
          <span className="font-semibold text-slate-900 dark:text-white capitalize text-right break-words">
            {fulfillmentStatus}
          </span>
        </div>

        <div className="flex justify-between items-start text-muted-foreground gap-2">
          <span className="text-[11px] uppercase tracking-wider font-semibold flex-shrink-0">Shipping Carrier:</span>
          <span className="font-medium text-slate-800 dark:text-slate-200 text-right flex items-center gap-1 break-words">
            <Truck className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
            <span>{carrier}</span>
          </span>
        </div>

        {trackingNumber && (
          <div className="flex justify-between items-start text-muted-foreground gap-2 pt-2 border-t border-border/40">
            <span className="text-[11px] uppercase tracking-wider font-semibold flex-shrink-0">Tracking #:</span>
            <div className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex flex-wrap items-center justify-end gap-1 break-all text-right">
              <span>{trackingNumber}</span>
              {trackingUrl && (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-primary hover:text-primary/80 flex items-center gap-0.5 ml-1 inline-flex"
                >
                  <span>Track</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
