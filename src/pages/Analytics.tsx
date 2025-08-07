import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { VisitorChart } from "@/components/analytics/VisitorChart"
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

      {/* Visitors Chart with Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <VisitorChart data={analytics.chartData} />
        </div>
        <div className="space-y-4">
          <StatCard 
            title="Total Visitors" 
            value={analytics.visitors.total.toString()} 
            className="bg-white shadow-sm font-bold"
          />
          <StatCard 
            title="Unique Visitors" 
            value={analytics.visitors.unique.toString()} 
            className="bg-white shadow-sm font-bold"
          />
          <StatCard 
            title="Total Pageviews" 
            value={analytics.visitors.totalPageviews.toString()} 
            className="bg-white shadow-sm font-bold"
          />
          <StatCard 
            title="Views Per Visit" 
            value={analytics.visitors.viewsPerVisit.toString()} 
            className="bg-white shadow-sm font-bold"
          />
          <StatCard 
            title="Bounce Rate" 
            value={analytics.visitors.bounceRate.toString()} 
            className="bg-white shadow-sm font-bold"
          />
          <StatCard 
            title="Visit Duration" 
            value={analytics.visitors.visitDuration.toString()} 
            className="bg-white shadow-sm font-bold"
          />
        </div>
      </div>

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
                <p className="text-2xl font-bold">{analytics.customerBehavior.visitors}</p>
                <p className="text-sm text-muted-foreground">Visitors</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.customerBehavior.checking}</p>
                <p className="text-sm text-muted-foreground">Checking Out</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.customerBehavior.purchased}</p>
                <p className="text-sm text-muted-foreground">Purchased</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Locations */}
        <Card>
          <CardHeader>
            <CardTitle>Locations</CardTitle>
            <p className="text-sm text-muted-foreground">{analytics.locations.lastUpdated}</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Button variant="outline" size="sm">Map</Button>
              <Button variant="ghost" size="sm">Chart</Button>
            </div>
            <div className="flex items-center justify-center h-32 text-muted-foreground bg-muted/20 rounded">
              No Data Available on the selected time filter
            </div>
          </CardContent>
        </Card>

        {/* Session Duration and Total Sessions */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Avg. Session Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{analytics.sessionDuration.average}</p>
                <div className="mt-4 h-4 bg-muted rounded">
                  <div className="h-full bg-muted rounded"></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>11 hours ago</span>
                  <span>Now</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{analytics.totalSessions}</p>
                <div className="mt-4 h-4 bg-muted rounded">
                  <div className="h-full bg-muted rounded"></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>11 hours ago</span>
                  <span>Now</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Checkouts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{analytics.totalCheckouts}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{analytics.totalSales}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sales Funnel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sales Funnel</CardTitle>
          <div className="flex gap-4 text-sm">
            <Button variant="ghost" size="sm">Number of Occurrences</Button>
            <Button variant="ghost" size="sm">Unique Visitors</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No Data Available on the selected time filter
          </div>
        </CardContent>
      </Card>
    </div>
  )
}