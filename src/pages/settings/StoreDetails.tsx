import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { storeSettingsApi } from "@/api/storeSettingsApi"
import type { StoreSettings } from "@/types/storeSettings"
import { useToast } from "@/hooks/use-toast"

const normalizeWebsiteUrl = (value?: string) => {
  const website = value?.trim() || ''
  if (!website) return ''

  return /^[a-z][a-z\d+\-.]*:\/\//i.test(website) ? website : `https://${website}`
}

export default function StoreDetails() {
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
      const payload = {
        ...settings,
        support_website: normalizeWebsiteUrl(settings.support_website),
      }
      const updatedSettings = await storeSettingsApi.partialUpdate(settings.id, payload)
      setSettings(updatedSettings)
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

          <div>
            <Label htmlFor="support-website" className="text-xs text-muted-foreground">Website</Label>
            <Input
              id="support-website"
              type="url"
              value={settings.support_website || ''}
              onChange={(e) => updateField('support_website', e.target.value)}
              onBlur={(e) => updateField('support_website', normalizeWebsiteUrl(e.target.value))}
              placeholder="https://example.com"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
