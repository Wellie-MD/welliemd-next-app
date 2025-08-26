import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, BarChart3, Tag, MessageCircle, HelpCircle, TrendingUp, Coins } from "lucide-react"

const integrations = [
  {
    id: "shipstation",
    name: "ShipStation",
    description: "Manage your orders. only works for manual orders",
    icon: Settings,
    buttonText: "Edit Configs",
    iconColor: "text-green-600"
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Optimize data tracking. Ideal for comprehensive analytics integration.",
    icon: BarChart3,
    buttonText: "Edit Configs",
    iconColor: "text-orange-500"
  },
  {
    id: "google-tag-manager",
    name: "Google Tag Manager",
    description: "Streamline tag management. Ideal for seamless tracking and analysis.",
    icon: Tag,
    buttonText: "Edit Configs",
    iconColor: "text-blue-500"
  },
  {
    id: "intercom",
    name: "Intercom",
    description: "Enhance customer interactions. Ideal for automated messaging.",
    icon: MessageCircle,
    buttonText: "Install",
    buttonVariant: "outline" as const,
    iconColor: "text-blue-600"
  },
  {
    id: "zendesk",
    name: "Zendesk",
    description: "Zendesk is a powerful customer service platform designed to enhance interactions between businesses",
    icon: HelpCircle,
    buttonText: "Install",
    buttonVariant: "outline" as const,
    iconColor: "text-gray-800"
  },
  {
    id: "growsurf",
    name: "Growsurf",
    description: "Boost user engagement. Perfect for referral marketing automation.",
    icon: TrendingUp,
    buttonText: "Install",
    buttonVariant: "outline" as const,
    iconColor: "text-blue-400"
  },
  {
    id: "grin",
    name: "Grin",
    description: "Affiliate Marketing Platform",
    icon: Coins,
    buttonText: "Install",
    buttonVariant: "outline" as const,
    iconColor: "text-gray-600"
  }
]

export default function Integrations() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Integrations</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                  <integration.icon className={`h-4 w-4 ${integration.iconColor}`} />
                </div>
                <CardTitle className="text-base font-medium">{integration.name}</CardTitle>
              </div>
              <CardDescription className="text-sm text-muted-foreground">
                {integration.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                variant={integration.buttonVariant || "default"} 
                size="sm" 
                className="w-full"
              >
                {integration.buttonText}
                {integration.buttonText === "Edit Configs" && (
                  <span className="ml-1">›</span>
                )}
                {integration.buttonText === "Install" && (
                  <span className="ml-1">›</span>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}