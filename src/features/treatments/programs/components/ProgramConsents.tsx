import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ConsentItem {
  id: string;
  name: string;
  scope: string;
}

interface ProgramConsentsProps {
  consents: ConsentItem[];
  onAddConsent: () => void;
}

export function ProgramConsents({ consents, onAddConsent }: ProgramConsentsProps) {
  const universalConsents = consents.filter((c) => c.scope === "global");
  const specificConsents = consents.filter((c) => c.scope !== "global");

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden mb-6">
      <div className="p-6 border-b border-slate-100 flex items-start justify-between">
        <div>
          <h3 className="text-[15px] font-extrabold text-slate-900">Patient Consents</h3>
          <p className="text-[11px] text-slate-400 mt-1 max-w-2xl leading-relaxed font-medium">
            Legal consents the patient must agree to before taking this eligibility. Universal consents are automatically attached to every eligibility. Treatment-specific consents are added per eligibility based on what's being prescribed.
          </p>
        </div>
        <Button
          onClick={onAddConsent}
          size="sm"
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-[12px] h-9 px-4 rounded-lg shadow-sm"
        >
          + Add Consent
        </Button>
      </div>

      <div className="p-6 space-y-6">
        {/* Universal */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-extrabold text-slate-500 tracking-widest uppercase">Universal</span>
            <span className="text-[9px] font-bold text-slate-300 tracking-widest uppercase">Always Attached</span>
          </div>

          <div className="space-y-2">
            {universalConsents.map((uc) => (
              <div
                key={uc.id}
                className="flex items-start gap-3 bg-[#faf7ff] border border-[#f3e8ff] rounded-xl p-4 transition-colors"
              >
                <div className="mt-0.5">
                  <Shield className="h-5 w-5 text-[#a855f7]" />
                </div>
                <div>
                  <h4 className="text-[13px] font-extrabold text-slate-900">{uc.name}</h4>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    Universal — applies to every eligibility
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Treatment Specific */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-extrabold text-slate-500 tracking-widest uppercase">Treatment-Specific</span>
            <span className="text-[9px] font-bold text-slate-300 tracking-widest uppercase">{specificConsents.length} Attached</span>
          </div>

          {specificConsents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-[#fafafa] p-6 text-center">
              <p className="text-[11px] text-slate-400 font-medium">
                No treatment-specific consents attached. Universal consents above always apply. Click <strong className="font-bold">+ Add Consent</strong> to attach one from the library.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {specificConsents.map((sc) => (
                <div
                  key={sc.id}
                  className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4 transition-colors"
                >
                  <div className="mt-0.5">
                    <Shield className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-extrabold text-slate-900">{sc.name}</h4>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      Treatment-specific consent
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
