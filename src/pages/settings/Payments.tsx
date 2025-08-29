import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard } from "lucide-react"

const paymentIcons = [
  { name: "Visa", color: "text-blue-600" },
  { name: "Mastercard", color: "text-red-500" },
  { name: "American Express", color: "text-blue-500" },
  { name: "Discover", color: "text-orange-500" },
  { name: "Diners Club", color: "text-gray-600" },
  { name: "Shop Pay", color: "text-purple-600" },
  { name: "Apple Pay", color: "text-gray-800" },
  { name: "+2", color: "text-gray-500" }
]

const subscriptionStatuses = [
  {
    status: "Pending",
    color: "bg-orange-100 text-orange-700",
    definition: "Card was authorized, but subscription has not started yet (not captured) or no prescription written yet"
  },
  {
    status: "Inactive",
    color: "bg-gray-100 text-gray-700",
    definition: "Subscription in Stripe is no longer active but was previously active"
  },
  {
    status: "Active",
    color: "bg-green-100 text-green-700",
    definition: "Subscription is Active in Stripe"
  },
  {
    status: "Past Due",
    color: "bg-red-100 text-red-700",
    definition: "Subscription was due for payment but was not successful"
  },
  {
    status: "Unpaid",
    color: "bg-red-100 text-red-700",
    definition: "Subscription was due for payment but was not successful"
  },
  {
    status: "Cancelled",
    color: "bg-gray-100 text-gray-700",
    definition: "Subscription was cancelled"
  },
  {
    status: "Incomplete",
    color: "bg-blue-100 text-blue-700",
    definition: "Subscription was created but is marked by stripe as incomplete"
  },
  {
    status: "Incomplete Expired",
    color: "bg-red-100 text-red-700",
    definition: "Subscription was active but became expired"
  },
  {
    status: "Complete",
    color: "bg-green-100 text-green-700",
    definition: "Has reached the end of its lifecycle"
  },
  {
    status: "Error",
    color: "bg-red-100 text-red-700",
    definition: "Unable to retrieve Stripe Status"
  }
]

export default function Payments() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Payments</h1>
      </div>

      {/* Bask Payments Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium">Bask Payments</CardTitle>
          </div>
          <Button variant="outline" size="sm">Manage</Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Account ID</p>
            <p className="text-sm font-mono">acct_1QRbOqx8FD0x3snxP</p>
            <Button variant="link" className="h-auto p-0 text-xs text-primary">
              Manage
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {paymentIcons.map((icon, index) => (
              <div key={index} className="flex items-center justify-center w-8 h-6 bg-white border rounded text-xs">
                <CreditCard className={`w-4 h-4 ${icon.color}`} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <div className="text-muted-foreground">Credit card rate</div>
              <div className="font-medium">2.9% + $0.30</div>
            </div>
            <div>
              <div className="text-muted-foreground">Transaction fee</div>
              <div className="font-medium">0%</div>
            </div>
          </div>

          <div>
            <div className="text-muted-foreground text-sm">Stripe Account Status</div>
            <Badge variant="secondary" className="bg-green-100 text-green-700 border-0 mt-1">
              Complete
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Payment Statuses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Payment Statuses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 text-sm font-medium text-muted-foreground border-b pb-2">
            <div>SUBSCRIPTION STATUS</div>
            <div>DEFINITION</div>
          </div>

          {subscriptionStatuses.map((item, index) => (
            <div key={index} className="grid grid-cols-2 text-sm py-2 border-b border-border/50 last:border-0">
              <div>
                <Badge variant="secondary" className={`${item.color} border-0 text-xs`}>
                  {item.status}
                </Badge>
              </div>
              <div className="text-muted-foreground text-xs leading-relaxed">
                {item.definition}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}