import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useClients } from "@/hooks/useClients";

type Affiliate = {
  id: string;
  name: string;
  slug: string;
  referral_link: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affiliate: Affiliate | null;
};

const QUESTIONNAIRES = [
  { label: "Weight Loss", path: "/questionnaires/weight-loss" },
  { label: "Hair Growth", path: "/questionnaires/hair-growth" },
  { label: "ED", path: "/questionnaires/ed" },
];

export default function AffiliateLinksModal({ open, onOpenChange, affiliate }: Props) {
  if (!affiliate) return null;

  const { clients } = useClients();
  const client = clients[0];
  const questionnaireDomain = client?.questionnaire_url || "https://my.welliemd.com";

  // 🔹 Track copied state
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(text);
      setTimeout(() => setCopiedLink(null), 2000); // reset after 2 sec
    } catch {
      console.error("Failed to copy link");
    }
  };

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
              <Button
                variant="secondary"
                onClick={() => copy(affiliate.referral_link)}
              >
                {copiedLink === affiliate.referral_link ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          {/* Questionnaires */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Questionnaires</p>
            <div className="rounded-md border divide-y">
              {QUESTIONNAIRES.map((q) => {
                const full = `${questionnaireDomain}${q.path}?referral-campaign=${affiliate.slug}&referral-source=affiliate`;
                return (
                  <div key={q.path} className="flex items-center justify-between p-3">
                    <span>{q.label}</span>
                    <Button
                      variant="outline"
                      onClick={() => copy(full)}
                    >
                      {copiedLink === full ? "Copied" : "Copy Link"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
