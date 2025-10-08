import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useClients } from "@/hooks/useClients";

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

// Static list of questionnaires
const QUESTIONNAIRES = [
  { label: "NAD+ (3 Options)", path: "/questionnaires/nad-plus" },
  { label: "Sermorelin", path: "/questionnaires/sermorelin" },
  { label: "Glutathione (Nasal Spray & Injections)", path: "/questionnaires/glutathione" },
  { label: "GLP-1 Weight Loss", path: "/questionnaires/glp1-weight-loss" },
  { label: "ED", path: "/questionnaires/ed" },
]

// --- helpers (match affiliate behavior) ---
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

  // start with existing query string if provided
  const params = parseQueryParams(qs)

  // ensure required tracking params exist (don’t double-add if already present)
  if (!params.has("promo") && fallbackPromo) params.set("promo", fallbackPromo)
  if (!params.has("promo-source")) params.set("promo-source", fallbackSource)

  // assign back to URL
  // Clear any existing search first to avoid duplicates
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

export default function CouponLinksModal({ open, onOpenChange, coupon }: Props) {
  // 🔹 fetch questionnaire domain from client
  const { currentClient } = useClients()
  const questionnaireDomain = ensureHttpsBase(currentClient?.questionnaire_url)

  // 🔹 promo query string (keep your original logic, but we’ll feed it through URLSearchParams)
  const qs = useMemo(() => {
    if (!coupon) return ""
    return coupon.promo_link || `?promo=${encodeURIComponent(coupon.code)}&promo-source=coupon`
  }, [coupon])

  // 🔹 track copied state
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

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

  // Manual preview (base + qs, no specific path)
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
              {/* Keep your input showing only the query string (unchanged UX) */}
              <Input readOnly value={`${qs}`} className="bg-muted" />
              <Button variant="secondary" onClick={() => copy(manualFull)}>
                {copiedLink === manualFull ? "Copied" : "Copy Link"}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Questionnaires */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Questionnaires</p>
            <div className="rounded-md border divide-y">
              {QUESTIONNAIRES.map((q) => {
                const full = buildLink({
                  base: questionnaireDomain,
                  path: q.path,
                  qs,
                  fallbackPromo: coupon.code,
                  fallbackSource: "coupon",
                })
                return (
                  <div key={q.path} className="flex items-center justify-between p-3">
                    <span>{q.label}</span>
                    <Button variant="outline" onClick={() => copy(full)}>
                      {copiedLink === full ? "Copied" : "Copy Link"}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
