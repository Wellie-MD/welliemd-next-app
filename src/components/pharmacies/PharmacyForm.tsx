import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Building, Users, MapPin, Plug, Briefcase, Globe, UserCog } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { createPharmacy, updatePharmacy, getPharmacy, type CreatePharmacyData, type Pharmacy } from '@/api/pharmacy'

interface PharmacyFormProps {
  pharmacyId?: string // If provided, this is edit mode
  onSuccess: () => void
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

const CARRIER_OPTIONS = [
  'UPS', 'FedEx', 'USPS', 'DHL', 'OnTrac', 'LSO'
]

export default function PharmacyForm({ pharmacyId, onSuccess }: PharmacyFormProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(!!pharmacyId)
  const [serviceStates, setServiceStates] = useState<string[]>([])
  const [excludedStates, setExcludedStates] = useState<string[]>([])
  const [allowedIPs, setAllowedIPs] = useState<string[]>([])
  const [tenantVisibility, setTenantVisibility] = useState<string[]>([])
  const [preferredCarriers, setPreferredCarriers] = useState<string[]>([])
  const [newIP, setNewIP] = useState('')
  const [newTenant, setNewTenant] = useState('')
  
  const isEditMode = !!pharmacyId
  
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<CreatePharmacyData>({
    defaultValues: {
      country: 'US',
      environment: 'sandbox',
      api_version: 'v1',
      is_active: true,
      is_billable: true,
      auto_charge_fees: false,
      sync_to_tenants: true,
      custom_packaging: false,
      custom_labeling: false,
      business_days_only: true,
      max_daily_orders: 800,
      sla_response_time_hours: 3,
      sla_shipping_days: 2,
      processing_cutoff_time: '15:30:00'
    }
  })

  const watchedValues = watch()

  // Load pharmacy data for editing
  useEffect(() => {
    if (isEditMode && pharmacyId) {
      loadPharmacyData()
    }
  }, [pharmacyId, isEditMode])

  const loadPharmacyData = async () => {
    try {
      setLoadingData(true)
      const pharmacy = await getPharmacy(pharmacyId!)
      
      // Populate form with existing data
      const formData: CreatePharmacyData = {
        name: pharmacy.name,
        display_name: pharmacy.display_name,
        abbreviation: pharmacy.abbreviation,
        provider_type: pharmacy.provider_type,
        environment: pharmacy.environment,
        primary_contact_name: pharmacy.primary_contact_name,
        primary_contact_email: pharmacy.primary_contact_email,
        is_active: pharmacy.is_active,
        is_billable: pharmacy.is_billable,
        sync_to_tenants: pharmacy.sync_to_tenants,
        max_daily_orders: pharmacy.max_daily_orders || 800,
        sla_shipping_days: pharmacy.sla_shipping_days
      }
      
      reset(formData)
      
    } catch (error: any) {
      console.error('Failed to load pharmacy data:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to load pharmacy data',
        variant: 'destructive'
      })
    } finally {
      setLoadingData(false)
    }
  }

  const onSubmit = async (data: CreatePharmacyData) => {
    try {
      setLoading(true)
      
      const payload: CreatePharmacyData = {
        ...data,
        service_states: serviceStates,
        excluded_states: excludedStates,
        allowed_source_ips: allowedIPs,
        tenant_visibility: tenantVisibility,
        preferred_carriers: preferredCarriers
      }

      if (isEditMode) {
        await updatePharmacy(pharmacyId!, payload)
        toast({
          title: 'Success',
          description: 'Pharmacy updated successfully'
        })
      } else {
        await createPharmacy(payload)
        toast({
          title: 'Success',
          description: 'Pharmacy created successfully'
        })
      }
      
      onSuccess()
    } catch (error: any) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} pharmacy:`, error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || error.message || `Failed to ${isEditMode ? 'update' : 'create'} pharmacy`,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper functions for array management
  const addServiceState = (state: string) => {
    if (!serviceStates.includes(state) && !excludedStates.includes(state)) {
      setServiceStates([...serviceStates, state])
    }
  }

  const removeServiceState = (state: string) => {
    setServiceStates(serviceStates.filter(s => s !== state))
  }

  const addExcludedState = (state: string) => {
    if (!excludedStates.includes(state) && !serviceStates.includes(state)) {
      setExcludedStates([...excludedStates, state])
    }
  }

  const removeExcludedState = (state: string) => {
    setExcludedStates(excludedStates.filter(s => s !== state))
  }

  const addIP = () => {
    if (newIP && !allowedIPs.includes(newIP)) {
      setAllowedIPs([...allowedIPs, newIP])
      setNewIP('')
    }
  }

  const removeIP = (ip: string) => {
    setAllowedIPs(allowedIPs.filter(i => i !== ip))
  }

  const addTenant = () => {
    if (newTenant && !tenantVisibility.includes(newTenant)) {
      setTenantVisibility([...tenantVisibility, newTenant])
      setNewTenant('')
    }
  }

  const removeTenant = (tenant: string) => {
    setTenantVisibility(tenantVisibility.filter(t => t !== tenant))
  }

  const addCarrier = (carrier: string) => {
    if (!preferredCarriers.includes(carrier)) {
      setPreferredCarriers([...preferredCarriers, carrier])
    }
  }

  const removeCarrier = (carrier: string) => {
    setPreferredCarriers(preferredCarriers.filter(c => c !== carrier))
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-700 flex items-center gap-2">
            <Building className="w-5 h-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Pharmacy Name *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Pharmacy name is required' })}
                placeholder="GreenLife Pharmacy"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="abbreviation">Abbreviation *</Label>
              <Input
                id="abbreviation"
                {...register('abbreviation', { 
                  required: 'Abbreviation is required',
                  pattern: { value: /^[A-Z0-9]{2,10}$/, message: 'Must be 2-10 uppercase letters/numbers' }
                })}
                placeholder="GLP"
                className="uppercase"
              />
              {errors.abbreviation && <p className="text-sm text-red-500">{errors.abbreviation.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              {...register('display_name')}
              placeholder="GreenLife Central Pharmacy"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider_type">Provider Type *</Label>
              <Select onValueChange={(value) => setValue('provider_type', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pharmacy_hub">Pharmacy Hub</SelectItem>
                  <SelectItem value="dispensepro">DispensePro</SelectItem>
                  <SelectItem value="custom">Custom Integration</SelectItem>
                </SelectContent>
              </Select>
              {errors.provider_type && <p className="text-sm text-red-500">{errors.provider_type.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment">Environment *</Label>
              <Select onValueChange={(value) => setValue('environment', value as any)} defaultValue="sandbox">
                <SelectTrigger>
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox/Test</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-700 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primary_contact_name">Primary Contact Name *</Label>
            <Input
              id="primary_contact_name"
              {...register('primary_contact_name', { required: 'Contact name is required' })}
              placeholder="Sarah Johnson"
            />
            {errors.primary_contact_name && <p className="text-sm text-red-500">{errors.primary_contact_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_contact_email">Email *</Label>
              <Input
                id="primary_contact_email"
                type="email"
                {...register('primary_contact_email', { 
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' }
                })}
                placeholder="sarah@greenlifepharmacy.com"
              />
              {errors.primary_contact_email && <p className="text-sm text-red-500">{errors.primary_contact_email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary_contact_phone">Phone *</Label>
              <Input
                id="primary_contact_phone"
                {...register('primary_contact_phone', { required: 'Phone is required' })}
                placeholder="+14155550123"
              />
              {errors.primary_contact_phone && <p className="text-sm text-red-500">{errors.primary_contact_phone.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-700 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Address Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address_line_1">Address Line 1 *</Label>
            <Input
              id="address_line_1"
              {...register('address_line_1', { required: 'Address is required' })}
              placeholder="789 Wellness Street"
            />
            {errors.address_line_1 && <p className="text-sm text-red-500">{errors.address_line_1.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line_2">Address Line 2</Label>
            <Input
              id="address_line_2"
              {...register('address_line_2')}
              placeholder="Suite 100"
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                {...register('city', { required: 'City is required' })}
                placeholder="Austin"
              />
              {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Select onValueChange={(value) => setValue('state', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && <p className="text-sm text-red-500">{errors.state.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip_code">ZIP Code *</Label>
              <Input
                id="zip_code"
                {...register('zip_code', { 
                  required: 'ZIP code is required',
                  pattern: { value: /^\d{5}(-\d{4})?$/, message: 'Invalid ZIP format' }
                })}
                placeholder="73301"
              />
              {errors.zip_code && <p className="text-sm text-red-500">{errors.zip_code.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                {...register('country')}
                value="US"
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-700 flex items-center gap-2">
            <Plug className="w-5 h-5" />
            API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="api_url">API URL</Label>
              <Input
                id="api_url"
                {...register('api_url')}
                placeholder="https://api.greenlifepharmacy.com/v1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_version">API Version</Label>
              <Input
                id="api_version"
                {...register('api_version')}
                placeholder="v1"
                defaultValue="v1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="practice_id">Practice ID</Label>
              <Input
                id="practice_id"
                {...register('practice_id')}
                placeholder="GLP456"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_abbreviation">Client Abbreviation</Label>
              <Input
                id="client_abbreviation"
                {...register('client_abbreviation')}
                placeholder="GLP"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook_url">Webhook URL</Label>
            <Input
              id="webhook_url"
              {...register('webhook_url')}
              placeholder="https://integrations.greenlifepharmacy.com/webhooks/orders"
            />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="password"
                {...register('api_key')}
                placeholder="Enter API key"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_secret">API Secret</Label>
              <Input
                id="api_secret"
                type="password"
                {...register('api_secret')}
                placeholder="Enter API secret"
              />
            </div>
          </div>

          {/* Allowed Source IPs */}
          <div className="space-y-2">
            <Label>Allowed Source IPs</Label>
            <div className="flex gap-2">
              <Input
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
                placeholder="203.0.113.10"
                className="flex-1"
              />
              <Button type="button" onClick={addIP} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {allowedIPs.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {allowedIPs.map(ip => (
                  <Badge key={ip} variant="secondary" className="gap-1">
                    {ip}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => removeIP(ip)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-700 flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Business Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active</Label>
                <p className="text-sm text-gray-500">Enable this pharmacy for orders</p>
              </div>
              <Switch
                id="is_active"
                checked={watchedValues.is_active}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_billable">Billable</Label>
                <p className="text-sm text-gray-500">Charge fees for orders</p>
              </div>
              <Switch
                id="is_billable"
                checked={watchedValues.is_billable}
                onCheckedChange={(checked) => setValue('is_billable', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto_charge_fees">Auto Charge Fees</Label>
                <p className="text-sm text-gray-500">Automatically charge fees</p>
              </div>
              <Switch
                id="auto_charge_fees"
                checked={watchedValues.auto_charge_fees}
                onCheckedChange={(checked) => setValue('auto_charge_fees', checked)}
                disabled={!watchedValues.is_billable}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sync_to_tenants">Sync to All Tenants</Label>
                <p className="text-sm text-gray-500">Available to all tenants</p>
              </div>
              <Switch
                id="sync_to_tenants"
                checked={watchedValues.sync_to_tenants}
                onCheckedChange={(checked) => setValue('sync_to_tenants', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="custom_packaging">Custom Packaging</Label>
                <p className="text-sm text-gray-500">Supports custom packaging</p>
              </div>
              <Switch
                id="custom_packaging"
                checked={watchedValues.custom_packaging}
                onCheckedChange={(checked) => setValue('custom_packaging', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="custom_labeling">Custom Labeling</Label>
                <p className="text-sm text-gray-500">Supports custom labeling</p>
              </div>
              <Switch
                id="custom_labeling"
                checked={watchedValues.custom_labeling}
                onCheckedChange={(checked) => setValue('custom_labeling', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="business_days_only">Business Days Only</Label>
                <p className="text-sm text-gray-500">Process orders on business days only</p>
              </div>
              <Switch
                id="business_days_only"
                checked={watchedValues.business_days_only}
                onCheckedChange={(checked) => setValue('business_days_only', checked)}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_daily_orders">Max Daily Orders</Label>
              <Input
                id="max_daily_orders"
                type="number"
                {...register('max_daily_orders', { min: 1 })}
                placeholder="800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="processing_cutoff_time">Processing Cutoff Time</Label>
              <Input
                id="processing_cutoff_time"
                type="time"
                {...register('processing_cutoff_time')}
                placeholder="15:30:00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sla_shipping_days">Shipping Days</Label>
              <Input
                id="sla_shipping_days"
                type="number"
                {...register('sla_shipping_days', { min: 1 })}
                placeholder="2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sla_response_time_hours">Response Time (Hours)</Label>
            <Input
              id="sla_response_time_hours"
              type="number"
              {...register('sla_response_time_hours', { min: 1 })}
              placeholder="3"
            />
          </div>
        </CardContent>
      </Card>

      {/* Service Area & Shipping */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-700 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Service Area & Shipping
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Service States</Label>
            <p className="text-sm text-gray-500">States where this pharmacy can provide services. Leave empty for all states.</p>
            
            <Select onValueChange={addServiceState}>
              <SelectTrigger>
                <SelectValue placeholder="Add service state" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.filter(state => !serviceStates.includes(state) && !excludedStates.includes(state)).map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {serviceStates.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {serviceStates.map(state => (
                  <Badge key={state} variant="secondary" className="gap-1">
                    {state}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => removeServiceState(state)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Excluded States</Label>
            <p className="text-sm text-gray-500">States where this pharmacy cannot provide services.</p>
            
            <Select onValueChange={addExcludedState}>
              <SelectTrigger>
                <SelectValue placeholder="Add excluded state" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.filter(state => !excludedStates.includes(state) && !serviceStates.includes(state)).map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {excludedStates.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {excludedStates.map(state => (
                  <Badge key={state} variant="destructive" className="gap-1">
                    {state}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => removeExcludedState(state)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Preferred Carriers</Label>
            <Select onValueChange={addCarrier}>
              <SelectTrigger>
                <SelectValue placeholder="Add preferred carrier" />
              </SelectTrigger>
              <SelectContent>
                {CARRIER_OPTIONS.filter(carrier => !preferredCarriers.includes(carrier)).map(carrier => (
                  <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {preferredCarriers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {preferredCarriers.map(carrier => (
                  <Badge key={carrier} variant="outline" className="gap-1">
                    {carrier}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => removeCarrier(carrier)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tenant Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-700 flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            Tenant Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tenant Visibility</Label>
            <p className="text-sm text-gray-500">Specific tenants that can access this pharmacy (if not synced to all).</p>
            <div className="flex gap-2">
              <Input
                value={newTenant}
                onChange={(e) => setNewTenant(e.target.value)}
                placeholder="tenant5"
                className="flex-1"
              />
              <Button type="button" onClick={addTenant} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tenantVisibility.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tenantVisibility.map(tenant => (
                  <Badge key={tenant} variant="outline" className="gap-1">
                    {tenant}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => removeTenant(tenant)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4 pt-4">
        <Button type="submit" disabled={loading} size="lg">
          {loading 
            ? (isEditMode ? 'Updating...' : 'Creating...') 
            : (isEditMode ? 'Update Pharmacy' : 'Create Pharmacy')
          }
        </Button>
      </div>
    </form>
  )
}
