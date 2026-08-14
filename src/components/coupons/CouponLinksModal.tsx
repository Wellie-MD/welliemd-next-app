import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useClients } from "@/hooks/useClients"
import { templateApi, type QuestionnaireTemplate } from "@/api/questionnaires"
import { treatmentsApi } from "@/features/treatments/api/treatmentsApi"
import type { Program } from "@/features/treatments/types"
import { ExternalLink } from "lucide-react"   
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const USE_VISIT_ROUTES = true

function ensureHttpsBase(urlLike?: string): string {
  if (!urlLike) return ""
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
  const processedBase = ensureHttpsBase(base)
  if (!processedBase) return "" // Return empty if no valid base URL
  const baseWithSlash = processedBase + "/"
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

// Route key: slug when present, else visit type (so multiple questionnaires with same visit type get unique URLs)
function getRouteKey(t: QuestionnaireTemplate): string | null {
  const anyT = t as any
  if (anyT.slug && typeof anyT.slug === 'string' && anyT.slug.trim()) return anyT.slug.trim()
  if (anyT.beluga_visit_type && typeof anyT.beluga_visit_type === 'string' && anyT.beluga_visit_type.trim()) {
    return anyT.beluga_visit_type.trim()
  }
  return null
}

function getVisitType(t: QuestionnaireTemplate): string | null {
  const anyT = t as any
  if (anyT.beluga_visit_type && typeof anyT.beluga_visit_type === 'string' && anyT.beluga_visit_type.trim()) {
    return anyT.beluga_visit_type.trim()
  }
  return null
}

function visitTypeToPathSegment(visitType: string): string {
  return visitType
}

type Coupon = {
  id: string
  code: string
  name?: string
  promo_link?: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  coupon: Coupon | null
  coupons?: Coupon[]  // Optional list for coupon selector
}

export default function CouponLinksModal({ open, onOpenChange, coupon, coupons = [] }: Props) {
  const { currentClient } = useClients()
  const questionnaireDomain = ensureHttpsBase(
    currentClient?.resolved_questionnaire_url || currentClient?.questionnaire_url
  )

  // Selected coupon (from prop or user selection)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(coupon)

  // Update selected coupon when prop changes
  useEffect(() => {
    // If we have a coupon with a code, use it
    if (coupon && coupon.code) {
      setSelectedCoupon(coupon)
    } 
    // If we have a list of coupons but no selected coupon (or empty one), pick the first
    else if (coupons.length > 0 && (!selectedCoupon || !selectedCoupon.code)) {
      setSelectedCoupon(coupons[0])
    }
  }, [coupon, coupons, open])

  // Build query string from selected coupon
  const qs = useMemo(() => {
    if (!selectedCoupon || !selectedCoupon.code) return ""
    return selectedCoupon.promo_link || `?promo=${encodeURIComponent(selectedCoupon.code)}&promo-source=coupon`
  }, [selectedCoupon])

  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<QuestionnaireTemplate[]>([])
  const [programs, setPrograms] = useState<Program[]>([])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const controller = new AbortController()
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const [templateData, programData] = await Promise.all([
          templateApi.listTemplates({ standaloneOnly: true }),
          treatmentsApi.listPrograms(),
        ])
        const tResults = Array.isArray(templateData) ? templateData : (templateData as any)?.results ?? []
        const publishedTemplates = tResults.filter((t: QuestionnaireTemplate) => t.is_published && t.questionnaire_type === 'onboarding')
        const publishedProgs = (programData || []).filter((p: Program) => p.status === 'published')

        if (!cancelled) {
          setTemplates(publishedTemplates)
          setPrograms(publishedProgs)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load programs and questionnaires")
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
    } else {
      console.error("❌ Failed to copy link")
    }
  }

  const promoDisabled = !selectedCoupon
  const manualFull = buildLink({
    base: questionnaireDomain,
    path: "",
    qs: promoDisabled ? "" : qs,
    fallbackPromo: selectedCoupon?.code ?? "",
    fallbackSource: "coupon",
  })

  const programItems = useMemo(() => {
    return programs.map((p) => {
      const slugOrVisit = p.slug?.trim() || p.visitType?.trim() || p.id
      const visitPath = `/visit/${slugOrVisit}`
      return { p, visitPath }
    })
  }, [programs])

  const items = useMemo(() => {
    return templates.map((t) => {
      const vt = getVisitType(t)
      // Use slug when present so multiple questionnaires with same visit type get unique URLs
      const routeKey = getRouteKey(t)
      const visitPath = routeKey ? `/visit/${visitTypeToPathSegment(routeKey)}` : null
      const legacyPath = inferFrontendPath(t)
      return { t, vt, visitPath, legacyPath }
    })
    // Show ALL published templates, not just ones with visit type
  }, [templates])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Links for Coupon{selectedCoupon ? `: ${selectedCoupon.code}` : ""}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Coupon Selector (only if multiple coupons provided) */}
          {coupons.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Select Coupon</p>
              <Select
                value={selectedCoupon?.id}
                onValueChange={(val) => {
                  const found = coupons.find(c => c.id === val)
                  if (found) setSelectedCoupon(found)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a coupon" />
                </SelectTrigger>
                <SelectContent>
                  {coupons.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name || c.code} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Treatment Programs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Treatment Programs</p>
              {loading && <span className="text-xs text-muted-foreground">Loading…</span>}
            </div>

            {error && (
              <div className="rounded-md border p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {!loading && !error && programItems.length === 0 && (
              <div className="rounded-md border p-3 text-sm text-muted-foreground">
                No programs found.
              </div>
            )}

            {!loading && !error && programItems.length > 0 && (
              <div className="rounded-md border divide-y">
                {programItems.map(({ p, visitPath }) => {
                  const full = buildLink({
                    base: questionnaireDomain,
                    path: visitPath,
                    qs: promoDisabled ? "" : qs,
                    fallbackPromo: selectedCoupon?.code ?? "",
                    fallbackSource: "coupon",
                  })

                  return (
                    <div key={p.id} className="flex items-center justify-between p-3">
                      <div className="min-w-0">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.treatmentTypeName || p.treatmentTypeKey} · {p.stage === 'follow_up' ? 'Follow-up' : 'Intake'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => copy(full)}
                          disabled={promoDisabled}
                          title={promoDisabled ? "No coupon selected" : "Copy full URL"}
                        >
                          {copiedLink === full ? "Copied" : "Copy Link"}
                        </Button>
                        <a
                          href={full}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-disabled={promoDisabled}
                          onClick={e => { if (promoDisabled) e.preventDefault() }}
                          title="Open in new tab"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
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

          <Separator />

          {/* Questionnaires */}
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

            {!loading && !error && items.length === 0 && (
              <div className="rounded-md border p-3 text-sm text-muted-foreground">
                No questionnaires found.
              </div>
            )}

            {!loading && !error && items.length > 0 && (
              <div className="rounded-md border divide-y">
                {items.map(({ t, vt, visitPath, legacyPath }) => {
                  const path = USE_VISIT_ROUTES && visitPath ? visitPath : legacyPath
                  const full = buildLink({
                    base: questionnaireDomain,
                    path,
                    qs: promoDisabled ? "" : qs,
                    fallbackPromo: selectedCoupon?.code ?? "",
                    fallbackSource: "coupon",
                  })

                  return (
                    <div key={t.id} className="flex items-center justify-between p-3">
                      <div className="min-w-0">
                        <div className="font-medium">{t.name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => copy(full)}
                          disabled={promoDisabled}
                          title={promoDisabled ? "No coupon selected" : "Copy full URL"}
                        >
                          {copiedLink === full ? "Copied" : "Copy Link"}
                        </Button>
                        <a
                          href={full}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-disabled={promoDisabled}
                          onClick={e => { if (promoDisabled) e.preventDefault() }}
                          title="Open in new tab"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
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
