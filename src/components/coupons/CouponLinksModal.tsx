import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useClients } from "@/hooks/useClients"

// ⬇️ import your existing API layer (adjust path if needed)
import { templateApi, type QuestionnaireTemplate } from "@/api/questionnaires"

// ------------ helpers (unchanged) ------------
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
  fallbackPromo,
  fallbackSource = "coupon",
}: {
  base: string
  path?: string
  qs?: string | null | undefined
  fallbackPromo: string
  fallbackSource?: string
}) {
  const baseWithSlash = ensureHttpsBase(base) + "/"
  const cleanPath = (path || "").replace(/^\/+/, "")
  const u = new URL(cleanPath, baseWithSlash)

  const params = parseQueryParams(qs)
  if (!params.has("promo") && fallbackPromo) params.set("promo", fallbackPromo)
  if (!params.has("promo-source")) params.set("promo-source", fallbackSource)

  u.search = ""
  params.forEach((v, k) => u.searchParams.set(k, v))
  return u.toString()
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

// ------------ local utils ------------
function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Tries to infer a frontend path for a template.
 * Priority:
 * 1) template.frontend_path (if BE provides this)
 * 2) /questionnaires/{questionnaire_type} (if looks slug-like)
 * 3) /questionnaires/{slug(name)}
 * 4) Fallback to id: /questionnaires/{id}
 */
function inferFrontendPath(t: QuestionnaireTemplate): string {
  const anyT = t as any
  const explicit = anyT.frontend_path as string | undefined
  if (explicit && explicit.startsWith("/")) return explicit
  if (explicit) return `/${explicit}`

  const qtype = t.questionnaire_type?.trim()
  if (qtype && /^[a-z0-9-_/]+$/i.test(qtype)) {
    // if BE sends something like "glp1-weight-loss" or "glp/ed"
    const clean = qtype.startsWith("/") ? qtype : `/questionnaires/${qtype.replace(/^\//, "")}`
    return clean
  }

  if (t.name) {
    return `/questionnaires/${slugify(t.name)}`
  }

  return `/questionnaires/${t.id}`
}

type Coupon = {
  id: string
  code: string
  promo_link?: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  coupon: Coupon | null
}

export default function CouponLinksModal({ open, onOpenChange, coupon }: Props) {
  const { currentClient } = useClients()
  const questionnaireDomain = ensureHttpsBase(currentClient?.questionnaire_url)

  const qs = useMemo(() => {
    if (!coupon) return ""
    return coupon.promo_link || `?promo=${encodeURIComponent(coupon.code)}&promo-source=coupon`
  }, [coupon])

  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<QuestionnaireTemplate[]>([])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await templateApi.listTemplates(
          // ask for published ones first if your BE supports filtering
          { page_size: 100, ordering: "name" },
          controller.signal
        )

        const results = Array.isArray(data) ? data : (data as any)?.results ?? []
        const publishedOnly = results.filter((t: QuestionnaireTemplate) => t.is_published)

        if (!cancelled) setTemplates(publishedOnly)
      } catch (e: any) {
        if (cancelled) return
        setError(e?.message || "Failed to load questionnaires")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (open) load()
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
    } else {
      console.error("❌ Failed to copy link")
    }
  }

  if (!coupon) return null

  const manualFull = buildLink({
    base: questionnaireDomain,
    path: "",
    qs,
    fallbackPromo: coupon.code,
    fallbackSource: "coupon",
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Links for Coupon: {coupon.code}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Promo link */}
          <div>
            <p className="text-sm font-medium mb-2">Manual Preview</p>
            <div className="flex items-center gap-2">
              <Input readOnly value={`${qs}`} className="bg-muted" />
              <Button variant="secondary" onClick={() => copy(manualFull)}>
                {copiedLink === manualFull ? "Copied" : "Copy Link"}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Dynamic Questionnaires */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Questionnaires</p>
              {loading && <span className="text-xs text-muted-foreground">Loading…</span>}
            </div>

            {error && (
              <div className="rounded-md border p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {!loading && !error && templates.length === 0 && (
              <div className="rounded-md border p-3 text-sm text-muted-foreground">
                No questionnaires found.
              </div>
            )}

            {!loading && !error && templates.length > 0 && (
              <div className="rounded-md border divide-y">
                {templates.map((t) => {
                  const path = inferFrontendPath(t)
                  const full = buildLink({
                    base: questionnaireDomain,
                    path,
                    qs,
                    fallbackPromo: coupon.code,
                    fallbackSource: "coupon",
                  })
                  return (
                    <div key={t.id} className="flex items-center justify-between p-3">
                      <div className="min-w-0">
                        <div className="font-medium">{t.name}</div>
                        {/* <div className="text-xs text-muted-foreground truncate">
                          {t.questionnaire_type}
                        </div> */}
                      </div>
                      <Button variant="outline" onClick={() => copy(full)}>
                        {copiedLink === full ? "Copied" : "Copy Link"}
                      </Button>
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
