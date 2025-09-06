import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Eye, Trash2, Copy, Info } from "lucide-react"

export default function WebhooksApis() {
  const [apiKeys] = useState({
    apiKey: "8cf22a5edf3f4355f7cdae1fe65fc8f1",
    secretKey: "•••••••••••••••••••••••••"
  })

  const [showSecret, setShowSecret] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Webhooks & API</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Webhooks</CardTitle>
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No webhooks found</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Welliemd Doctors</CardTitle>
              </div>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="endpoints" className="w-full">
              <TabsList>
                <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              </TabsList>
              <TabsContent value="endpoints" className="mt-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    You need to be on a plan to have access to this suite of APIs.{" "}
                    <Button variant="link" className="h-auto p-0 text-primary">
                      Select Plan
                    </Button>
                  </AlertDescription>
                </Alert>
              </TabsContent>
              <TabsContent value="webhooks" className="mt-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    You need to be on a plan to have access to this suite of APIs.{" "}
                    <Button variant="link" className="h-auto p-0 text-primary">
                      Select Plan
                    </Button>
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Welliemd Pharmacy</CardTitle>
              </div>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="endpoints" className="w-full">
              <TabsList>
                <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              </TabsList>
              <TabsContent value="endpoints" className="mt-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    You need to be on a plan to have access to this suite of APIs.{" "}
                    <Button variant="link" className="h-auto p-0 text-primary">
                      Select Plan
                    </Button>
                  </AlertDescription>
                </Alert>
              </TabsContent>
              <TabsContent value="webhooks" className="mt-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    You need to be on a plan to have access to this suite of APIs.{" "}
                    <Button variant="link" className="h-auto p-0 text-primary">
                      Select Plan
                    </Button>
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>API key and secret key</CardTitle>
              </div>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-foreground">API Key</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                      {apiKeys.apiKey}
                    </code>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(apiKeys.apiKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-foreground">API Secret Key</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                      {showSecret ? apiKeys.secretKey : "•••••••••••••••••••••••••"}
                    </code>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}