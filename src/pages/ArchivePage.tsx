import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TreatmentPageHeader } from "@/features/treatments/common/components";
import ArchiveProgramsTab from "@/components/archive/ArchiveProgramsTab";
import ArchiveProductsTab from "@/components/archive/ArchiveProductsTab";
import ArchiveTemplatesTab from "@/components/archive/ArchiveTemplatesTab";
import ArchiveClientsTab from "@/components/archive/ArchiveClientsTab";
import ArchiveConsentsTab from "@/components/archive/ArchiveConsentsTab";

const archiveTabs = [
  { value: "programs", label: "Programs" },
  { value: "products", label: "Products" },
  { value: "templates", label: "Templates" },
  { value: "clients", label: "Clients" },
  { value: "consents", label: "Consents" },
] as const;

export default function ArchivePage() {
  return (
    <div className="p-6">
      <TreatmentPageHeader
        title="Archive"
        subtitle="Deactivated programs, retired products, archived templates, clients, and consent forms are stored here. Restore an item to return it to its active library."
      />

      <Tabs defaultValue="programs" className="space-y-6">
        <TabsList className="bg-transparent p-0 h-auto gap-2">
          {archiveTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all border data-[state=active]:bg-indigo-50/50 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 data-[state=active]:shadow-none"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6">
          <TabsContent value="programs" className="mt-0">
            <ArchiveProgramsTab />
          </TabsContent>
          <TabsContent value="products" className="mt-0">
            <ArchiveProductsTab />
          </TabsContent>
          <TabsContent value="templates" className="mt-0">
            <ArchiveTemplatesTab />
          </TabsContent>
          <TabsContent value="clients" className="mt-0">
            <ArchiveClientsTab />
          </TabsContent>
          <TabsContent value="consents" className="mt-0">
            <ArchiveConsentsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
