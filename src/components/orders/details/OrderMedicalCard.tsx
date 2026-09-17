import React from "react"
import { useQueries } from "@tanstack/react-query"
import { Order } from "@/api/ordersApi"
import { productApi } from "@/api/products"
import { Stethoscope, Globe } from "lucide-react"

interface OrderMedicalCardProps {
  order: Order
}

export const OrderMedicalCard: React.FC<OrderMedicalCardProps> = ({ order }) => {
  const doctor = order.doctor_name
  const rxDate = order.datePrescribed
  const productIds = React.useMemo(() => {
    const clinicalProductIds = (order.line_items || [])
      .filter((line) => {
        const itemType = String(line.item_type || "").toLowerCase()
        return itemType === "medication" || itemType === "addon"
      })
      .map((line) => line.product_id)
      .filter((productId): productId is number => productId != null)
      .map(String)

    if (clinicalProductIds.length > 0) {
      return [...new Set(clinicalProductIds)]
    }

    return order.product == null ? [] : [String(order.product)]
  }, [order.line_items, order.product])
  const productQueries = useQueries({
    queries: productIds.map((productId) => ({
      queryKey: ["product", productId],
      queryFn: () => productApi.getProduct(productId),
    })),
  })
  const providerNetworks = Array.from(
    productQueries.reduce((networks, query) => {
      const network = query.data?.provider_network?.trim()
      if (network && !networks.has(network.toLowerCase())) {
        networks.set(network.toLowerCase(), network)
      }
      return networks
    }, new Map<string, string>()).values()
  )
  const isLoadingNetworks = productIds.length > 0 && productQueries.some((query) => query.isLoading)
  const providerNetworkLabel = providerNetworks.length === 1 ? "Provider Network:" : "Provider Networks:"
  const providerNetworkValue = isLoadingNetworks
    ? "Loading…"
    : providerNetworks.join(", ") || "Provider network unavailable"

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
      <div className="p-5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
          <Stethoscope className="h-4 w-4 text-primary" />
          <span>Medical Details</span>
        </div>
      </div>

      <div className="p-5 space-y-3.5 text-xs sm:text-sm">
        <div className="flex justify-between items-start text-muted-foreground gap-2">
          <span className="text-[11px] uppercase tracking-wider font-semibold flex-shrink-0">Prescribing Doctor:</span>
          <span className="font-semibold text-slate-900 dark:text-white text-right break-words">
            {doctor || "Not assigned"}
          </span>
        </div>

        <div className="flex justify-between items-start text-muted-foreground gap-2">
          <span className="text-[11px] uppercase tracking-wider font-semibold flex-shrink-0">{providerNetworkLabel}</span>
          <span className="font-semibold text-slate-900 dark:text-white text-right flex items-center gap-1 break-words">
            <Globe className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <span>{providerNetworkValue}</span>
          </span>
        </div>

        <div className="flex justify-between items-start text-muted-foreground gap-2">
          <span className="text-[11px] uppercase tracking-wider font-semibold flex-shrink-0">Rx Received:</span>
          <span className="font-medium text-slate-800 dark:text-slate-200 text-right font-mono break-all">
            {rxDate || "Not recorded"}
          </span>
        </div>

        <div className="flex justify-between items-start text-muted-foreground gap-2 pt-2 border-t border-border/40">
          <span className="text-[11px] uppercase tracking-wider font-semibold flex-shrink-0">Visit Master ID:</span>
          <span className="font-mono text-xs text-slate-900 dark:text-white text-right break-all font-semibold">
            {order.mrn || "Not recorded"}
          </span>
        </div>
      </div>
    </div>
  )
}
