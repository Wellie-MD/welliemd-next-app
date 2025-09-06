import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Billing() {
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Billing</h1>
      
      {/* Payment Methods Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Payment methods</h2>
            <p className="text-sm text-muted-foreground">
              Manage how you pay your bills in Bask.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Default payment methods</h2>
            <p className="text-sm text-muted-foreground">
              Add a payment method for purchases and bills in Bask.
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Added payment methods:</p>
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Card ending in 1383 (Default)</span>
                </div>
              </div>
            </div>
            
            <Button variant="outline" className="text-blue-600">
              + Add payment method
            </Button>
          </div>
        </div>
      </div>

      {/* Subscriptions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Subscriptions</h2>
            <p className="text-sm text-muted-foreground">
              An overview of items that you're billed for regularly, like your Welliemd Subscription and 3rd parties with recurring charges.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Recent Subscriptions</h2>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">BK</span>
              </div>
              <div>
                <p className="font-medium">Welliemd Subscription</p>
                <p className="text-sm text-muted-foreground">Your next invoice is on August 26th, 2025</p>
              </div>
            </div>
          </div>
          
          <Button variant="outline" className="text-blue-600">
            View all subscriptions
          </Button>
        </div>
      </div>

      {/* Bills Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Bills</h2>
            <p className="text-sm text-muted-foreground">
              Your monthly bill is on a 30-day cycle. It includes your Welliemd Subscription, 3rd party charges, and transaction fees.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Current billing cycle: August 26, 2025</h2>
            <p className="text-sm text-muted-foreground">
              If you reach $3,000 in fees before the end of your billing cycle, a fee threshold bill will be issued automatically.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Bask Standard</span>
              <span className="text-sm">$2,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Pharmacy Cost</span>
              <span className="text-sm">$0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Shipping Cost</span>
              <span className="text-sm">$0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Dispense Fee</span>
              <span className="text-sm">$0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Visit Cost</span>
              <span className="text-sm">$0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Other</span>
              <span className="text-sm">$0</span>
            </div>
            <hr />
            <div className="flex justify-between font-semibold">
              <span>Running Total</span>
              <span>$2,000</span>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button variant="outline" className="text-blue-600">
              View Current Bill
            </Button>
            <Button variant="outline" className="text-blue-600">
              View Billing History
            </Button>
          </div>
        </div>
      </div>

      {/* Balance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Balance</h2>
            <p className="text-sm text-muted-foreground">Balance</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Your current stripe balance</h2>
            <p className="text-sm text-muted-foreground">
              Payouts are made daily by default. You can change this in your settings.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Currently on the way to your bank account</span>
              <span className="text-sm">$0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Estimated future payouts</span>
              <span className="text-sm">$0</span>
            </div>
            <hr />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>$0</span>
            </div>
          </div>
          
          <Button variant="outline" className="text-blue-600">
            View details
          </Button>
        </div>
      </div>
    </div>
  )
}