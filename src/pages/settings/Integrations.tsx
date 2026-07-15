import { JunctionIntegrationCard } from "@/components/settings/JunctionIntegrationCard"

export default function Integrations() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect the WellieMD-managed services that power your brand. Junction handles wearable
          &amp; device data.
        </p>
      </div>

      {/* Junction — read-only, managed by WellieMD */}
      <JunctionIntegrationCard />

      {/* Beluga and additional integrations move here next (per design). */}
      <div className="mt-6 max-w-[900px] rounded-xl border border-dashed bg-muted/30 p-6 text-center">
        <p className="text-sm font-medium text-foreground">Beluga Health — coming soon</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Beluga and other managed integrations will appear here. Beluga configuration currently
          lives under Settings › Beluga Settings.
        </p>
      </div>
    </div>
  )
}
