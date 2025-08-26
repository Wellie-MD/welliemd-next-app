import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Info, Eye, EyeOff } from "lucide-react"
import { useState } from "react"

export default function StoreDetails() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Store details</h1>
      </div>

      {/* Message for visitors */}
      <Card>
        <CardContent className="p-6">
          <Label htmlFor="visitor-message" className="text-sm font-medium text-muted-foreground">
            Message for your visitors
          </Label>
          <Textarea
            id="visitor-message"
            placeholder="Enter your message here"
            className="mt-2 min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium text-primary">Basic Information</CardTitle>
          <Button variant="outline" size="sm">Add</Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="store-name">Store Name</Label>
            <Input id="store-name" defaultValue="Pause RX" className="mt-1" />
          </div>
          
          <div>
            <Label htmlFor="legal-business-name">Legal business name</Label>
            <Input id="legal-business-name" defaultValue="Pause RX" className="mt-1" />
          </div>
          
          <div>
            <Label htmlFor="business-structure">Business Structure</Label>
            <Select defaultValue="single-member-llc">
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single-member-llc">Single Member LLC</SelectItem>
                <SelectItem value="multi-member-llc">Multi Member LLC</SelectItem>
                <SelectItem value="corporation">Corporation</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Order ID Format</Label>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prefix" className="text-xs text-muted-foreground">Prefix</Label>
                <Input id="prefix" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="suffix" className="text-xs text-muted-foreground">Suffix</Label>
                <Input id="suffix" className="mt-1" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Your order ID will appear as #0001, #0002, #0003...
            </p>
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select defaultValue="pakistan-standard-time">
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pakistan-standard-time">Pakistan Standard Time</SelectItem>
                <SelectItem value="utc">UTC</SelectItem>
                <SelectItem value="est">Eastern Standard Time</SelectItem>
                <SelectItem value="pst">Pacific Standard Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Password Protection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-primary">Password Protection</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enable the password to restrict access to your online store. Only customers with the password can access it.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-700">
              This feature is still in development and is coming soon.
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="enable-password" />
            <Label htmlFor="enable-password" className="text-sm">Enable Password</Label>
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password here"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium text-primary">Personal Information</CardTitle>
          <Button variant="outline" size="sm">Edit</Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-medium">Name</Label>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="legal-first-name" className="text-xs text-muted-foreground">Legal First Name</Label>
                <Input id="legal-first-name" defaultValue="Jessica Lynne" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="legal-last-name" className="text-xs text-muted-foreground">Legal Last Name</Label>
                <Input id="legal-last-name" defaultValue="White" className="mt-1" />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Other</Label>
            <div className="mt-2">
              <Label htmlFor="date-of-birth" className="text-xs text-muted-foreground">Date of Birth</Label>
              <Input id="date-of-birth" placeholder="mm/dd/yyyy" className="mt-1" />
            </div>
          </div>

          <div>
            <Label htmlFor="email-address" className="text-xs text-muted-foreground">Email Address</Label>
            <Input id="email-address" defaultValue="hello@kickstartsocial.co" className="mt-1" />
          </div>

          <div>
            <Label htmlFor="phone-number" className="text-xs text-muted-foreground">Phone Number</Label>
            <Input id="phone-number" defaultValue="(310) 903-8546" className="mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium text-primary">Business Information</CardTitle>
          <Button variant="outline" size="sm">Edit</Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-medium">Registered business address</Label>
            <div className="mt-2 space-y-4">
              <div>
                <Label htmlFor="address-line-1" className="text-xs text-muted-foreground">Address line 1</Label>
                <Input id="address-line-1" defaultValue="1590 Rosecrans Ave" className="mt-1" />
              </div>
              
              <div>
                <Label htmlFor="address-line-2" className="text-xs text-muted-foreground">Address line 2</Label>
                <Input id="address-line-2" defaultValue="Ste D - 940" className="mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country" className="text-xs text-muted-foreground">Country</Label>
                  <Select defaultValue="united-states">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="united-states">United States</SelectItem>
                      <SelectItem value="canada">Canada</SelectItem>
                      <SelectItem value="mexico">Mexico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="city" className="text-xs text-muted-foreground">City</Label>
                  <Input id="city" defaultValue="Manhattan Beach" className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state" className="text-xs text-muted-foreground">State</Label>
                  <Select defaultValue="california">
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="california">California</SelectItem>
                      <SelectItem value="new-york">New York</SelectItem>
                      <SelectItem value="texas">Texas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="zip-code" className="text-xs text-muted-foreground">Zip Code</Label>
                  <Input id="zip-code" defaultValue="90266" className="mt-1" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="ein" className="text-xs text-muted-foreground">Employer Identification Number (EIN)</Label>
            <Input id="ein" defaultValue="93-3584928" className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">
              If you use your Social Security number for business tax purposes, you can enter that instead.
            </p>
          </div>

          <div>
            <Label htmlFor="doing-business-as" className="text-xs text-muted-foreground">Doing business as</Label>
            <Input id="doing-business-as" defaultValue="Pause RX" className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">
              The operating name of your company, if it&apos;s different than the legal name.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium text-primary">Payment Information</CardTitle>
          <Button variant="outline" size="sm">Edit</Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="bank-account" className="text-xs text-muted-foreground">Set up US or Canadian Bank Account</Label>
            <Select>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us-checking">US Checking Account</SelectItem>
                <SelectItem value="us-savings">US Savings Account</SelectItem>
                <SelectItem value="canadian-checking">Canadian Checking Account</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Numbers</Label>
            <div className="mt-2 space-y-4">
              <div>
                <Label htmlFor="routing-number" className="text-xs text-muted-foreground">Routing Number</Label>
                <Input id="routing-number" defaultValue="322271627" className="mt-1" />
              </div>
              
              <div>
                <Label htmlFor="account-number" className="text-xs text-muted-foreground">Account number</Label>
                <Input id="account-number" defaultValue="558706680" className="mt-1" />
              </div>
              
              <div>
                <Label htmlFor="confirm-account-number" className="text-xs text-muted-foreground">Confirm account number</Label>
                <Input id="confirm-account-number" defaultValue="558706680" className="mt-1" />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Descriptors</Label>
            <div className="mt-2 space-y-4">
              <div>
                <Label htmlFor="statement-descriptor" className="text-xs text-muted-foreground">Statement descriptor</Label>
                <Input id="statement-descriptor" defaultValue="Pause RX" className="mt-1" />
              </div>
              
              <div>
                <Label htmlFor="shortened-descriptor" className="text-xs text-muted-foreground">Shortened descriptor</Label>
                <Input id="shortened-descriptor" defaultValue="PauseRX" className="mt-1" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium text-primary">Customer Support Details</CardTitle>
          <Button variant="outline" size="sm">Edit</Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-medium">Customer Support Address</Label>
            <div className="mt-2 space-y-4">
              <div>
                <Label htmlFor="support-address-line-1" className="text-xs text-muted-foreground">Address line 1</Label>
                <Input id="support-address-line-1" defaultValue="1590 Rosecrans Avenue" className="mt-1" />
              </div>
              
              <div>
                <Label htmlFor="support-address-line-2" className="text-xs text-muted-foreground">Address line 2</Label>
                <Input id="support-address-line-2" defaultValue="Ste D - 940" className="mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="support-country" className="text-xs text-muted-foreground">Country</Label>
                  <Select defaultValue="united-states">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="united-states">United States</SelectItem>
                      <SelectItem value="canada">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="support-city" className="text-xs text-muted-foreground">City</Label>
                  <Input id="support-city" defaultValue="Manhattan Beach" className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="support-state" className="text-xs text-muted-foreground">State</Label>
                  <Select defaultValue="california">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="california">California</SelectItem>
                      <SelectItem value="new-york">New York</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="support-zip-code" className="text-xs text-muted-foreground">Zip Code</Label>
                  <Input id="support-zip-code" defaultValue="90266" className="mt-1" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="support-phone" className="text-xs text-muted-foreground">Customer support phone number</Label>
            <Input id="support-phone" defaultValue="(844) 917-2873" className="mt-1" />
          </div>

          <div>
            <Label htmlFor="support-email" className="text-xs text-muted-foreground">Customer support email address</Label>
            <Input id="support-email" defaultValue="hello@pauserx.com" className="mt-1" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}