import { Outlet, Routes, Route } from "react-router-dom"
import { SettingsSidebar } from "./SettingsSidebar"
import StoreDetails from "@/pages/settings/StoreDetails"
import Integrations from "@/pages/settings/Integrations"

export function SettingsLayout() {
  return (
    <div className="flex w-full bg-background">
      {/* Fixed Sidebar */}
      <div className="w-64 fixed left-0 top-0 h-full z-30">
        <SettingsSidebar />
      </div>
      
      {/* Main Content with Left Margin */}
      <div className="flex-1 ml-64 flex flex-col">
        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Routes>
              <Route path="store-details" element={<StoreDetails />} />
              <Route path="integrations" element={<Integrations />} />
              <Route path="" element={<StoreDetails />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}