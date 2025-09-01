import { Outlet, Routes, Route } from "react-router-dom"
import { SettingsSidebar } from "./SettingsSidebar"
import StoreDetails from "@/pages/settings/StoreDetails"
import Integrations from "@/pages/settings/Integrations"
import FulfillmentInventory from "@/pages/settings/FulfillmentInventory"
import UsersPermissions from "@/pages/settings/UsersPermissions"
import Metafields from "@/pages/settings/Metafields"
import Domains from "@/pages/settings/Domains"
import Files from "@/pages/settings/Files"
import Policies from "@/pages/settings/Policies"
import Payments from "@/pages/settings/Payments"

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
              <Route path="fulfillment-inventory" element={<FulfillmentInventory />} />
              <Route path="users-permissions" element={<UsersPermissions />} />
              <Route path="payments" element={<Payments />} />
              <Route path="files" element={<Files />} />
              <Route path="policies" element={<Policies />} />
              <Route path="metafields" element={<Metafields />} />
              <Route path="domains" element={<Domains />} />
              <Route path="" element={<StoreDetails />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}