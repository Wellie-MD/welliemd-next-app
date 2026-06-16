import { FileText, GitBranch, LayoutGrid, ShieldCheck } from "lucide-react";
import { LibraryStatCard, TreatmentPageHeader, LibraryContentCard } from "../components/common";
import { useContentLibraryStats } from "../hooks/useTreatmentLibraries";

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

      <div className="grid gap-6 lg:grid-cols-2">
        <LibraryContentCard
          title="Consent Forms Library"
          subtitle="Legal documents · versioned & scoped"
          icon={<ShieldCheck className="h-6 w-6" />}
          tone="purple"
          stat={<strong>1</strong>}
          listItems={[
            "Consent (Truthfulness) · global · all plans"
          ]}
          recentText={<span><strong>Consent (Truthfulness)</strong> · auto-shown on every plan</span>}
          href="/dashboard/treatments/consents"
          actionLabel="Manage consents"
        />

        <LibraryContentCard
          title="Common Sections"
          subtitle="Reusable patient data · shared across custom forms"
          icon={<LayoutGrid className="h-6 w-6" />}
          tone="teal"
          stat={<><strong>2</strong> sections · global · Beluga-mapped</>}
          listItems={[
            "Medical Baseline · 3 fields · Beluga-mapped",
            "Identity Verification · photo ID upload"
          ]}
          recentText={<span><strong>Medical Baseline</strong> · mapped to medicalConditions, selfReportedMeds, allergies · 4 days ago</span>}
          href="/dashboard/treatments/sections"
          actionLabel="View sections"
        />

        <LibraryContentCard
          title="Programs"
          subtitle="Treatment-specific questionnaires · onboarding & follow-up"
          icon={<GitBranch className="h-6 w-6" />}
          tone="blue"
          stat={<><strong>24</strong> eligibility modules · 12 onboarding, 12 follow-up</>}
          listItems={[
            "ED Intake · v2 · 8 questions",
            "TRT Intake · v2 · 12 questions"
          ]}
          recentText={<span><strong>TRT Intake v2</strong> published · 5 days ago</span>}
          href="/dashboard/treatments/programs"
          actionLabel="Manage programs"
        />

        <LibraryContentCard
          title="Custom Programs"
          subtitle="Client-customized intakes · single & multi-treatment routing"
          icon={<FileText className="h-6 w-6" />}
          tone="indigo"
          stat={<><strong>2</strong> custom forms · both multi-treatment routing</>}
          listItems={[
            "WellieMD Universal Intake · routes across all treatments",
            "Men's Sexual Health · multi [ED, PE, Herpes]"
          ]}
          recentText={<span>Single-treatment plans moved to <strong>Programs</strong> · Phase 3 migration complete</span>}
          href="/dashboard/treatments/custom-programs"
          actionLabel="View custom programs"
        />
      </div>
    </div>
  );
}
