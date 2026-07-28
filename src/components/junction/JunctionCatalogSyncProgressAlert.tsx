import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import {
  junctionCatalogSettingsApi,
  type SyncStatusResponse,
} from "@/api/junctionCatalogSettings"

export function JunctionCatalogSyncProgressAlert() {
  const location = useLocation()
  const navigate = useNavigate()
  const [job, setJob] = useState<SyncStatusResponse | null>(null)

  useEffect(() => {
    let active = true

    const refresh = async () => {
      try {
        const latest = await junctionCatalogSettingsApi.getReferenceCatalogSyncStatus()
        if (active) {
          setJob(["queued", "running"].includes(latest.status) ? latest : null)
        }
      } catch {
        if (active) setJob(null)
      }
    }

    void refresh()
    const interval = window.setInterval(refresh, 5000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  if (!job || location.pathname === "/dashboard/settings/junction-labs") return null

  const percentage = job.total_pages
    ? Math.min(100, Math.round((job.current_page / job.total_pages) * 100))
    : null

  return (
    <button
      type="button"
      onClick={() => navigate("/dashboard/settings/junction-labs")}
      className="fixed bottom-4 right-4 z-[70] w-[calc(100vw-2rem)] max-w-sm rounded-xl border border-sky-200 bg-white p-4 text-left shadow-xl transition hover:border-sky-300"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-sky-50 p-2 text-[#12517A]">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">Reference catalog syncing</p>
            <span className="text-xs font-medium text-slate-500">
              {percentage === null ? "Starting" : `${percentage}%`}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            {job.total_pages
              ? `Page ${job.current_page} of ${job.total_pages}`
              : "Fetching catalog pages"}
            {` · ${job.total_seen.toLocaleString()} items processed`}
          </p>
          {percentage !== null && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#1676A3] transition-[width] duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          )}
          <p className="mt-2 text-[11px] text-slate-500">You can continue working. Select to view details.</p>
        </div>
      </div>
    </button>
  )
}
