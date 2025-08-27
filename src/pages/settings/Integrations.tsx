import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Tag } from "lucide-react"

const integrations = [
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
    iconColor: "text-green-500"
  }
]

export default function Integrations() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Integrations</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[900px]">
        {integrations.map((integration) => (
          <Card key={integration.id} className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <integration.icon className={`h-5 w-5 ${integration.iconColor}`} />
                </div>
                <CardTitle className="text-lg font-semibold">{integration.name}</CardTitle>
              </div>
              <CardDescription className="text-sm text-muted-foreground">
                {integration.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                variant="outline"
                size="sm" 
                className="w-full text-primary font-medium"
              >
                {integration.buttonText}
                <span className="ml-1">›</span>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}