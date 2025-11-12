import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useClients } from "@/hooks/useClients"
import { ExternalLink } from "lucide-react"
import { templateApi, type QuestionnaireTemplate } from "@/api/questionnaires"

const USE_VISIT_ROUTES = true

// ---------- helpers ----------
function ensureHttpsBase(urlLike?: string): string {
  const fallback = "https://my.welliemd.com"
  if (!urlLike) return fallback
  const trimmed = urlLike.trim().replace(/\/+$/, "")
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function parseQueryParams(qs: string | undefined | null): URLSearchParams {
  const s = (qs || "").trim()
  const raw = s.startsWith("?") ? s.slice(1) : s
  return new URLSearchParams(raw)
}

function buildLink({
  base,
  path = "",
  qs,
}: {
  base: string
  path?: string
  qs?: string | null | undefined
}) {
  try {
    const baseWithSlash = ensureHttpsBase(base) + "/"
    const cleanPath = (path || "").replace(/^\/+/, "")
    const u = new URL(cleanPath, baseWithSlash)
    const params = parseQueryParams(qs)
    u.search = ""
    params.forEach((v, k) => u.searchParams.set(k, v))
    return u.toString()
  } catch {
    return "" // invalid URL
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement("textarea")
      ta.value = text
      ta.setAttribute("readonly", "")
      ta.style.position = "absolute"
      ta.style.left = "-9999px"
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand("copy")
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

// ---------- helpers ----------
function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function inferFrontendPath(t: QuestionnaireTemplate): string {
  const anyT = t as any
  const explicit = anyT.frontend_path as string | undefined
  if (explicit && explicit.startsWith("/")) return explicit
  if (explicit) return `/${explicit}`
  const qtype = t.questionnaire_type?.trim()
  if (qtype && /^[a-z0-9-_/]+$/i.test(qtype)) {
    const clean = qtype.startsWith("/") ? qtype : `/questionnaires/${qtype.replace(/^\//, "")}`
    return clean
  }
  if (t.name) return `/questionnaires/${slugify(t.name)}`
  return `/questionnaires/${t.id}`
}

// ---------- visit detection ----------
function resolveVisitType(t: QuestionnaireTemplate): "GLP" | "ED" | "weight_loss" | null {
  const hay = [
    t.name,
    t.questionnaire_type,
    (t as any)?.beluga_visit_type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  if (/\bglp\b|\bglp-?1\b|\bindividualized glp\b/.test(hay)) return "GLP"
  if (/\bed\b|\berectile dysfunction\b/.test(hay)) return "ED"
  if (/\bstandard weight loss\b/.test(hay)) return "weight_loss"
  if (/\bweight\s*loss\b/.test(hay)) return "weight_loss"
  return null
}

function visitTypeToPathSegment(v: "GLP" | "ED" | "weight_loss") {
  if (v === "GLP") return "glp"
  if (v === "ED") return "ed"
  return "weight_loss"
}

// ---------- types ----------
type Affiliate = {
  id: string
  name: string
  slug: string
  referral_link: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  affiliate: Affiliate | null
}

export default function AffiliateLinksModal({ open, onOpenChange, affiliate }: Props) {
  const { currentClient } = useClients()
  const questionnaireDomain = ensureHttpsBase(currentClient?.questionnaire_url)

  const qs = useMemo(() => {
    if (!affiliate) return ""
    const p = new URLSearchParams()
    p.set("referral-campaign", affiliate.slug)
    p.set("referral-source", "affiliate")
    return `?${p.toString()}`
  }, [affiliate])

  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<QuestionnaireTemplate[]>([])

  // fetch templates
  useEffect(() => {
    if (!open) return
    let cancelled = false
    const controller = new AbortController()

    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await templateApi.listTemplates({ page_size: 100, ordering: "name" }, controller.signal)
        const results = Array.isArray(data) ? data : (data as any)?.results ?? []
        const publishedOnly = results.filter((t: QuestionnaireTemplate) => t.is_published)
        if (!cancelled) setTemplates(publishedOnly)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load questionnaires")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [open])

  const copy = async (text: string) => {
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopiedLink(text)
      setTimeout(() => setCopiedLink(null), 2000)
    }
  }

  // ✅ Always run hooks before conditional returns
  const items = useMemo(() => {
    return templates
      .map((t) => {
        const vt = resolveVisitType(t)
        const visitPath = vt ? `/visit/${visitTypeToPathSegment(vt)}` : null
        const legacyPath = inferFrontendPath(t)
        return { t, vt, visitPath, legacyPath }
      })
      .filter((i) => (USE_VISIT_ROUTES ? !!i.vt : true))
  }, [templates])

  if (!affiliate) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Links for {affiliate.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Referral Link */}
          <div>
            <p className="text-sm font-medium mb-2">Referral Link</p>
            <div className="flex items-center gap-2">
              <Input readOnly value={affiliate.referral_link} />
              <Button variant="secondary" onClick={() => copy(affiliate.referral_link)}>
                {copiedLink === affiliate.referral_link ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Questionnaires */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Questionnaires</p>
              {loading && <span className="text-xs text-muted-foreground">Loading…</span>}
            </div>

            {error && (
              <div className="rounded-md border p-3 text-sm text-red-600">{error}</div>
            )}

            {!loading && !error && items.length === 0 && (
              <div className="rounded-md border p-3 text-sm text-muted-foreground">
                No questionnaires found.
              </div>
            )}

            {!loading && !error && items.length > 0 && (
              <div className="rounded-md border divide-y">
                {items.map(({ t, visitPath, legacyPath }) => {
                  const path = USE_VISIT_ROUTES && visitPath ? visitPath : legacyPath
                  const full = buildLink({ base: questionnaireDomain, path, qs })
                  const openDisabled = !full

                  return (
                    <div key={t.id} className="flex items-center justify-between p-3">
                      <div className="min-w-0">
                        <div className="font-medium">{t.name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => copy(full)} disabled={openDisabled}>
                          {copiedLink === full ? "Copied" : "Copy Link"}
                        </Button>
                        <a
                          href={full || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={openDisabled ? "Invalid URL" : "Open in new tab"}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${
                            openDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted"
                          }`}
                          onClick={(e) => {
                            if (openDisabled) e.preventDefault()
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
