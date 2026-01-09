import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Info, Eye, EyeOff, Loader2 } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { storeSettingsApi } from "@/api/storeSettingsApi"
import type { StoreSettings } from "@/types/storeSettings"
import { useToast } from "@/hooks/use-toast"

export default function StoreDetails() {
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { toast } = useToast()

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      const data = await storeSettingsApi.getCurrent()
      setSettings(data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to load store settings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleSave = async () => {
    if (!settings) return
    
    try {
      setSaving(true)
      await storeSettingsApi.partialUpdate(settings.id, settings)
      toast({
        title: 'Success',
        description: 'Store settings updated successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update store settings',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof StoreSettings, value: any) => {
    if (settings) {
      setSettings({ ...settings, [field]: value })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="mx-auto">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load store settings</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Store details</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
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
            value={settings.visitor_message || ''}
            onChange={(e) => updateField('visitor_message', e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-primary">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="store-name">Store Name</Label>
            <Input 
              id="store-name" 
              value={settings.store_name || ''} 
              onChange={(e) => updateField('store_name', e.target.value)}
              className="mt-1" 
            />
          </div>
          
          <div>
            <Label htmlFor="legal-business-name">Legal business name</Label>
            <Input 
              id="legal-business-name" 
              value={settings.legal_business_name || ''} 
              onChange={(e) => updateField('legal_business_name', e.target.value)}
              className="mt-1" 
            />
          </div>
          
          <div>
            <Label htmlFor="business-structure">Business Structure</Label>
            <Select 
              value={settings.business_structure || 'single-member-llc'}
              onValueChange={(value) => updateField('business_structure', value)}
            >
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
                <Input 
                  id="prefix" 
                  value={settings.order_prefix || ''} 
                  onChange={(e) => updateField('order_prefix', e.target.value)}
                  className="mt-1" 
                />
              </div>
              <div>
                <Label htmlFor="suffix" className="text-xs text-muted-foreground">Suffix</Label>
                <Input 
                  id="suffix" 
                  value={settings.order_suffix || ''} 
                  onChange={(e) => updateField('order_suffix', e.target.value)}
                  className="mt-1" 
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Your order ID will appear as {settings.order_prefix || ''}#0001{settings.order_suffix || ''}, {settings.order_prefix || ''}#0002{settings.order_suffix || ''}, {settings.order_prefix || ''}#0003{settings.order_suffix || ''}...
            </p>
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select 
              value={settings.timezone || 'America/New_York'}
              onValueChange={(value) => updateField('timezone', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="America/Phoenix">Arizona Time</SelectItem>
                <SelectItem value="America/Anchorage">Alaska Time</SelectItem>
                <SelectItem value="Pacific/Honolulu">Hawaii Time</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
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
            <Checkbox 
              id="enable-password" 
              checked={settings.password_enabled || false}
              onCheckedChange={(checked) => updateField('password_enabled', checked)}
            />
            <Label htmlFor="enable-password" className="text-sm">Enable Password</Label>
          </div>

          {settings.password_enabled && (
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password here"
                  value={settings.password || ''}
                  onChange={(e) => updateField('password', e.target.value)}
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
          )}
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-primary">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-medium">Name</Label>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="legal-first-name" className="text-xs text-muted-foreground">Legal First Name</Label>
                <Input 
                  id="legal-first-name" 
                  value={settings.legal_first_name || ''} 
                  onChange={(e) => updateField('legal_first_name', e.target.value)}
                  className="mt-1" 
                />
              </div>
              <div>
                <Label htmlFor="legal-last-name" className="text-xs text-muted-foreground">Legal Last Name</Label>
                <Input 
                  id="legal-last-name" 
                  value={settings.legal_last_name || ''} 
                  onChange={(e) => updateField('legal_last_name', e.target.value)}
                  className="mt-1" 
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Other</Label>
            <div className="mt-2">
              <Label htmlFor="date-of-birth" className="text-xs text-muted-foreground">Date of Birth</Label>
              <Input 
                id="date-of-birth" 
                type="date"
                value={settings.date_of_birth || ''} 
                onChange={(e) => updateField('date_of_birth', e.target.value)}
                className="mt-1" 
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email-address" className="text-xs text-muted-foreground">Email Address</Label>
            <Input 
              id="email-address" 
              type="email"
              value={settings.email || ''} 
              onChange={(e) => updateField('email', e.target.value)}
              className="mt-1" 
            />
          </div>

          <div>
            <Label htmlFor="phone-number" className="text-xs text-muted-foreground">Phone Number</Label>
            <Input 
              id="phone-number" 
              type="tel"
              value={settings.phone || ''} 
              onChange={(e) => updateField('phone', e.target.value)}
              className="mt-1" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-primary">Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-medium">Registered business address</Label>
            <div className="mt-2 space-y-4">
              <div>
                <Label htmlFor="address-line-1" className="text-xs text-muted-foreground">Address line 1</Label>
                <Input 
                  id="address-line-1" 
                  value={settings.business_address_line1 || ''} 
                  onChange={(e) => updateField('business_address_line1', e.target.value)}
                  className="mt-1" 
                />
              </div>
              
              <div>
                <Label htmlFor="address-line-2" className="text-xs text-muted-foreground">Address line 2</Label>
                <Input 
                  id="address-line-2" 
                  value={settings.business_address_line2 || ''} 
                  onChange={(e) => updateField('business_address_line2', e.target.value)}
                  className="mt-1" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country" className="text-xs text-muted-foreground">Country</Label>
                  <Input 
                    id="country" 
                    value={settings.business_country || 'United States'} 
                    onChange={(e) => updateField('business_country', e.target.value)}
                    className="mt-1" 
                  />
                </div>
                <div>
                  <Label htmlFor="city" className="text-xs text-muted-foreground">City</Label>
                  <Input 
                    id="city" 
                    value={settings.business_city || ''} 
                    onChange={(e) => updateField('business_city', e.target.value)}
                    className="mt-1" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state" className="text-xs text-muted-foreground">State</Label>
                  <Input 
                    id="state" 
                    value={settings.business_state || ''} 
                    onChange={(e) => updateField('business_state', e.target.value)}
                    placeholder="State"
                    className="mt-1" 
                  />
                </div>
                <div>
                  <Label htmlFor="zip-code" className="text-xs text-muted-foreground">Zip Code</Label>
                  <Input 
                    id="zip-code" 
                    value={settings.business_zip || ''} 
                    onChange={(e) => updateField('business_zip', e.target.value)}
                    className="mt-1" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="ein" className="text-xs text-muted-foreground">Employer Identification Number (EIN)</Label>
            <Input 
              id="ein" 
              value={settings.ein || ''} 
              onChange={(e) => updateField('ein', e.target.value)}
              className="mt-1" 
            />
            <p className="text-xs text-muted-foreground mt-1">
              If you use your Social Security number for business tax purposes, you can enter that instead.
            </p>
          </div>

          <div>
            <Label htmlFor="doing-business-as" className="text-xs text-muted-foreground">Doing business as</Label>
            <Input 
              id="doing-business-as" 
              value={settings.doing_business_as || ''} 
              onChange={(e) => updateField('doing_business_as', e.target.value)}
              className="mt-1" 
            />
            <p className="text-xs text-muted-foreground mt-1">
              The operating name of your company, if it&apos;s different than the legal name.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-primary">Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="bank-account" className="text-xs text-muted-foreground">Set up US or Canadian Bank Account</Label>
            <Select 
              value={settings.bank_account_type || ''}
              onValueChange={(value) => updateField('bank_account_type', value)}
            >
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
                <Input 
                  id="routing-number" 
                  value={settings.routing_number || ''} 
                  onChange={(e) => updateField('routing_number', e.target.value)}
                  className="mt-1" 
                />
              </div>
              
              <div>
                <Label htmlFor="account-number" className="text-xs text-muted-foreground">Account number</Label>
                <Input 
                  id="account-number" 
                  type="password"
                  value={settings.account_number || ''} 
                  onChange={(e) => updateField('account_number', e.target.value)}
                  placeholder="Enter account number"
                  className="mt-1" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Account number is encrypted and not displayed for security
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Descriptors</Label>
            <div className="mt-2 space-y-4">
              <div>
                <Label htmlFor="statement-descriptor" className="text-xs text-muted-foreground">Statement descriptor</Label>
                <Input 
                  id="statement-descriptor" 
                  value={settings.statement_descriptor || ''} 
                  onChange={(e) => updateField('statement_descriptor', e.target.value)}
                  className="mt-1" 
                />
              </div>
              
              <div>
                <Label htmlFor="shortened-descriptor" className="text-xs text-muted-foreground">Shortened descriptor</Label>
                <Input 
                  id="shortened-descriptor" 
                  value={settings.shortened_descriptor || ''} 
                  onChange={(e) => updateField('shortened_descriptor', e.target.value)}
                  className="mt-1" 
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Support Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-primary">Customer Support Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-medium">Customer Support Address</Label>
            <div className="mt-2 space-y-4">
              <div>
                <Label htmlFor="support-address-line-1" className="text-xs text-muted-foreground">Address line 1</Label>
                <Input 
                  id="support-address-line-1" 
                  value={settings.support_address_line1 || ''} 
                  onChange={(e) => updateField('support_address_line1', e.target.value)}
                  className="mt-1" 
                />
              </div>
              
              <div>
                <Label htmlFor="support-address-line-2" className="text-xs text-muted-foreground">Address line 2</Label>
                <Input 
                  id="support-address-line-2" 
                  value={settings.support_address_line2 || ''} 
                  onChange={(e) => updateField('support_address_line2', e.target.value)}
                  className="mt-1" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="support-country" className="text-xs text-muted-foreground">Country</Label>
                  <Input 
                    id="support-country" 
                    value={settings.support_country || 'United States'} 
                    onChange={(e) => updateField('support_country', e.target.value)}
                    className="mt-1" 
                  />
                </div>
                <div>
                  <Label htmlFor="support-city" className="text-xs text-muted-foreground">City</Label>
                  <Input 
                    id="support-city" 
                    value={settings.support_city || ''} 
                    onChange={(e) => updateField('support_city', e.target.value)}
                    className="mt-1" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="support-state" className="text-xs text-muted-foreground">State</Label>
                  <Input 
                    id="support-state" 
                    value={settings.support_state || ''} 
                    onChange={(e) => updateField('support_state', e.target.value)}
                    placeholder="State"
                    className="mt-1" 
                  />
                </div>
                <div>
                  <Label htmlFor="support-zip-code" className="text-xs text-muted-foreground">Zip Code</Label>
                  <Input 
                    id="support-zip-code" 
                    value={settings.support_zip || ''} 
                    onChange={(e) => updateField('support_zip', e.target.value)}
                    className="mt-1" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="support-phone" className="text-xs text-muted-foreground">Customer support phone number</Label>
            <Input 
              id="support-phone" 
              type="tel"
              value={settings.support_phone || ''} 
              onChange={(e) => updateField('support_phone', e.target.value)}
              className="mt-1" 
            />
          </div>

          <div>
            <Label htmlFor="support-email" className="text-xs text-muted-foreground">Customer support email address</Label>
            <Input 
              id="support-email" 
              type="email"
              value={settings.support_email || ''} 
              onChange={(e) => updateField('support_email', e.target.value)}
              className="mt-1" 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
