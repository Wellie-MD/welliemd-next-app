import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Header } from "@/components/layout/Header";
import { SettingsLayout } from "@/components/layout/SettingsLayout";
import { IntercomCardBanner } from "@/features/announcements/IntercomBanners";

const SettingsFrame = () => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex flex-1">
          <Suspense
            fallback={
              <div className="flex min-h-[50vh] flex-1 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            }
          >
            <SettingsLayout />
          </Suspense>
        </div>
      </div>
      <IntercomCardBanner />
    </div>
  </SidebarProvider>
);

export default SettingsFrame;
