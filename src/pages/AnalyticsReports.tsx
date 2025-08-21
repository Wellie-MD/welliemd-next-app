import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default function AnalyticsReports() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Time Metrics</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>8 / 6 / 2025</span>
          <span>8 / 13 / 2025</span>
          <button className="text-blue-600 hover:text-blue-800">📅</button>
          <select className="border rounded px-2 py-1">
            <option>Select Treatment</option>
          </select>
          <button className="text-blue-600 hover:text-blue-800">📄</button>
        </div>
      </div>

      <Tabs defaultValue="time-metrics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="time-metrics">Time Metrics</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="aggregates">Aggregates</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
        </TabsList>

        <TabsContent value="time-metrics" className="space-y-6">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              This is a premium feature that is still in development. The data calculated might not be accurate and should be validated.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">No data</h3>
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <span>Avg. 0h</span>
                <div>Aug. 6 2025 → Aug. 13 2025</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">No data</h3>
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <span>Avg. 0h</span>
                <div>Aug. 6 2025 → Aug. 13 2025</div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="retention" className="space-y-6">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              This is a premium feature that is still in development. The data calculated might not be accurate and should be validated.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No data</h3>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="aggregates" className="space-y-6">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              This is a premium feature that is still in development. The data calculated might not be accurate and should be validated.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No data</h3>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-6">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              This is a premium feature that is still in development. The data calculated might not be accurate and should be validated.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No data</h3>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}