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
    <Button variant="outline" size="sm" onClick={queueSync} disabled={syncing}>
      <RefreshCw className={syncing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
      {syncing ? "Starting sync" : "Sync providers"}
    </Button>
  )
}
