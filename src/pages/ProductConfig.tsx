import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DoseMappingTab } from "@/components/products/DoseMappingTab";
import { ProductCategoryTab } from "@/components/products/ProductCategoryTab";
import { TitrationCategoryTab } from "@/components/products/TitrationCategoryTab";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ProductConfig() {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "dose-mapping";
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  // Sync state with URL if it changes externally
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <div className="p-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="dose-mapping">Dose Mapping</TabsTrigger>
          <TabsTrigger value="product-category">Product Category</TabsTrigger>
          <TabsTrigger value="titration-category">Titration Category</TabsTrigger>
        </TabsList>

        <TabsContent value="dose-mapping" className="space-y-6">
          <DoseMappingTab />
        </TabsContent>

        <TabsContent value="product-category" className="space-y-6">
          <ProductCategoryTab />
        </TabsContent>

        <TabsContent value="titration-category" className="space-y-6">
          <TitrationCategoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
