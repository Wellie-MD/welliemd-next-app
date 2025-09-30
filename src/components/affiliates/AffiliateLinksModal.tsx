import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

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

const QUESTIONNAIRES = [
  { label: "Weight Loss", path: "/questionnaires/weight-loss" },
  { label: "Hair Growth", path: "/questionnaires/hair-growth" },
  { label: "ED", path: "/questionnaires/ed" },
]

export default function AffiliateLinksModal({ open, onOpenChange, affiliate }: Props) {
  if (!affiliate) return null

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert("Link copied to clipboard")
    } catch {
      alert("Failed to copy link")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Links for {affiliate.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Referral Link</p>
            <div className="flex items-center gap-2">
              <Input readOnly value={affiliate.referral_link} />
              <Button variant="secondary" onClick={() => copy(affiliate.referral_link)}>
                Copy
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Questionnaires</p>
            <div className="rounded-md border divide-y">
              {QUESTIONNAIRES.map((q) => {
                const full = `${q.path}${affiliate.referral_link}`
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
