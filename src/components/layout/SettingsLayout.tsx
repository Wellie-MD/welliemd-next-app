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
import WebhooksApis from "@/pages/settings/WebhooksApis"
import PrescribingDoctors from "@/pages/settings/PrescribingDoctors"
import Brand from "@/pages/settings/Brand"
import AnalyticsSeo from "@/pages/settings/AnalyticsSeo"
import SmtpSettings from "@/pages/settings/SmtpSettings"
import SmtpDomainSettings from "@/pages/settings/SmtpDomainSettings"
import NotificationTemplates from "@/pages/settings/NotificationTemplates"
import BelugaSettings from "@/pages/settings/BelugaSettings"
import PatientResources from "@/pages/settings/PatientResources"
import { useState } from "react"

export function SettingsLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex w-full bg-background">
      {/* Fixed Sidebar */}
      {/* <div className="w-64 fixed left-0 top-0 h-full z-30"> */}
      <SettingsSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
      />
      {/* </div> */}

      {/* Main Content with Left Margin */}
      {/* <div className="flex-1 ml-64 flex flex-col"> */}
      {/* Scrollable Content Area */}
      <main
        className={`flex-1 overflow-y-auto transition-all duration-200 ${collapsed ? "ml-16" : "ml-64"
          }`}
      >

        <div className="p-6">
          <Routes>
            <Route path="store-details" element={<StoreDetails />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="fulfillment-inventory" element={<FulfillmentInventory />} />
            <Route path="prescribing-doctors" element={<PrescribingDoctors />} />
            <Route path="users-permissions" element={<UsersPermissions />} />
            <Route path="payments" element={<Payments />} />
            <Route path="notifications" element={<NotificationTemplates />} />
            <Route path="notification-templates" element={<NotificationTemplates />} />
            <Route path="webhooks-apis" element={<WebhooksApis />} />
            <Route path="files" element={<Files />} />
            <Route path="policies" element={<Policies />} />
            <Route path="metafields" element={<Metafields />} />
            <Route path="domains" element={<Domains />} />
            <Route path="brand" element={<Brand />} />
            <Route path="analytics-seo" element={<AnalyticsSeo />} />
            <Route path="smtp-settings" element={<SmtpSettings />} />
            <Route path="email-domain" element={<SmtpDomainSettings />} />
            <Route path="beluga-settings" element={<BelugaSettings />} />
            <Route path="patient-resources" element={<PatientResources />} />
            <Route path="" element={<StoreDetails />} />
          </Routes>
        </div>
      </main>
      {/* </div> */}
    </div>
  )
}
