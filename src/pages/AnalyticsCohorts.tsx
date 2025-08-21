import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, AlertTriangle } from "lucide-react"

export default function AnalyticsRetention() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Retention Cohort</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span>Digital Products</span>
            <span>All Time</span>
            <span>12</span>
            <span>Months</span>
          </div>
          <Select defaultValue="select-treatment">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="select-treatment">Select Treatment</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            📄
          </Button>
        </div>
      </div>

      <Tabs defaultValue="retention" className="space-y-6">
        <TabsList>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="repurchase">Repurchase</TabsTrigger>
          <TabsTrigger value="ltv">LTV</TabsTrigger>
        </TabsList>

        <TabsContent value="retention" className="space-y-6">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              This is a premium feature that is still in development. The data calculated might not be accurate and should be validated.
            </AlertDescription>
          </Alert>

          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              A cohort here is defined by the number of new patients in a given month.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No data</h3>
              <p className="text-sm text-muted-foreground">
                No retention data available for the selected period
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="repurchase" className="space-y-6">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              This is a premium feature that is still in development. The data calculated might not be accurate and should be validated.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No data</h3>
              <p className="text-sm text-muted-foreground">
                No repurchase data available for the selected period
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ltv" className="space-y-6">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              This is a premium feature that is still in development. The data calculated might not be accurate and should be validated.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No data</h3>
              <p className="text-sm text-muted-foreground">
                No LTV data available for the selected period
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}