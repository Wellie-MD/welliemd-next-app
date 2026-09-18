import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { policyApi, type LabPolicyTemplate } from "@/api/policies"

type EditableLabPolicy = LabPolicyTemplate & {
  dirty?: boolean
  saving?: boolean
}

const LAB_POLICY_DESCRIPTIONS: Record<LabPolicyTemplate["policy_type"], string> = {
  lab_hipaa_authorization:
    "Platform-managed HIPAA disclosure shown during lab checkout. Tenant users can read it during checkout, but they cannot edit it.",
  lab_telehealth_consent:
    "Platform-managed telehealth consent shown during lab checkout. Tenant users cannot override this content.",
}

interface Props {
  embedded?: boolean
}

export default function LabPolicyTemplatesPanel({ embedded = false }: Props) {
  const { toast } = useToast()
  const [labPolicies, setLabPolicies] = useState<EditableLabPolicy[]>([])
  const [labPoliciesLoading, setLabPoliciesLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await policyApi.getLabPolicies()
        if (!active) return
        setLabPolicies(data)
      } catch {
        if (!active) return
        toast({
          title: "Load failed",
          description: "Unable to load lab checkout policy templates.",
          variant: "destructive",
        })
      } finally {
        if (active) setLabPoliciesLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [toast])

  const updateLabPolicy = (
    policyType: LabPolicyTemplate["policy_type"],
    patch: Partial<EditableLabPolicy>
  ) => {
    setLabPolicies((current) =>
      current.map((policy) =>
        policy.policy_type === policyType ? { ...policy, ...patch, dirty: true } : policy
      )
    )
  }

  const handleSaveLabPolicy = async (policy: EditableLabPolicy) => {
    setLabPolicies((current) =>
      current.map((item) =>
        item.id === policy.id ? { ...item, saving: true } : item
      )
    )
    try {
      const saved = await policyApi.updateLabPolicy(policy.id, {
        name: policy.name,
        content: policy.content,
        version: policy.version,
        is_active: policy.is_active,
      })
      setLabPolicies((current) =>
        current.map((item) =>
          item.id === policy.id ? { ...saved, dirty: false, saving: false } : item
        )
      )
      const summary = saved.tenant_sync_summary
      const failedSyncs = saved.tenant_sync?.filter((item) => !item.success) ?? []
      if (summary && !summary.all_success) {
        const failedNames = failedSyncs
          .map((item) => item.client_name || item.client_id || item.sync_url || "unknown tenant")
          .slice(0, 3)
          .join(", ")
        toast({
          title: "Policy saved, tenant sync failed",
          description: `${saved.name} was saved in admin, but ${summary.failed} of ${summary.total} tenant syncs failed${failedNames ? `: ${failedNames}` : "."}`,
          variant: "destructive",
        })
      } else {
        const total = summary?.total ?? saved.tenant_sync?.length ?? 0
        toast({
          title: "Policy saved",
          description: total > 0
            ? `${saved.name} updated and synced to ${total} tenant runtime${total === 1 ? "" : "s"}.`
            : `${saved.name} updated. No active tenant runtimes were configured for sync.`,
        })
      }
    } catch {
      setLabPolicies((current) =>
        current.map((item) =>
          item.id === policy.id ? { ...item, saving: false } : item
        )
      )
      toast({
        title: "Save failed",
        description: "Unable to update the policy template.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className={embedded ? "space-y-6" : ""}>
      {!embedded && (
        <div className="mb-6 mt-10">
          <h2 className="text-lg font-semibold text-foreground mb-2">Lab checkout policies</h2>
          <CardDescription>
            Only these two templates are platform-managed for Junction lab checkout. Tenant terms and privacy remain client-owned.
          </CardDescription>
        </div>
      )}

      {labPoliciesLoading ? (
        <Card className="mb-6">
          <CardContent className="py-10 text-sm text-muted-foreground">Loading policy templates…</CardContent>
        </Card>
      ) : (
        labPolicies.map((policy) => (
          <Card key={policy.id} className="mb-6">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle>{policy.name}</CardTitle>
                  <CardDescription>{LAB_POLICY_DESCRIPTIONS[policy.policy_type]}</CardDescription>
                </div>
                <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Active</p>
                    <p className="text-xs text-muted-foreground">Tenant sync uses the active version.</p>
                  </div>
                  <Switch
                    checked={policy.is_active}
                    onCheckedChange={(checked) => updateLabPolicy(policy.policy_type, { is_active: checked })}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr]">
                <div className="space-y-2">
                  <Label htmlFor={`${policy.id}-name`}>Template Name</Label>
                  <Input
                    id={`${policy.id}-name`}
                    value={policy.name}
                    onChange={(event) => updateLabPolicy(policy.policy_type, { name: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${policy.id}-version`}>Version</Label>
                  <Input
                    id={`${policy.id}-version`}
                    value={policy.version}
                    onChange={(event) => updateLabPolicy(policy.policy_type, { version: event.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${policy.id}-content`}>Policy Content</Label>
                <Textarea
                  id={`${policy.id}-content`}
                  value={policy.content}
                  onChange={(event) => updateLabPolicy(policy.policy_type, { content: event.target.value })}
                  className="min-h-[320px] resize-y"
                />
                <p className="text-xs text-muted-foreground">
                  Plain text is preserved with line breaks in the checkout modal. Existing orders keep their own consent snapshot.
                </p>
                {policy.placeholders?.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-medium text-foreground">Supported placeholders</p>
                    <div className="flex flex-wrap gap-2">
                      {policy.placeholders.map((placeholder) => (
                        <Badge key={placeholder} variant="outline" className="font-mono text-[11px]">
                          {`{{ ${placeholder} }}`}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      These values render per tenant at checkout time. Use them instead of hardcoding client names.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="text-xs text-muted-foreground">
                  Updated {new Date(policy.updated_at).toLocaleString()}
                </div>
                <Button onClick={() => void handleSaveLabPolicy(policy)} disabled={policy.saving || !policy.dirty}>
                  {policy.saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
