import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { junctionIntegrationApi } from "@/api/junctionIntegration"
import { Button } from "@/components/ui/button"

interface Props {
  onQueued: () => void
}

export function WearableProviderSyncButton({ onQueued }: Props) {
  const [syncing, setSyncing] = useState(false)

  const queueSync = async () => {
    setSyncing(true)
    try {
      await junctionIntegrationApi.syncWearableProviders()
      toast.success("Provider synchronization started.")
      window.setTimeout(onQueued, 2500)
    } catch {
      toast.error("Unable to start provider synchronization.")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Button
      variant="outline"
      className="h-auto gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      onClick={queueSync}
      disabled={syncing}
    >
      <RefreshCw className={syncing ? "h-3 w-3 animate-spin" : "h-3 w-3"} />
      <span className="hidden sm:inline-block">
        {syncing ? "Starting sync" : "Sync providers"}
      </span>
      <span className="sm:hidden">
        {syncing ? "Syncing..." : "Sync"}
      </span>
    </Button>
  )
}
