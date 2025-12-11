import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

// Import payment gateway API and types
import paymentGatewayApi from "@/api/paymentGatewayApi"
import type { PaymentGatewayConfig, PaymentGatewayType } from "@/types/paymentGateway"
import { GATEWAY_FIELDS, GATEWAY_OPTIONS } from "@/types/paymentGateway"

// Import payment method icons
import visaIcon from "@/assets/icons/payment-methods/visa.svg"
import mastercardIcon from "@/assets/icons/payment-methods/mastercard.svg"
import amexIcon from "@/assets/icons/payment-methods/american-express.svg"
import discoverIcon from "@/assets/icons/payment-methods/discover.svg"
import dinersIcon from "@/assets/icons/payment-methods/diners-club.svg"
import applePayIcon from "@/assets/icons/payment-methods/apple-pay.svg"
import googlePayIcon from "@/assets/icons/payment-methods/google-pay.svg"
import metaPayIcon from "@/assets/icons/payment-methods/meta-pay.svg"

const paymentMethods = [
  { id: "visa", name: "Visa", icon: visaIcon },
  { id: "mastercard", name: "Mastercard", icon: mastercardIcon },
  { id: "amex", name: "American Express", icon: amexIcon },
  { id: "discover", name: "Discover", icon: discoverIcon },
  { id: "diners", name: "Diners Club", icon: dinersIcon },
  { id: "apple", name: "Apple Pay", icon: applePayIcon },
  { id: "google", name: "Google Pay", icon: googlePayIcon },
  { id: "meta", name: "Meta Pay", icon: metaPayIcon }
]

const paymentIcons = [
  { name: "Visa", icon: visaIcon },
  { name: "Mastercard", icon: mastercardIcon },
  { name: "American Express", icon: amexIcon },
  { name: "Discover", icon: discoverIcon },
  { name: "Diners Club", icon: dinersIcon },
  { name: "Apple Pay", icon: applePayIcon },
  { name: "Google Pay", icon: googlePayIcon },
  { name: "Meta Pay", icon: metaPayIcon }
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
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [selectedMethods, setSelectedMethods] = useState<string[]>(["visa", "mastercard", "amex", "apple", "google"])
  const [formData, setFormData] = useState({
    payoutDescriptor: "WELLIEMD",
    payoutSchedule: "business",
    weeklyDay: "monday",
    monthlyDay: "1st",
    statementDescriptor: "Pause RX",
    shortenedDescriptor: "PauseRX",
    testMode: false
  })

  // Payment Gateway Configuration State
  const [gatewayConfigOpen, setGatewayConfigOpen] = useState(false)
  const [gatewayLoading, setGatewayLoading] = useState(true)
  const [gatewaySaving, setGatewaySaving] = useState(false)
  const [gatewayConfig, setGatewayConfig] = useState<PaymentGatewayConfig>({
    payment_gateway: 'stripe',
    nmi_security_key: null,
    nmi_api_key: null,
    nmi_base_url: null,
    nmi_public_key: null,
    stripe_secret_key: null,
    stripe_publishable_key: null,
    stripe_subscription_id: null,
    authorize_net_api_login_id: null,
    authorize_net_transaction_key: null,
    authorize_net_base_url: null,
    authorize_net_environment: null,
    authnet_client_key: null,
  })

  // Fetch payment gateway configuration on mount
  useEffect(() => {
    const fetchGatewayConfig = async () => {
      try {
        setGatewayLoading(true)
        const response = await paymentGatewayApi.getConfig()
        if (response.success && response.payment_config) {
          setGatewayConfig(response.payment_config)
        }
      } catch (error: any) {
        console.error('Failed to fetch payment gateway config:', error)
        // Don't show error toast on initial load - config may not exist yet
      } finally {
        setGatewayLoading(false)
      }
    }
    fetchGatewayConfig()
  }, [])

  const togglePaymentMethod = (methodId: string) => {
    setSelectedMethods(prev =>
      prev.includes(methodId)
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    )
  }

  const handleSave = () => {
    // Handle save logic here
    console.log("Saving payment settings:", { selectedMethods, formData })
    setOpen(false)
  }

  const handleGatewayChange = (gateway: PaymentGatewayType) => {
    setGatewayConfig(prev => ({ ...prev, payment_gateway: gateway }))
  }

  const handleGatewayFieldChange = (key: keyof PaymentGatewayConfig, value: string) => {
    setGatewayConfig(prev => ({ ...prev, [key]: value || null }))
  }

  const handleGatewayConfigSave = async () => {
    try {
      setGatewaySaving(true)
      const response = await paymentGatewayApi.updateConfig(gatewayConfig)
      if (response.success) {
        setGatewayConfig(response.payment_config)
        toast({
          title: "Success",
          description: "Payment gateway configuration saved successfully",
        })
        setGatewayConfigOpen(false)
      }
    } catch (error: any) {
      console.error('Failed to save payment gateway config:', error)
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to save payment gateway configuration",
        variant: "destructive",
      })
    } finally {
      setGatewaySaving(false)
    }
  }

  const getGatewayLabel = (gateway: PaymentGatewayType): string => {
    return GATEWAY_OPTIONS.find(opt => opt.value === gateway)?.label || gateway
  }

  const isGatewayConfigured = (): boolean => {
    const { payment_gateway } = gatewayConfig
    if (payment_gateway === 'stripe') {
      return !!(gatewayConfig.stripe_secret_key && gatewayConfig.stripe_publishable_key)
    }
    if (payment_gateway === 'nmi') {
      return !!(gatewayConfig.nmi_security_key)
    }
    if (payment_gateway === 'authorize_net') {
      return !!(gatewayConfig.authorize_net_api_login_id && gatewayConfig.authorize_net_transaction_key)
    }
    return false
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Payments</h1>
      </div>

      {/* Payment Gateway Configuration Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium">Payment Gateway</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configure how you receive payments from patients
            </p>
          </div>
          <Dialog open={gatewayConfigOpen} onOpenChange={setGatewayConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">Configure</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Payment Gateway Configuration</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Select your payment gateway and enter your credentials
                </p>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Gateway Selection */}
                <div>
                  <Label className="text-sm font-medium">Payment Gateway</Label>
                  <Select 
                    value={gatewayConfig.payment_gateway} 
                    onValueChange={(value) => handleGatewayChange(value as PaymentGatewayType)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a payment gateway" />
                    </SelectTrigger>
                    <SelectContent>
                      {GATEWAY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dynamic Gateway Fields */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">
                    {getGatewayLabel(gatewayConfig.payment_gateway)} Credentials
                  </h3>
                  
                  {GATEWAY_FIELDS[gatewayConfig.payment_gateway]?.map((field) => (
                    <div key={field.key}>
                      <Label className="text-sm">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      
                      {field.type === 'select' ? (
                        <Select
                          value={(gatewayConfig[field.key] as string) || ''}
                          onValueChange={(value) => handleGatewayFieldChange(field.key, value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder={field.placeholder} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={field.type || 'text'}
                          value={(gatewayConfig[field.key] as string) || ''}
                          onChange={(e) => handleGatewayFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="mt-1 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setGatewayConfigOpen(false)} disabled={gatewaySaving}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleGatewayConfigSave} 
                    className="bg-sky-500 hover:bg-sky-600"
                    disabled={gatewaySaving}
                  >
                    {gatewaySaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {gatewaySaving ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {gatewayLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading configuration...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Selected Gateway</div>
                  <div className="font-medium">{getGatewayLabel(gatewayConfig.payment_gateway)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <Badge 
                    variant="secondary" 
                    className={`${isGatewayConfigured() ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'} border-0 mt-1`}
                  >
                    {isGatewayConfigured() ? 'Configured' : 'Not Configured'}
                  </Badge>
                </div>
              </div>
              
              {!isGatewayConfigured() && (
                <p className="text-sm text-muted-foreground">
                  Click "Configure" to set up your payment gateway credentials.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium">WellieMD Payments</CardTitle>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">Manage</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Manage Payment Methods</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Account ID: acct_1RRbCXBFD0x3svup
                </p>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Payment Methods Selection */}
                <div>
                  <h3 className="font-medium mb-3">Payment Methods</h3>
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center gap-3">
                        <Checkbox
                          id={method.id}
                          checked={selectedMethods.includes(method.id)}
                          onCheckedChange={() => togglePaymentMethod(method.id)}
                        />
                        <img 
                          src={method.icon} 
                          alt={method.name}
                          className="w-5 h-5 object-contain"
                        />
                        <label htmlFor={method.id} className="text-sm cursor-pointer">
                          {method.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payout Details */}
                <div>
                  <h3 className="font-medium mb-2">Payout Details</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your earnings are deposited into this bank account. Choose the frequency of your payouts and edit the way they're described on your bank statements.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm">Payout Statement Descriptor</Label>
                      <Input
                        value={formData.payoutDescriptor}
                        onChange={(e) => setFormData(prev => ({ ...prev, payoutDescriptor: e.target.value }))}
                        className="mt-1 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                      />
                      <p className="text-xs text-muted-foreground mt-1">The way payouts are described on your bank statements.</p>
                    </div>

                    <div>
                      <Label className="text-sm">Payout Schedule</Label>
                      <div className="mt-2 space-y-3">
                        <div className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            id="business" 
                            name="payoutSchedule"
                            value="business"
                            checked={formData.payoutSchedule === "business"}
                            onChange={(e) => setFormData(prev => ({ ...prev, payoutSchedule: e.target.value }))}
                            className="w-4 h-4"
                          />
                          <Label htmlFor="business" className="text-sm">Every Business Day</Label>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            id="week" 
                            name="payoutSchedule"
                            value="week"
                            checked={formData.payoutSchedule === "week"}
                            onChange={(e) => setFormData(prev => ({ ...prev, payoutSchedule: e.target.value }))}
                            className="w-4 h-4"
                          />
                          <Label htmlFor="week" className="text-sm mr-2">Every Week</Label>
                          <Select 
                            value={formData.weeklyDay} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, weeklyDay: value }))}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monday">on Monday</SelectItem>
                              <SelectItem value="tuesday">on Tuesday</SelectItem>
                              <SelectItem value="wednesday">on Wednesday</SelectItem>
                              <SelectItem value="thursday">on Thursday</SelectItem>
                              <SelectItem value="friday">on Friday</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            id="month" 
                            name="payoutSchedule"
                            value="month"
                            checked={formData.payoutSchedule === "month"}
                            onChange={(e) => setFormData(prev => ({ ...prev, payoutSchedule: e.target.value }))}
                            className="w-4 h-4"
                          />
                          <Label htmlFor="month" className="text-sm mr-2">Every Month</Label>
                          <Select 
                            value={formData.monthlyDay} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, monthlyDay: value }))}
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1st">on 1st</SelectItem>
                              <SelectItem value="15th">on 15th</SelectItem>
                              <SelectItem value="30th">on 30th</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Statement Descriptor</Label>
                      <Input
                        value={formData.statementDescriptor}
                        onChange={(e) => setFormData(prev => ({ ...prev, statementDescriptor: e.target.value }))}
                        className="mt-1 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Shortened Descriptor</Label>
                      <Input
                        value={formData.shortenedDescriptor}
                        onChange={(e) => setFormData(prev => ({ ...prev, shortenedDescriptor: e.target.value }))}
                        className="mt-1 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Test Mode */}
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium">Test Mode</h3>
                  <p className="text-sm text-muted-foreground">
                    Test WellieMD Payments setup and configuration to simulate successful and failed transactions.{" "}
                    <a href="#" className="text-sky-600 hover:text-sky-700">Learn more about test mode</a>
                  </p>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.testMode}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, testMode: checked }))}
                    />
                    <Label>Turn Test Mode on</Label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end">
                  <Button onClick={handleSave} className="bg-sky-500 hover:bg-sky-600">
                    Save
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Account ID</p>
            <p className="text-sm font-mono">acct_1QRbOqx8FD0x3snxP</p>
            <Button variant="link" className="h-auto p-0 text-xs text-sky-600 hover:text-sky-700">
              Manage
            </Button>
          </div>

          {/* Payment Method Icons */}
          <div className="flex flex-wrap gap-2 items-center">
            {paymentIcons.slice(0, 6).map((payment, index) => (
              <div key={index} className="flex items-center justify-center w-12 h-8 bg-white border rounded shadow-sm">
                <img 
                  src={payment.icon} 
                  alt={payment.name}
                  className="w-8 h-6 object-contain"
                />
              </div>
            ))}
            {paymentIcons.length > 6 && (
              <div className="flex items-center justify-center w-12 h-8 bg-gray-50 border rounded text-xs text-gray-600">
                +{paymentIcons.length - 6}
              </div>
            )}
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
            <div key={index} className="grid grid-cols-2 text-sm py-3 border-b border-border/50 last:border-0">
              <div>
                <Badge variant="secondary" className={`${item.color} border-0 text-xs`}>
                  {item.status}
                </Badge>
              </div>
              <div className="text-muted-foreground text-sm leading-relaxed">
                {item.definition}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
