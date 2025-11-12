import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw } from "lucide-react"

interface Domain {
  id: string
  name: string
  status: "Connected" | "Pending" | "Failed"
  dateAdded: string
  autoRenew: string
  provider?: string
}

export default function Domains() {
  const [domains] = useState<Domain[]>([
    {
      id: "1",
      name: "pause-rx.welliemd.com",
      status: "Connected",
      dateAdded: "May 22nd, 2025",
      autoRenew: "Never Expires",
      provider: "WellieMD"
    }
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Connected":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "Pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "Failed":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Domains</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            Connect
          </Button>
        </div>
      </div>

      {/* Primary Domain */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Primary Domain</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
              <div>DOMAIN NAME</div>
              <div>STATUS</div>
              <div>DATE ADDED</div>
              <div>PROVIDER</div>
            </div>
            <div className="text-sm text-muted-foreground">
              Traffic from all your domains redirects to this primary domain.{" "}
              <button className="text-primary hover:underline">
                Disable redirection
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WellieMD Managed Domain */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">WellieMD Managed Domain</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
              <div>DOMAIN NAME</div>
              <div>STATUS</div>
              <div>DATE ADDED</div>
              <div>AUTO-RENEW</div>
            </div>
            {domains.map((domain) => (
              <div key={domain.id} className="grid grid-cols-4 gap-4 items-center py-2">
                <div className="text-sm text-foreground">{domain.name}</div>
                <div>
                  <Badge className={getStatusColor(domain.status)}>
                    {domain.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">{domain.dateAdded}</div>
                <div className="text-sm text-muted-foreground">{domain.autoRenew}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Domains */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Domains and sub-domains</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
              <div>DOMAIN NAME</div>
              <div>STATUS</div>
              <div>TYPE</div>
              <div>DATE ADDED</div>
              <div>PROVIDER</div>
            </div>
            <div className="py-8 text-center text-muted-foreground">
              No additional domains configured
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}