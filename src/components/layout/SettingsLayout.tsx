import { Suspense, useState } from "react"
import { Routes, Route } from "react-router-dom"
import { SettingsSidebar } from "./SettingsSidebar"
import { Loader2 } from "lucide-react"
import { lazyWithRetry } from "@/utils/lazyWithRetry"

const StoreDetails = lazyWithRetry(() => import("@/pages/settings/StoreDetails"))
const Integrations = lazyWithRetry(() => import("@/pages/settings/Integrations"))
const FulfillmentInventory = lazyWithRetry(() => import("@/pages/settings/FulfillmentInventory"))
const UsersPermissions = lazyWithRetry(() => import("@/pages/settings/UsersPermissions"))
const Metafields = lazyWithRetry(() => import("@/pages/settings/Metafields"))
const Domains = lazyWithRetry(() => import("@/pages/settings/Domains"))
const Files = lazyWithRetry(() => import("@/pages/settings/Files"))
const Policies = lazyWithRetry(() => import("@/pages/settings/Policies"))
const Payments = lazyWithRetry(() => import("@/pages/settings/Payments"))
const WebhooksApis = lazyWithRetry(() => import("@/pages/settings/WebhooksApis"))
const PrescribingDoctors = lazyWithRetry(() => import("@/pages/settings/PrescribingDoctors"))
const Brand = lazyWithRetry(() => import("@/pages/settings/Brand"))
const AnalyticsSeo = lazyWithRetry(() => import("@/pages/settings/AnalyticsSeo"))
const SmtpSettings = lazyWithRetry(() => import("@/pages/settings/SmtpSettings"))
const SmtpDomainSettings = lazyWithRetry(() => import("@/pages/settings/SmtpDomainSettings"))
const NotificationTemplates = lazyWithRetry(() => import("@/pages/settings/NotificationTemplates"))
const BelugaSettings = lazyWithRetry(() => import("@/pages/settings/BelugaSettings"))
const PatientResources = lazyWithRetry(() => import("@/pages/settings/PatientResources"))

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
          <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>}>
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
          </Suspense>
        </div>
      </main>
      {/* </div> */}
    </div>
  )
}
