import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import mockData from "@/data/mockData.json"

export default function Analytics() {
  const { analytics } = mockData

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>Analytics</span>
            <span>›</span>
            <span>Views</span>
          </div>
        </div>
      </div>

      {/* Visitors Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Visitors</CardTitle>
          <Select defaultValue="today">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <StatCard title="Total Visitors" value={analytics.visitors.total.toString()} />
            <StatCard title="Unique Visitors" value={analytics.visitors.unique.toString()} />
            <StatCard title="Total Pageviews" value={analytics.visitors.totalPageviews.toString()} />
            <StatCard title="Views Per Visit" value={analytics.visitors.viewsPerVisit.toString()} />
            <StatCard title="Bounce Rate" value={analytics.visitors.bounceRate.toString()} />
            <StatCard title="Visit Duration" value={analytics.visitors.visitDuration.toString()} />
          </div>
          
          <div className="h-80 flex items-center justify-center bg-muted/20 rounded">
            <p className="text-muted-foreground">Analytics chart visualization would go here</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Steps By Page */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Steps By Page</CardTitle>
            <Select defaultValue="visitors">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visitors">Visitors</SelectItem>
                <SelectItem value="pageviews">Pageviews</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No Data Available on the selected time filter
            </div>
          </CardContent>
        </Card>

        {/* Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Devices
              <div className="flex gap-4 text-sm">
                <span>Browser</span>
                <span>OS</span>
                <span>Size</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No Data available on selected time filter
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sources */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Sources</CardTitle>
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="utm">Select UTM parameter</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No Data Available on the selected time filter
            </div>
          </CardContent>
        </Card>

        {/* Customer Behavior */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Customer Behavior</CardTitle>
            <span className="text-sm text-muted-foreground">Last 30 minutes</span>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Visitors</p>
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Checking</p>
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Purchased</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}