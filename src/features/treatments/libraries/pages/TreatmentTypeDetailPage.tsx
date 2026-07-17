import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/features/treatments/common/components";
import {
  useConsents,
  usePrograms,
  useSections,
  useTreatmentTypes,
} from "@/features/treatments/libraries/hooks/useTreatmentLibraries";
import { productApi } from "@/api/products";
import { TreatmentTypeModal } from "@/features/treatments/libraries/treatment-types/components/TreatmentTypeModal";
import { TreatmentTypeProductDialog } from "@/features/treatments/libraries/treatment-types/components/TreatmentTypeProductDialog";
import { VisitTypeProductsTable } from "@/features/treatments/libraries/treatment-types/components/VisitTypeProductsTable";

const LIBRARY_LINKS = {
  eligibility: "/dashboard/treatments/programs",
  sections: "/dashboard/treatments/sections",
  consents: "/dashboard/treatments/consents",
  products: "/dashboard/products",
};

export default function TreatmentTypeDetailPage() {
  const { treatmentTypeKey = "" } = useParams();
  const navigate = useNavigate();
  const { data: treatmentTypes = [] } = useTreatmentTypes();
  const { data: programs = [] } = usePrograms();
  const { data: consents = [] } = useConsents();
  const { data: sections = [] } = useSections();
  const treatmentType = treatmentTypes.find((item) => item.key === treatmentTypeKey) ?? treatmentTypes[0];
  const { data: allProducts = [], isLoading: productsLoading, isError: productsError, refetch: refetchProducts } = useQuery({
    queryKey: ["products", "treatment-type", treatmentType?.id],
    queryFn: () => productApi.listProducts({ treatment_type: treatmentType?.id, page_size: 250 }),
    enabled: Boolean(treatmentType?.id),
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

  const intakeVisitType = treatmentType?.intakeVisitType ?? "";
  const followupVisitType = treatmentType?.followupVisitType;

  const { intakeProgram, followupProgram, products, scopedSections, scopedConsents } = useMemo(() => {
    const own = programs.filter((program) => program.treatmentTypeKey === treatmentType?.key);
    const scopeKeys = new Set([treatmentType?.key, intakeVisitType].filter(Boolean));
    return {
      intakeProgram: own.find((program) => program.stage === "intake"),
      followupProgram: own.find((program) => program.stage === "follow_up"),
      products: allProducts.filter((product) => product.treatment_type_key === treatmentType?.key),
      scopedSections: sections.filter((section) => section.scope === "treatment" && section.visitTypeKeys.some((key) => scopeKeys.has(key))),
      scopedConsents: consents.filter(
        (consent) => consent.scope === "treatment" && consent.visitTypeKeys.some((key) => scopeKeys.has(key))
      ),
    };
  }, [programs, sections, consents, allProducts, treatmentType?.key, intakeVisitType]);

  const eligibilityModuleCount = (intakeProgram ? 1 : 0) + (followupProgram ? 1 : 0);

  if (!treatmentType) {
    return <div className="p-6">Treatment type not found.</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <Button asChild variant="outline" size="icon" className="h-9 w-9 shrink-0 text-slate-500">
            <Link to="/dashboard/treatments/treatment-types">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Visit Type</div>
            <h1 className="mt-1 font-mono text-2xl font-bold tracking-tight text-slate-900">{intakeVisitType}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <code className="rounded bg-slate-100 px-2 py-0.5 font-mono font-semibold text-slate-700">{intakeVisitType}</code>
              {followupVisitType ? (
                <span className="flex items-center gap-1.5">
                  <code className="rounded bg-slate-100 px-2 py-0.5 font-mono font-semibold text-slate-700">{followupVisitType}</code>
                  configured
                </span>
              ) : (
                <span className="italic text-slate-400">(no follow-up phase declared)</span>
              )}
              <StatusPill tone={treatmentType.isActive ? "green" : "slate"}>
                {treatmentType.isActive ? "Active" : "Inactive"}
              </StatusPill>
            </div>
          </div>
        </div>
        <Button variant="outline" className="text-slate-700" onClick={() => setIsEditModalOpen(true)} data-testid="edit-visit-type">
          Edit visit type
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Eligibility modules" value={eligibilityModuleCount} />
        <StatCard label="Products" value={products.length} />
        <StatCard label="Scoped sections" value={scopedSections.length} />
        <StatCard label="Scoped consents" value={scopedConsents.length} />
      </div>

      {/* Eligibility modules */}
      <Section
        title="Eligibility modules"
        subtitle="The clinical screening forms patients fill out within this visit type."
        action={<LibraryLink to={LIBRARY_LINKS.eligibility}>View in Eligibility library</LibraryLink>}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Onboarding</div>
            {intakeProgram ? (
              <ProgramRow name={intakeProgram.name} status={intakeProgram.status} to={`/dashboard/treatments/programs/${intakeProgram.id}`} />
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">No onboarding module created yet</p>
                <p className="text-xs text-slate-400">
                  Eligibility module would reference <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">{intakeVisitType}</code>
                </p>
                <Button size="sm" className="bg-[#2563eb] text-white hover:bg-blue-700" onClick={() => navigate(LIBRARY_LINKS.eligibility)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Create onboarding module
                </Button>
              </div>
            )}
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Follow-up</div>
            {followupProgram ? (
              <ProgramRow name={followupProgram.name} status={followupProgram.status} to={`/dashboard/treatments/programs/${followupProgram.id}`} />
            ) : followupVisitType ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">No follow-up module created yet</p>
                <Button size="sm" variant="outline" onClick={() => navigate(LIBRARY_LINKS.eligibility)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Create follow-up module
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">No follow-up phase declared for this visit type</p>
                <Button size="sm" variant="outline" onClick={() => setIsEditModalOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Declare follow-up identifier
                </Button>
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Products */}
      <Section
        title="Products"
        subtitle="Medications and offerings prescribed within this visit type. Routing config decides which product a patient gets matched to based on their answers."
        action={
          <Button size="sm" className="bg-[#2563eb] text-white hover:bg-blue-700" onClick={() => setIsProductDialogOpen(true)} data-testid="visit-type-add-product">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add product
          </Button>
        }
      >
        {productsLoading ? <p className="text-sm text-slate-500">Loading products…</p> : productsError ? <div className="space-y-2"><p className="text-sm text-red-600">Products could not be loaded.</p><Button size="sm" variant="outline" onClick={() => refetchProducts()}>Retry</Button></div> : <VisitTypeProductsTable products={products} onEditProduct={() => setIsProductDialogOpen(true)} />}
      </Section>

      {/* Scoped sections */}
      <Section
        title="Scoped sections"
        subtitle="Sections that only appear during this visit type's flow (in addition to any universal sections)."
        action={<LibraryLink to={LIBRARY_LINKS.sections}>View in Sections library</LibraryLink>}
      >
        {scopedSections.length === 0 ? <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-400">No sections scoped to this visit type.</div> : <div className="space-y-2">{scopedSections.map((section) => <div key={section.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"><span className="text-sm font-medium text-slate-700">{section.name}</span><span className="text-xs text-slate-500">{section.fieldCount} fields</span></div>)}</div>}
      </Section>

      {/* Scoped consents */}
      <Section
        title="Scoped consents"
        subtitle="Consents that only appear during this visit type's flow."
        action={<LibraryLink to={LIBRARY_LINKS.consents}>View in Consents library</LibraryLink>}
      >
        {scopedConsents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-400">
            No consents scoped to this visit type.
          </div>
        ) : (
          <div className="space-y-2">
            {scopedConsents.map((consent) => (
              <div key={consent.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <span className="text-sm font-medium text-slate-700">{consent.name}</span>
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">{intakeVisitType}</code>
              </div>
            ))}
          </div>
        )}
      </Section>

      <TreatmentTypeModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} treatmentTypeKey={treatmentType.key} />
      <TreatmentTypeProductDialog
        open={isProductDialogOpen}
        onOpenChange={setIsProductDialogOpen}
        treatmentTypeId={treatmentType.id}
        treatmentTypeName={treatmentType.name}
        onSaved={refetchProducts}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          <p className="mt-0.5 max-w-2xl text-xs text-slate-500">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function ProgramRow({ name, status, to }: { name: string; status: string; to: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-800">{name}</span>
        <StatusPill tone={status === "published" ? "green" : "yellow"}>{status}</StatusPill>
      </div>
      <Button asChild size="sm" variant="outline">
        <Link to={to}>Open</Link>
      </Button>
    </div>
  );
}

function LibraryLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-xs font-semibold text-[#2563eb] hover:underline">
      {children}
    </Link>
  );
}
