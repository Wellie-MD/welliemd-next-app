import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

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

// Static list exactly like your screenshot
const QUESTIONNAIRES = [
  { label: "NAD+ (3 Options)", path: "/questionnaires/nad-plus" },
  { label: "Sermorelin", path: "/questionnaires/sermorelin" },
  { label: "Glutathione (Nasal Spray & Injections)", path: "/questionnaires/glutathione" },
  { label: "GLP-1 Weight Loss", path: "/questionnaires/glp1-weight-loss" },
  { label: "ED", path: "/questionnaires/ed" },
]

export default function CouponLinksModal({ open, onOpenChange, coupon }: Props) {
  const qs = useMemo(() => {
    if (!coupon) return ""
    return coupon.promo_link || `?promo=${encodeURIComponent(coupon.code)}&promo-source=coupon`
  }, [coupon])

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // fallback
      const ta = document.createElement("textarea")
      ta.value = text
      document.body.appendChild(ta)
      ta.select(); document.execCommand("copy")
      document.body.removeChild(ta)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Links</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Manual Preview</p>
            <div className="flex items-center gap-2">
              <Input readOnly value={qs} className="bg-muted" />
              <Button variant="secondary" onClick={() => copy(qs)}>Copy Link</Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Questionnaires</p>
            <div className="rounded-md border divide-y">
              {QUESTIONNAIRES.map((q) => {
                const full = `${q.path}${qs}`
                return (
                  <div key={q.path} className="flex items-center justify-between p-3">
                    <span>{q.label}</span>
                    <Button variant="outline" onClick={() => copy(full)}>Copy Link</Button>
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
