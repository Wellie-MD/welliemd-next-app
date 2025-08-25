import { Outlet, Routes, Route } from "react-router-dom"
import { SettingsSidebar } from "./SettingsSidebar"
import StoreDetails from "@/pages/settings/StoreDetails"

export function SettingsLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <SettingsSidebar />
      <main className="flex-1 p-6">
        <Routes>
          <Route path="store-details" element={<StoreDetails />} />
          <Route path="" element={<StoreDetails />} />
        </Routes>
      </main>
    </div>
  )
}