import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  fetchPolicyTemplates,
  fetchClientPolicies,
  createFromTemplate,
  updateClientPolicy,
  publishClientPolicy,
  type PolicyTemplate,
  type ClientPolicy,
  type PolicyTypeSlug,
  POLICY_TYPE_SLUGS,
} from "@/api/policiesApi"

const POLICY_TYPE_TO_TITLE: Record<PolicyTypeSlug, string> = {
  refund_policy: "Refund Policy",
  privacy_policy: "Privacy Policy",
  terms_of_service: "Terms of Service",
  consent_telehealth: "Consent to TeleHealth",
  physician_code_of_conduct: "Physician Code of Conduct",
  shipping_policy: "Shipping Policy",
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 30) return `${diffDays} days ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

export default function Policies() {
  const [templates, setTemplates] = useState<PolicyTemplate[]>([])
  const [clientPolicies, setClientPolicies] = useState<ClientPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadConfirmOpen, setReloadConfirmOpen] = useState(false)
  const [pendingPolicyType, setPendingPolicyType] = useState<PolicyTypeSlug | null>(null)
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [creatingType, setCreatingType] = useState<PolicyTypeSlug | null>(null)
  // Revision counter: bump to force editors to re-render after template reload
  const [revision, setRevision] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [tpls, policies] = await Promise.all([
        fetchPolicyTemplates(),
        fetchClientPolicies(),
      ])
      setTemplates(Array.isArray(tpls) ? tpls : [])
      setClientPolicies(Array.isArray(policies) ? policies : [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load policies")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const policiesList = Array.isArray(clientPolicies) ? clientPolicies : []
  const templatesList = Array.isArray(templates) ? templates : []

  const getPolicyByType = (policyType: PolicyTypeSlug): ClientPolicy | undefined =>
    policiesList.find((p) => p.policy_type === policyType)

  const getTemplateByType = (policyType: PolicyTypeSlug): PolicyTemplate | undefined =>
    templatesList.find((t) => t.policy_type === policyType)

  const handleCreateFromTemplate = async (
    policyType: PolicyTypeSlug,
    templateId?: string,
    force = false
  ) => {
    setCreatingType(policyType)
    try {
      const payload = templateId ? { template_id: templateId } : { policy_type: policyType }
      const created = await createFromTemplate(payload, force)
      setClientPolicies((prev) => {
        const list = Array.isArray(prev) ? prev : []
        const rest = list.filter((p) => p.policy_type !== policyType)
        return [...rest, created]
      })
      // Bump revision so the editor re-renders with new content
      setRevision((r) => r + 1)
      setReloadConfirmOpen(false)
      setPendingPolicyType(null)
      setPendingTemplateId(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create from template")
    } finally {
      setCreatingType(null)
    }
  }

  const onCreateFromTemplateClick = (policyType: PolicyTypeSlug) => {
    const existing = getPolicyByType(policyType)
    const template = getTemplateByType(policyType)
    if (!template) {
      setError("No template available for this policy type.")
      return
    }
    if (existing) {
      setPendingPolicyType(policyType)
      setPendingTemplateId(template.id)
      setReloadConfirmOpen(true)
      return
    }
    handleCreateFromTemplate(policyType, template.id, false)
  }

  const onConfirmReload = () => {
    if (pendingPolicyType != null) {
      handleCreateFromTemplate(
        pendingPolicyType,
        pendingTemplateId ?? undefined,
        true
      )
    }
  }

  const handleSave = async (id: string, content: string) => {
    setSavingId(id)
    try {
      const updated = await updateClientPolicy(id, { final_content: content })
      setClientPolicies((prev) => {
        const list = Array.isArray(prev) ? prev : []
        return list.map((p) => (p.id === id ? updated : p))
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save policy")
    } finally {
      setSavingId(null)
    }
  }

  const handlePublish = async (id: string, content: string) => {
    setSavingId(id)
    try {
      // Save first, then publish
      await updateClientPolicy(id, { final_content: content })
      const updated = await publishClientPolicy(id)
      setClientPolicies((prev) => {
        const list = Array.isArray(prev) ? prev : []
        return list.map((p) => (p.id === id ? updated : p))
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to publish policy")
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto">
        <p className="text-muted-foreground">Loading policies…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Policies</h1>
        <CardDescription className="mt-1">
          Create your own store policies, or customize a template. Saved policies are
          linked in the footer of your checkout. You can also add policies to your
          online store menu. Templates aren't legal advice.
        </CardDescription>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Store and Company policies
        </h2>
      </div>

      {POLICY_TYPE_SLUGS.map((policyType) => {
        const policy = getPolicyByType(policyType)
        const template = getTemplateByType(policyType)
        const title = POLICY_TYPE_TO_TITLE[policyType]
        return (
          <PolicyEditor
            key={`${policyType}-${revision}`}
            policyType={policyType}
            title={title}
            policy={policy}
            template={template}
            onCreateFromTemplate={() => onCreateFromTemplateClick(policyType)}
            onSave={handleSave}
            onPublish={handlePublish}
            saving={savingId === policy?.id}
            creating={creatingType === policyType}
          />
        )
      })}

      <AlertDialog open={reloadConfirmOpen} onOpenChange={setReloadConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reload default template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will reload the default template and overwrite your current
              changes. Any edits you have made to this policy will be lost. Do you want
              to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingPolicyType(null)
                setPendingTemplateId(null)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmReload}>
              Reload template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Rich-text toolbar helpers                                          */
/* ------------------------------------------------------------------ */

function execCmd(command: string, value?: string) {
  document.execCommand(command, false, value)
}

/* ------------------------------------------------------------------ */
/*  PolicyEditor – one per policy type                                 */
/* ------------------------------------------------------------------ */

interface PolicyEditorProps {
  policyType: PolicyTypeSlug
  title: string
  policy: ClientPolicy | undefined
  template: PolicyTemplate | undefined
  onCreateFromTemplate: () => void
  onSave: (id: string, content: string) => Promise<void>
  onPublish: (id: string, content: string) => Promise<void>
  saving: boolean
  creating: boolean
}

function PolicyEditor({
  policyType,
  title,
  policy,
  template,
  onCreateFromTemplate,
  onSave,
  onPublish,
  saving,
  creating,
}: PolicyEditorProps) {
  const content = policy?.final_content ?? ""

  // Sync form when policy content changes (e.g. after create-from-template)
  const editorRef = useRef<HTMLDivElement>(null)
  const [isDirty, setIsDirty] = useState(false)

  // Initialise / reset editor content when external content changes
  const initialContent = policy?.final_content ?? ""
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialContent
      setIsDirty(false)
    }
  }, [initialContent])

  const getEditorContent = (): string => {
    return editorRef.current?.innerHTML ?? ""
  }

  const handleInput = () => {
    setIsDirty(true)
  }

  const handleSaveClick = () => {
    if (policy?.id) {
      onSave(policy.id, getEditorContent())
      setIsDirty(false)
    }
  }

  const handlePublishClick = () => {
    if (policy?.id) {
      onPublish(policy.id, getEditorContent())
      setIsDirty(false)
    }
  }

  const handleHeadingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === "Heading 1") execCmd("formatBlock", "<h1>")
    else if (val === "Heading 2") execCmd("formatBlock", "<h2>")
    else execCmd("formatBlock", "<p>")
    editorRef.current?.focus()
    setIsDirty(true)
  }

  const lastEdited = policy?.updated_at
    ? formatRelativeTime(policy.updated_at)
    : "Never"

  const disabled = !policy?.id

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              Last edited {lastEdited}
              {policy?.status === "published" && policy?.accepted_at && (
                <> · Published {formatRelativeTime(policy.accepted_at)}</>
              )}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateFromTemplate}
            disabled={!template || creating}
          >
            {creating ? "Creating…" : "Create from Template"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border border-border rounded-md">
            {/* ── Toolbar ── */}
            <div className="border-b border-border p-2 bg-muted/30">
              <div className="flex items-center gap-1">
                <select
                  className="text-sm border-none bg-transparent"
                  onChange={handleHeadingChange}
                  defaultValue="Normal"
                  disabled={disabled}
                >
                  <option>Normal</option>
                  <option>Heading 1</option>
                  <option>Heading 2</option>
                </select>
                <div className="h-4 w-px bg-border mx-1" />
                <Button type="button" variant="ghost" size="sm" className="p-1 h-8 w-8"
                  disabled={disabled}
                  onMouseDown={(e) => { e.preventDefault(); execCmd("bold") }}>
                  <strong>B</strong>
                </Button>
                <Button type="button" variant="ghost" size="sm" className="p-1 h-8 w-8"
                  disabled={disabled}
                  onMouseDown={(e) => { e.preventDefault(); execCmd("italic") }}>
                  <em>I</em>
                </Button>
                <Button type="button" variant="ghost" size="sm" className="p-1 h-8 w-8"
                  disabled={disabled}
                  onMouseDown={(e) => { e.preventDefault(); execCmd("underline") }}>
                  <u>U</u>
                </Button>
                <Button type="button" variant="ghost" size="sm" className="p-1 h-8 w-8"
                  disabled={disabled}
                  onMouseDown={(e) => { e.preventDefault(); execCmd("strikeThrough") }}>
                  <s>S</s>
                </Button>
                <div className="h-4 w-px bg-border mx-1" />
                <Button type="button" variant="ghost" size="sm" className="p-1 h-8 w-8"
                  disabled={disabled}
                  onMouseDown={(e) => { e.preventDefault(); execCmd("justifyLeft") }}
                  title="Align left">
                  ≡
                </Button>
                <Button type="button" variant="ghost" size="sm" className="p-1 h-8 w-8"
                  disabled={disabled}
                  onMouseDown={(e) => { e.preventDefault(); execCmd("justifyCenter") }}
                  title="Align center">
                  ≡
                </Button>
                <Button type="button" variant="ghost" size="sm" className="p-1 h-8 w-8"
                  disabled={disabled}
                  onMouseDown={(e) => { e.preventDefault(); execCmd("justifyRight") }}
                  title="Align right">
                  ≡
                </Button>
              </div>
            </div>

            {/* ── Editable area ── */}
            <style>{`
              .policy-editor h1 { font-size: 1.75rem; font-weight: 700; line-height: 1.3; margin: 0.5em 0; }
              .policy-editor h2 { font-size: 1.35rem; font-weight: 600; line-height: 1.35; margin: 0.4em 0; }
              .policy-editor p { margin: 0.25em 0; }
              .policy-editor b, .policy-editor strong { font-weight: 700; }
              .policy-editor i, .policy-editor em { font-style: italic; }
              .policy-editor u { text-decoration: underline; }
              .policy-editor s, .policy-editor strike { text-decoration: line-through; }
            `}</style>
            <div
              ref={editorRef}
              contentEditable={!disabled}
              suppressContentEditableWarning
              onInput={handleInput}
              data-placeholder={"Enter your " + title.toLowerCase() + " content here..."}
              className="policy-editor min-h-[200px] p-3 outline-none text-sm leading-relaxed max-w-none focus:ring-0 [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground"
              style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={disabled || saving || !isDirty}
              onClick={handleSaveClick}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
            {policy?.id && policy?.status === "draft" && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={saving}
                onClick={handlePublishClick}
              >
                Publish
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
