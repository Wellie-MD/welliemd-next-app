import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const fulfillmentStatuses = [
  {
    status: "Pending",
    color: "bg-orange-100 text-orange-700",
    definition: "Order has not been sent or queued for fulfillment, or received by the pharmacy."
  },
  {
    status: "New",
    color: "bg-blue-100 text-blue-700",
    definition: "Order was successfully received by the fulfillment center/pharmacy."
  },
  {
    status: "Error",
    color: "bg-red-100 text-red-700",
    definition: "An attempt was made to send the order to the pharmacy but an error occurred."
  },
  {
    status: "Processing",
    color: "bg-blue-100 text-blue-700",
    definition: "The pharmacy/fulfillment center has confirmed receipt of the order and prescription."
  },
  {
    status: "Exception",
    color: "bg-red-100 text-red-700",
    definition: "The pharmacy/fulfillment center has an issue with this order."
  },
  {
    status: "Shipped",
    color: "bg-green-100 text-green-700",
    definition: "The pharmacy is ready to ship this order."
  },
  {
    status: "Complete",
    color: "bg-green-100 text-green-700",
    definition: "The pharmacy has shipped this order and provided a tracking number."
  },
  {
    status: "Cancelled",
    color: "bg-yellow-100 text-yellow-700",
    definition: "This order was successfully cancelled by either the pharmacy or an admin."
  }
]

export default function FulfillmentInventory() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Fulfillment & Inventory</h1>
      </div>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Fulfillment</CardTitle>
          <p className="text-sm text-muted-foreground">
            How will you be fulfilling your orders?
          </p>
        </CardHeader>
      {/* Fulfillment Section */}
      <Card>
        
        <CardContent className="space-y-6">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-primary">Pharmacy</h3>
              <span className="text-sm text-muted-foreground">Bask Pharmacy Fulfillment</span>
            </div>
            
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div className="text-center">
                <div className="text-muted-foreground">Dispense Fee</div>
                <div className="font-medium">$10</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Storage Fee</div>
                <div className="font-medium">$1/sqft</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground">Shipping Fee</div>
                <div className="font-medium">Pass through</div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="grid grid-cols-2 text-sm">
                <div className="text-muted-foreground font-medium">REQUEST</div>
                <div className="text-muted-foreground font-medium">DEFINITION</div>
              </div>

              {fulfillmentStatuses.map((item, index) => (
                <div key={index} className="grid grid-cols-2 text-sm py-2">
                  <div>
                    <Badge variant="secondary" className={`${item.color} border-0 text-xs`}>
                      {item.status}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">
                    {item.definition}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Legal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="text-sm text-muted-foreground">
                Download a copy of the Pharmacy name(s), license numbers, and pharmacists by state.
              </p>
            </div>
            <Button variant="outline" size="sm">
              Download
            </Button>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-muted-foreground">
                View a list of all available medications our pharmacy has stocked and ready to ship.
              </p>
            </div>
            <Button variant="outline" size="sm">
              Download
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}