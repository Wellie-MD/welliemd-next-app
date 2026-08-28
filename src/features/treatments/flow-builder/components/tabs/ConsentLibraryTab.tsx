import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";
import type { ConsentForm } from "@/features/treatments/types";

interface ConsentLibraryTabProps {
  consents: ConsentForm[];
  searchQuery?: string;
  onAddItem: (item: {
    kind: "consent";
    title: string;
    subtitle: string;
    sourceId?: string;
  }) => void;
  flowItems?: Array<{ kind: string; title: string }>;
}

export function ConsentLibraryTab({
  consents,
  searchQuery = "",
  onAddItem,
  flowItems = [],
}: ConsentLibraryTabProps) {
  const isConsentAdded = (consentName: string) => {
    return flowItems.some((fi) => fi.kind === "consent" && fi.title === consentName);
  };
  const query = searchQuery.trim().toLowerCase();
  const filteredConsents = consents.filter((consent) => {
    const scopeLabel = consent.scope === "global" ? "universal" : "treatment-specific";
    return (
      !query ||
      consent.name.toLowerCase().includes(query) ||
      scopeLabel.includes(query)
    );
  });

  return (
    <div className="space-y-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
        Available consents
      </div>

      <div className="space-y-2">
        {filteredConsents.map((consent) => {
          const added = isConsentAdded(consent.name);

          return (
            <div
              key={consent.id}
              className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm flex justify-between items-center"
            >
              <div>
                <div className="text-xs font-semibold text-slate-700 leading-tight">
                  {consent.name}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                  {consent.scope === "global" ? "Universal" : "Treatment-specific"}
                </div>
              </div>

              {added ? (
                <span className="shrink-0 h-7 w-7 inline-flex items-center justify-center text-emerald-600 rounded-md border border-emerald-100 bg-emerald-50">
                  <Check className="h-4 w-4" />
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 h-7 w-7 text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() =>
                    onAddItem({
                      kind: "consent",
                      title: consent.name,
                      subtitle: "Consent form capture.",
                      sourceId: consent.id,
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}
        {query && !filteredConsents.length && (
          <p className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-xs text-slate-500">
            No consents matched your search.
          </p>
        )}
      </div>
    </div>
  );
}
