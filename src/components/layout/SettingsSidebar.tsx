import { NavLink, useLocation } from "react-router-dom"
import {
  Store,
  Plug2,
  Users,
  Package,
  Stethoscope,
  CreditCard,
  Bell,
  Webhook,
  FileText,
  Shield,
  Tag,
  Globe,
  Palette,
  TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"

const settingsMenuItems = [
  { title: "Store Details", url: "/dashboard/settings/store-details", icon: Store },
  { title: "Integrations", url: "/dashboard/settings/integrations", icon: Plug2 },
  { title: "Users and Permissions", url: "/dashboard/settings/users-permissions", icon: Users },
  { title: "Fulfillment and Inventory", url: "/dashboard/settings/fulfillment-inventory", icon: Package },
  { title: "E-prescribing and doctors", url: "/dashboard/settings/prescribing-doctors", icon: Stethoscope },
  { title: "Payments", url: "/dashboard/settings/payments", icon: CreditCard },
  { title: "Notifications", url: "/dashboard/settings/notifications", icon: Bell },
  { title: "Webhooks & APIs", url: "/dashboard/settings/webhooks-apis", icon: Webhook },
  { title: "Files", url: "/dashboard/settings/files", icon: FileText },
  { title: "Policies", url: "/dashboard/settings/policies", icon: Shield },
  { title: "Metafields", url: "/dashboard/settings/metafields", icon: Tag },
  { title: "Domains", url: "/dashboard/settings/domains", icon: Globe },
  { title: "Brand", url: "/dashboard/settings/brand", icon: Palette },
  { title: "Analytics and SEO", url: "/dashboard/settings/analytics-seo", icon: TrendingUp },
]

export function SettingsSidebar() {
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path
  
  return (
    <div className="w-64 bg-background border-r border-border">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">P</span>
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Pause RX</h2>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>Front: pause-rx.mybasktHealth.com</div>
              <div>Patient: pause-rx.mybasktHealth.com/patient</div>
              <div>Admin: pause-rx.mybasktHealth.com/admin</div>
            </div>
          </div>
        </div>
        
        <nav className="space-y-1">
          {settingsMenuItems.map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive(item.url) ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}