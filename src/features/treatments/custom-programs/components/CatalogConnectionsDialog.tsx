import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CatalogTab } from "@/features/treatments/custom-programs/hooks/useCustomProgramsPage";
import type { CustomProgram } from "@/features/treatments/types";

interface CatalogConnectionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: CustomProgram | null;
  activeTab: CatalogTab;
  onTabChange: (tab: CatalogTab) => void;
}

const CATALOG_TABS: CatalogTab[] = ["medicine", "checkout", "labs", "supplies", "hub"];

function MedicineTab({ program }: { program: CustomProgram }) {
  return (
    <div className="space-y-3">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Connected Products</span>
      {program.checkoutOptions.length > 0 ? (
        <div className="space-y-2">
          {program.checkoutOptions.map((option) => (
            <div key={option.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5">
              <div>
                <div className="text-xs font-semibold text-slate-800">{option.productName}</div>
                <div className="mt-0.5 font-mono text-[10px] text-slate-400">{option.dose} · {option.regimen}</div>
              </div>
              <div className="text-xs font-bold text-blue-600">${option.price}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs italic text-slate-500">No direct medicine products connected to this program stage yet.</p>
      )}
    </div>
  );
}

function CheckoutTab({ program, onClose }: { program: CustomProgram; onClose: () => void }) {
  return (
    <div className="space-y-3">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Checkout Questionnaire Mapping</span>
      <div className="space-y-2 text-xs text-slate-600">
        <p>
          This flow is linked to <strong className="text-slate-900">{program.checkoutOptions.length} products</strong> in checkout.
        </p>
        <p>Users completing eligibility screening are routed to these products automatically upon matching recommendation criteria.</p>
        <Link to={`/dashboard/treatments/custom-programs/${program.id}/builder`} onClick={onClose} className="mt-1 inline-flex font-semibold text-blue-600 hover:underline">
          Manage checkout mappings in builder &rarr;
        </Link>
      </div>
    </div>
  );
}

function LabsTab({ program }: { program: CustomProgram }) {
  const trtLabs = program.visitType === "mensWellness" || program.slug.includes("trt");
  const glpLabs = program.slug.includes("glp");
  return (
    <div className="space-y-3">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Clinical Labs</span>
      {trtLabs && (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex justify-between text-xs"><span className="font-semibold text-slate-800">Complete Blood Count (CBC)</span><span className="font-mono font-semibold text-slate-500">LabCorp / Quest</span></div>
          <div className="flex justify-between text-xs"><span className="font-semibold text-slate-800">Total Testosterone (LC-MS/MS)</span><span className="font-mono font-semibold text-slate-500">LabCorp / Quest</span></div>
        </div>
      )}
      {glpLabs && (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex justify-between text-xs"><span className="font-semibold text-slate-800">Basic Metabolic Panel (BMP)</span><span className="font-mono font-semibold text-slate-500">LabCorp</span></div>
          <div className="flex justify-between text-xs"><span className="font-semibold text-slate-800">HbA1c test</span><span className="font-mono font-semibold text-slate-500">LabCorp</span></div>
        </div>
      )}
      {!trtLabs && !glpLabs && <p className="text-xs italic text-slate-500">No mandatory clinical lab testing connected to this program.</p>}
    </div>
  );
}

function SuppliesTab({ program }: { program: CustomProgram }) {
  const hasSupplies = program.slug.includes("glp") || program.slug.includes("trt");
  return (
    <div className="space-y-3">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Fulfillment Supplies</span>
      {hasSupplies ? (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
          <div>
            <div className="font-semibold text-slate-800">Syringe & Alcohol swab kit</div>
            <div className="mt-0.5 font-mono text-[10px] text-slate-400">10x insulin syringes, 20x alcohol pads</div>
          </div>
          <span className="font-bold text-slate-600">Included</span>
        </div>
      ) : (
        <p className="text-xs italic text-slate-500">No physical supply kits connected to this program.</p>
      )}
    </div>
  );
}

function HubTab({ program }: { program: CustomProgram }) {
  const rows = [
    ["Onboarding Display Name:", program.onboardingName || program.name],
    ["Target Audience:", program.audience.toUpperCase()],
    ["Age Gate Restrictions:", `${program.minAge}+`],
    ["Routing Key:", `/${program.slug}`],
  ];
  return (
    <div className="space-y-3">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient Hub Settings</span>
      <div className="space-y-2 text-xs text-slate-600">
        {rows.map(([label, value], index) => (
          <div key={label} className={cn("flex justify-between py-1", index < rows.length - 1 && "border-b border-slate-100")}>
            <span>{label}</span>
            <strong className="font-mono text-slate-800">{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CatalogConnectionsDialog({ open, onOpenChange, program, activeTab, onTabChange }: CatalogConnectionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[16px] font-bold text-slate-900">Catalog Connections: {program?.name}</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Manage product, checkout, labs, and supply assignments for the {program?.visitType || "universal"} flow.
          </DialogDescription>
        </DialogHeader>

        {program && (
          <div className="mt-2 space-y-4">
            <div className="flex border-b border-slate-100 pb-px">
              {CATALOG_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className={cn(
                    "-mb-px border-b-2 px-3 pb-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                    activeTab === tab ? "border-blue-600 font-bold text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                  data-testid={`catalog-tab-${tab}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="min-h-[180px] py-2">
              {activeTab === "medicine" && <MedicineTab program={program} />}
              {activeTab === "checkout" && <CheckoutTab program={program} onClose={() => onOpenChange(false)} />}
              {activeTab === "labs" && <LabsTab program={program} />}
              {activeTab === "supplies" && <SuppliesTab program={program} />}
              {activeTab === "hub" && <HubTab program={program} />}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
