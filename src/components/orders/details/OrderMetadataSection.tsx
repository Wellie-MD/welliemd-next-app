import React, { useState } from "react"
import { Order } from "@/api/ordersApi"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Stethoscope, FileCode2, Link as LinkIcon, Copy, Check, Globe } from "lucide-react"

interface OrderMetadataSectionProps {
  order: Order
}

export const OrderMetadataSection: React.FC<OrderMetadataSectionProps> = ({ order }) => {
  const { toast } = useToast()
  const [copiedUrl, setCopiedUrl] = useState(false)

  const hasMetadata =
    Boolean(order.doctor_name) ||
    Boolean(order.provider_network) ||
    Boolean(order.episode_id) ||
    Boolean(order.checkout_url) ||
    Boolean(order.prescription_source_received_at)

  if (!hasMetadata) return null

  const handleCopyCheckoutUrl = () => {
    if (!order.checkout_url) return
    navigator.clipboard.writeText(order.checkout_url)
    setCopiedUrl(true)
    toast({ title: "Checkout URL copied to clipboard" })
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <FileCode2 className="h-4 w-4 text-primary" />
          <span>Clinical & System Metadata</span>
        </div>
      </div>

      <div className="p-6 space-y-4 text-xs sm:text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {order.doctor_name && (
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
              <span className="text-muted-foreground text-xs block">Prescribing Doctor</span>
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4 text-emerald-600" />
                <span>{order.doctor_name}</span>
              </div>
            </div>
          )}

          {order.provider_network && (
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
              <span className="text-muted-foreground text-xs block">Provider Network</span>
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-primary" />
                <span>{order.provider_network}</span>
              </div>
            </div>
          )}

          {order.episode_id && (
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
              <span className="text-muted-foreground text-xs block">Episode ID</span>
              <div className="font-mono text-xs text-slate-900 dark:text-white break-all">
                {order.episode_id}
              </div>
            </div>
          )}
        </div>

        {/* Direct Checkout URL */}
        {order.checkout_url && (
          <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-2">
            <div className="min-w-0 flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-mono text-xs text-muted-foreground break-all">
                {order.checkout_url}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCheckoutUrl}
              className="h-7 px-2.5 text-xs font-medium gap-1 flex-shrink-0"
            >
              {copiedUrl ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              <span>{copiedUrl ? "Copied" : "Copy Link"}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
