import { FileText, GitBranch, LayoutGrid, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LibraryStatCard, TreatmentPageHeader } from "../components/common";
import { useContentLibraryStats } from "../hooks/useTreatmentLibraries";

const libraryCards = [
  {
    title: "Consent Forms Library",
    description: "Legal documents that are global or treatment-specific.",
    href: "/dashboard/treatments/consents",
    action: "Manage consents",
  },
  {
    title: "Common Sections",
    description: "Reusable patient data sections shared across custom forms.",
    href: "/dashboard/treatments/sections",
    action: "View sections",
  },
  {
    title: "Programs",
    description: "Treatment-specific intake and follow-up questionnaires.",
    href: "/dashboard/treatments/programs",
    action: "Manage programs",
  },
  {
    title: "Custom Programs",
    description: "Patient-facing flows composed from programs, sections, consents, and checkout.",
    href: "/dashboard/treatments/custom-programs",
    action: "View custom programs",
  },
];

export default function ContentLibrariesPage() {
  const { data: stats } = useContentLibraryStats();

  return (
    <div className="p-6">
      <TreatmentPageHeader
        title="Content Libraries"
        subtitle={
          <>
            Treatment-focused content management. <strong>Programs</strong> define canonical treatments.
            <strong> Custom Programs</strong> compose those treatments into client-customized intakes.
          </>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <LibraryStatCard label="Consent Forms" value={stats?.consentForms ?? 0} icon={<ShieldCheck className="h-5 w-5" />} tone="purple" />
        <LibraryStatCard label="Common Sections" value={stats?.commonSections ?? 0} icon={<LayoutGrid className="h-5 w-5" />} tone="teal" />
        <LibraryStatCard label="Programs" value={stats?.programs ?? 0} icon={<GitBranch className="h-5 w-5" />} tone="blue" />
        <LibraryStatCard label="Custom Programs" value={stats?.customPrograms ?? 0} icon={<FileText className="h-5 w-5" />} tone="indigo" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {libraryCards.map((card) => (
          <div key={card.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{card.description}</p>
            <Button asChild className="mt-5" variant="outline">
              <Link to={card.href}>{card.action}</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
