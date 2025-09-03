import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard } from "lucide-react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"

const paymentMethods = [
  { id: "visa", name: "Visa" },
  { id: "mastercard", name: "Mastercard" },
  { id: "amex", name: "American Express" },
  { id: "discover", name: "Discover" },
  { id: "diners", name: "Diners Club" },
  { id: "apple", name: "Apple Pay" },
  { id: "google", name: "Google Pay" },
  { id: "meta", name: "Meta Pay" }
]

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
  const [open, setOpen] = useState(false)
  const [selectedMethods, setSelectedMethods] = useState<string[]>([])
  const [formData, setFormData] = useState({
    payoutDescriptor: "BASK",
    payoutSchedule: "business",
    statementDescriptor: "Pause RX",
    shortenedDescriptor: "PauseRX",
    testMode: false
  })

  const togglePaymentMethod = (methodId: string) => {
    setSelectedMethods(prev =>
      prev.includes(methodId)
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Payments</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium">Bask Payments</CardTitle>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">Manage</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Manage Payment Methods</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="text-sm text-muted-foreground">
                  Account ID: acct_1RRbCXBFD0x3svup
                </div>

                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center gap-3">
                      <Checkbox
                        id={method.id}
                        checked={selectedMethods.includes(method.id)}
                        onCheckedChange={() => togglePaymentMethod(method.id)}
                      />
                      <label htmlFor={method.id} className="text-sm">
                        {method.name}
                      </label>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="font-medium mb-4">Payout Details</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your earnings are deposited into this bank account. Choose the frequency of your payouts and edit the way they're described on your bank statements.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Payout Statement Descriptor</Label>
                      <Input
                        value={formData.payoutDescriptor}
                        onChange={(e) => setFormData(prev => ({ ...prev, payoutDescriptor: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">The way payouts are described on your bank statements.</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Payout Schedule</Label>
                      <RadioGroup
                        value={formData.payoutSchedule}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, payoutSchedule: value }))}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="business" id="business" />
                          <Label htmlFor="business">Every Business Day</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="week" id="week" />
                          <Label htmlFor="week">Every Week</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="month" id="month" />
                          <Label htmlFor="month">Every Month</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label>Statement Descriptor</Label>
                      <Input
                        value={formData.statementDescriptor}
                        onChange={(e) => setFormData(prev => ({ ...prev, statementDescriptor: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Shortened Descriptor</Label>
                      <Input
                        value={formData.shortenedDescriptor}
                        onChange={(e) => setFormData(prev => ({ ...prev, shortenedDescriptor: e.target.value }))}
                      />
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Test Mode</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Test Bask Payments setup and configuration to simulate successful and failed transactions. Learn more about <a href="#" className="text-blue-500">test mode</a>
                      </p>
                      <div className="flex items-center gap-2">
                        <Label>Turn Test Mode on:</Label>
                        <Switch
                          checked={formData.testMode}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, testMode: checked }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setOpen(false)}>Save</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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