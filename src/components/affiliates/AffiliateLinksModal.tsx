import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useClients } from "@/hooks/useClients"
import { ExternalLink } from "lucide-react"
import { templateApi, type QuestionnaireTemplate } from "@/api/questionnaires"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const USE_VISIT_ROUTES = true

// ---------- helpers ----------
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
}: {
  base: string
  path?: string
  qs?: string | null | undefined
}) {
  try {
    const processedBase = ensureHttpsBase(base)
    if (!processedBase) {
      console.warn("[AffiliateLinksModal] buildLink: Missing base URL", { base, path, qs })
      return "" // Return empty if no valid base URL
    }
    const baseWithSlash = processedBase + "/"
    const cleanPath = (path || "").replace(/^\/+/, "")
    const u = new URL(cleanPath, baseWithSlash)
    const params = parseQueryParams(qs)
    u.search = ""
    params.forEach((v, k) => u.searchParams.set(k, v))
    const finalUrl = u.toString()
    console.log("[AffiliateLinksModal] buildLink: Generated link", { base, processedBase, path, cleanPath, qs, finalUrl })
    return finalUrl
  } catch (error) {
    console.error("[AffiliateLinksModal] buildLink: Error building link", { base, path, qs, error })
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

// ---------- visit path: slug when present, else visit type (so multiple questionnaires with same visit type get unique URLs) ----------
function getRouteKey(t: QuestionnaireTemplate): string | null {
  if (t.slug && typeof t.slug === 'string' && t.slug.trim()) return t.slug.trim()
  if (t.beluga_visit_type && typeof t.beluga_visit_type === 'string' && t.beluga_visit_type.trim()) {
    return t.beluga_visit_type.trim()
  }
  return null
}

function getVisitType(t: QuestionnaireTemplate): string | null {
  if (t.beluga_visit_type && typeof t.beluga_visit_type === 'string' && t.beluga_visit_type.trim()) {
    return t.beluga_visit_type.trim()
  }
  return null
}

function visitTypeToPathSegment(visitType: string): string {
  return visitType
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
  affiliates?: Affiliate[]
}

// Helper function to get questionnaire domain with fallbacks
function getQuestionnaireDomain(currentClient: any): string {
  // Primary: Use the resolved intake/questionnaire URL if available
  if (currentClient?.resolved_questionnaire_url) {
    return ensureHttpsBase(currentClient.resolved_questionnaire_url)
  }

  // Fallback: Use legacy questionnaire_url
  if (currentClient?.questionnaire_url) {
    return ensureHttpsBase(currentClient.questionnaire_url)
  }

  // Fallback 1: Try to construct from admin_panel_domain
  if (currentClient?.admin_panel_domain) {
    try {
      const adminUrl = new URL(currentClient.admin_panel_domain)
      // Replace admin subdomain with questionnaire subdomain if pattern exists
      // e.g., admin.client.com -> client.com or questionnaire.client.com
      const hostname = adminUrl.hostname
      const parts = hostname.split('.')
      
      // Try common patterns
      const patterns = [
        hostname.replace(/^admin\./, ''), // Remove 'admin.' prefix
        hostname.replace(/^admin-/, ''), // Remove 'admin-' prefix
        hostname.replace(/admin/, 'questionnaire'), // Replace 'admin' with 'questionnaire'
      ]
      
      for (const pattern of patterns) {
        if (pattern !== hostname) {
          const fallbackUrl = `${adminUrl.protocol}//${pattern}${adminUrl.port ? `:${adminUrl.port}` : ''}`
          console.log("[AffiliateLinksModal] Using fallback URL from admin_panel_domain:", fallbackUrl)
          return ensureHttpsBase(fallbackUrl)
        }
      }
      
      // If no pattern match, use the same domain
      const sameDomainUrl = `${adminUrl.protocol}//${hostname}${adminUrl.port ? `:${adminUrl.port}` : ''}`
      console.log("[AffiliateLinksModal] Using same domain as fallback:", sameDomainUrl)
      return ensureHttpsBase(sameDomainUrl)
    } catch (e) {
      console.warn("[AffiliateLinksModal] Failed to parse admin_panel_domain for fallback:", e)
    }
  }

  // Fallback 2: Use window.location.origin as last resort
  if (typeof window !== 'undefined') {
    console.log("[AffiliateLinksModal] Using window.location.origin as last resort fallback")
    return ensureHttpsBase(window.location.origin)
  }

  return ""
}

export default function AffiliateLinksModal({ open, onOpenChange, affiliate, affiliates = [] }: Props) {
  const { currentClient } = useClients()
  const questionnaireDomain = useMemo(() => {
    const domain = getQuestionnaireDomain(currentClient)
    if (!domain && currentClient) {
      console.warn("[AffiliateLinksModal] No questionnaire domain found. Client info:", {
        id: currentClient.id,
        name: currentClient.name,
        resolved_questionnaire_url: currentClient.resolved_questionnaire_url,
        questionnaire_url: currentClient.questionnaire_url,
        admin_panel_domain: currentClient.admin_panel_domain,
      })
    }
    return domain
  }, [currentClient])

  // Debug logging for client and questionnaire URL
  useEffect(() => {
    if (open) {
      console.log("[AffiliateLinksModal] Modal opened - Client Debug Info:", {
        currentClient: currentClient ? {
          id: currentClient.id,
          name: currentClient.name,
          admin_panel_domain: currentClient.admin_panel_domain,
          resolved_questionnaire_url: currentClient.resolved_questionnaire_url,
          questionnaire_url: currentClient.questionnaire_url,
        } : null,
        questionnaireDomain,
        windowLocationOrigin: window.location.origin,
        hasQuestionnaireUrl: !!(currentClient?.resolved_questionnaire_url || currentClient?.questionnaire_url),
      })
    }
  }, [open, currentClient, questionnaireDomain])

  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(affiliate)

  useEffect(() => {
    if (affiliate && affiliate.id) {
      setSelectedAffiliate(affiliate)
    } else if (affiliates.length > 0 && (!selectedAffiliate || !selectedAffiliate.id)) {
      setSelectedAffiliate(affiliates[0])
    }
  }, [affiliate, affiliates, open])

  const qs = useMemo(() => {
    if (!selectedAffiliate) return ""
    const p = new URLSearchParams()
    p.set("referral-campaign", selectedAffiliate.slug)
    p.set("referral-source", "affiliate")
    return `?${p.toString()}`
  }, [selectedAffiliate])

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
        const data = await templateApi.listTemplates()
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
    return templates.map((t) => {
      const vt = getVisitType(t)
      // Use slug when present so multiple questionnaires with same visit type get unique URLs (e.g. /visit/glutathione, /visit/nad)
      const routeKey = getRouteKey(t)
      const visitPath = routeKey ? `/visit/${visitTypeToPathSegment(routeKey)}` : null
      const legacyPath = inferFrontendPath(t)
      return { t, vt, visitPath, legacyPath }
    })
    // Show ALL published templates, not just ones with visit type
  }, [templates])

  // Debug logging for generated links
  useEffect(() => {
    if (open && items.length > 0 && selectedAffiliate) {
      const generatedLinks = items.map(({ t, visitPath, legacyPath }) => {
        const path = USE_VISIT_ROUTES && visitPath ? visitPath : legacyPath
        const full = buildLink({ base: questionnaireDomain, path, qs })
        return { templateId: t.id, templateName: t.name, path, fullLink: full }
      })
      console.log("[AffiliateLinksModal] Generated links for all questionnaires:", {
        questionnaireDomain,
        hasQuestionnaireDomain: !!questionnaireDomain,
        selectedAffiliate: selectedAffiliate.name,
        queryString: qs,
        links: generatedLinks,
        emptyLinks: generatedLinks.filter(l => !l.fullLink),
      })
    }
  }, [open, items, questionnaireDomain, qs, selectedAffiliate])

  const referralLink = selectedAffiliate?.referral_link || ""

  // Check if we have a valid questionnaire domain
  const hasQuestionnaireDomain = !!questionnaireDomain
  const hasCurrentClient = !!currentClient
  const missingQuestionnaireUrl =
    hasCurrentClient &&
    !(currentClient?.resolved_questionnaire_url || currentClient?.questionnaire_url)

  // Check if any links are empty
  const emptyLinksCount = useMemo(() => {
    if (!open || items.length === 0) return 0
    return items.filter(({ t, visitPath, legacyPath }) => {
      const path = USE_VISIT_ROUTES && visitPath ? visitPath : legacyPath
      const full = buildLink({ base: questionnaireDomain, path, qs })
      return !full
    }).length
  }, [open, items, questionnaireDomain, qs])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Links for {selectedAffiliate?.name || "Influencers"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning: Missing questionnaire URL */}
          {missingQuestionnaireUrl && (
            <div className="rounded-md border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm">
              <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                ⚠️ Questionnaire URL Not Configured
              </div>
              <div className="text-yellow-700 dark:text-yellow-300">
                The questionnaire URL is missing for this client. Links are being generated using a fallback method.
                Please configure the questionnaire URL in client settings to ensure links work correctly.
              </div>
            </div>
          )}

          {/* Warning: No client matched */}
          {!hasCurrentClient && (
            <div className="rounded-md border border-orange-500 bg-orange-50 dark:bg-orange-900/20 p-3 text-sm">
              <div className="font-medium text-orange-800 dark:text-orange-200 mb-1">
                ⚠️ Client Not Detected
              </div>
              <div className="text-orange-700 dark:text-orange-300">
                Unable to match the current domain to a client. This may cause issues with link generation.
                Please check that the admin_panel_domain is correctly configured in the database.
              </div>
            </div>
          )}

          {/* Warning: Empty links detected */}
          {!loading && !error && items.length > 0 && emptyLinksCount > 0 && (
            <div className="rounded-md border border-red-500 bg-red-50 dark:bg-red-900/20 p-3 text-sm">
              <div className="font-medium text-red-800 dark:text-red-200 mb-1">
                ❌ Unable to Generate {emptyLinksCount} Link{emptyLinksCount > 1 ? 's' : ''}
              </div>
              <div className="text-red-700 dark:text-red-300">
                {emptyLinksCount === items.length ? (
                  <>
                    No links could be generated because the questionnaire URL is missing or invalid.
                    {hasCurrentClient ? (
                      <> Please configure the questionnaire URL for client "{currentClient.name}" in the settings.</>
                    ) : (
                      <> Please ensure the client is properly configured in the database.</>
                    )}
                  </>
                ) : (
                  <>
                    Some links could not be generated. This usually means the questionnaire URL is missing or invalid.
                    Please check the client configuration.
                  </>
                )}
              </div>
            </div>
          )}
          {/* Affiliate Selector */}
          {affiliates.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Select Influencer</p>
              <Select
                value={selectedAffiliate?.id}
                onValueChange={(val) => {
                  const found = affiliates.find(a => a.id === val)
                  if (found) setSelectedAffiliate(found)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an influencer" />
                </SelectTrigger>
                <SelectContent>
                  {affiliates.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
                  const isEmpty = !full

                  return (
                    <div key={t.id} className={`flex items-center justify-between p-3 ${isEmpty ? 'opacity-60' : ''}`}>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{t.name}</div>
                        {isEmpty && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Link unavailable - questionnaire URL missing
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => copy(full)} 
                          disabled={isEmpty}
                          title={isEmpty ? "Link unavailable - questionnaire URL is missing" : "Copy link to clipboard"}
                        >
                          {copiedLink === full ? "Copied" : "Copy Link"}
                        </Button>
                        {!isEmpty && (
                          <a
                            href={full}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open in new tab"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        {isEmpty && (
                          <div className="inline-flex h-8 w-8 items-center justify-center rounded-md opacity-50 cursor-not-allowed" title="Link unavailable">
                            <ExternalLink className="h-4 w-4" />
                          </div>
                        )}
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
