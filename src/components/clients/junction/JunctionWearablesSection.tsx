import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  AUTH_LABEL,
  WEARABLE_PROVIDERS,
  WEAR_PRIORITY,
  type WearableProvider,
} from "./wearableCatalog"

// UI-only wearables config. No backend calls yet — local state mirrors the
// client prototype's provider catalog and data-prioritization controls.

const AUTH_CLASS: Record<string, string> = {
  oauth: "bg-blue-50 text-blue-700 border-blue-200",
  sdk: "bg-purple-50 text-purple-700 border-purple-200",
  email: "bg-teal-50 text-teal-700 border-teal-200",
}

export function JunctionWearablesSection({
  initialEnabled = false,
}: {
  initialEnabled?: boolean
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [providers, setProviders] = useState<WearableProvider[]>(() =>
    WEARABLE_PROVIDERS.map((p) => ({ ...p }))
  )
  const [priority, setPriority] = useState<string[]>(() => [...WEAR_PRIORITY])

  const byId = useMemo(() => {
    const map = new Map<string, WearableProvider>()
    providers.forEach((p) => map.set(p.id, p))
    return map
  }, [providers])

  const toggleOffered = (id: string) =>
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    )

  const setPull = (id: string, value: string) => {
    const days = Math.max(1, Math.min(365, Number(value) || 0))
    setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, pull: days } : p)))
  }

  const move = (id: string, dir: -1 | 1) =>
    setPriority((prev) => {
      const idx = prev.indexOf(id)
      const next = idx + dir
      if (idx < 0 || next < 0 || next >= prev.length) return prev
      const copy = [...prev]
      ;[copy[idx], copy[next]] = [copy[next], copy[idx]]
      return copy
    })

  const offeredPriority = priority.filter((id) => byId.get(id)?.enabled)

  return (
    <div className="space-y-6">
      {/* Enable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Wearables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="text-xs text-muted-foreground">
            Let this client's patients connect wearables and smart scales. Device data appears in
            the client portal (read-only) and routes through the same Junction team.
          </p>
          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="font-medium">Enable wearables for this client</div>
              <div className="text-xs text-muted-foreground">
                Patients can link devices from their portal; weight &amp; activity trends appear in
                the client portal (read-only). Beluga providers do not see wearable data.
              </div>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* Provider catalog */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Provider catalog</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p className="mb-3 text-xs text-muted-foreground">
            Providers this brand's patients can connect. Toggle availability and set each provider's
            historical backfill window (advisory; Junction caps at 365 days).
          </p>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full">
              <thead className="bg-muted/50 text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Provider</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-left">Auth</th>
                  <th className="px-3 py-2 text-left">Historical pull</th>
                  <th className="px-3 py-2 text-right">Offered</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-3 py-2 font-medium">{p.name}</td>
                    <td className="px-3 py-2">
                      <span className="inline-block rounded-full border bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                        {p.cat}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "inline-block rounded-full border px-2 py-0.5 text-[10.5px] font-medium",
                          AUTH_CLASS[p.auth]
                        )}
                      >
                        {AUTH_LABEL[p.auth]}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {p.auth === "email" ? (
                        <span className="text-xs text-muted-foreground">provider-set</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            max={365}
                            value={p.pull}
                            onChange={(e) => setPull(p.id, e.target.value)}
                            className="h-8 w-16 font-mono text-xs"
                          />
                          <span className="text-xs text-muted-foreground">days</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Switch
                        checked={p.enabled}
                        onCheckedChange={() => toggleOffered(p.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Data prioritization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Data prioritization</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p className="mb-3 text-xs text-muted-foreground">
            When a patient connects more than one device reporting the same metric, the higher-ranked
            source wins. Saved as <code>provider_priority_overrides</code> on this brand's Junction
            team.
          </p>
          <div className="space-y-2">
            {offeredPriority.map((id, idx) => {
              const p = byId.get(id)
              if (!p) return null
              return (
                <div
                  key={id}
                  className="flex items-center gap-3 rounded-md border bg-card px-3 py-2"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md border bg-muted text-xs font-bold text-muted-foreground">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium">
                    {p.name}{" "}
                    <span className="text-xs font-normal text-muted-foreground">· {p.cat}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => move(id, -1)}
                    disabled={idx === 0}
                    className="flex h-6 w-6 items-center justify-center rounded-md border text-muted-foreground hover:text-foreground disabled:opacity-40"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(id, 1)}
                    disabled={idx === offeredPriority.length - 1}
                    className="flex h-6 w-6 items-center justify-center rounded-md border text-muted-foreground hover:text-foreground disabled:opacity-40"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default JunctionWearablesSection
