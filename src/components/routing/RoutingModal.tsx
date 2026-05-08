import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, Plus, Trash2 } from 'lucide-react'
import axiosInstance from '@/api/axiosInstance'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'

// US States list
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'PR', name: 'Puerto Rico' },
]

interface Match {
  id: string
  states: string[]
  stateCondition: 'in' | 'not_in'
  pharmacy_id: string
  priority: number
}

interface ElseCondition {
  pharmacy_id: string
  priority: number
}

interface RoutingModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: any // Added initialData prop
}

export function RoutingModal({ open, onClose, onSuccess, initialData }: RoutingModalProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [pharmacies, setPharmacies] = useState<any[]>([])
  const [globalStates, setGlobalStates] = useState<string[]>([])
  const [stateCondition, setStateCondition] = useState<'in' | 'not_in'>('in')
  const [matches, setMatches] = useState<Match[]>([])
  const [elseCondition, setElseCondition] = useState<ElseCondition | null>(null)
  const [loading, setLoading] = useState(false)
  const [servableStates, setServableStates] = useState<string[]>([])
  const [loadingStates, setLoadingStates] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchCategories()
      fetchPharmacies()
      fetchServableStates()
      
      // Pre-fill data if editing
      if (initialData) {
        setName(initialData.name || '')
        setCategory(initialData.category_group || '')
        
        // Transform matches from backend format
        if (initialData.matches && Array.isArray(initialData.matches)) {
          const transformedMatches = initialData.matches.map((m: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            states: m.conditions?.state || [],
            stateCondition: 'in', // Backend currently only supports 'in' implicitly
            pharmacy_id: m.pharmacy_id?.toString() || '',
            priority: m.priority || 0
          }))
          setMatches(transformedMatches)
          
          // Populate global states from first match if available (assuming simplified UI logic)
          // In a complex scenario, we might need to handle this differently
          if (transformedMatches.length > 0) {
             setGlobalStates(transformedMatches[0].states)
          }
        }
        
        // Transform else match
        if (initialData.else_match) {
          setElseCondition({
            pharmacy_id: initialData.else_match.pharmacy_id?.toString() || '',
            priority: initialData.else_match.priority || 0
          })
        }
      } else {
        // Reset form if creating new
        setName('')
        setCategory('')
        setGlobalStates([])
        setMatches([])
        setElseCondition(null)
      }
    }
  }, [open, initialData])

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get('/products/medications/')
      setCategories(response.data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive'
      })
    }
  }

  const fetchPharmacies = async () => {
    try {
      const response = await axiosInstance.get('/medical/pharmacies/')
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        setPharmacies(response.data)
      } else if (response.data.results && Array.isArray(response.data.results)) {
        setPharmacies(response.data.results)
      } else if (response.data.pharmacies && Array.isArray(response.data.pharmacies)) {
        setPharmacies(response.data.pharmacies)
      } else {
        setPharmacies([])
      }
    } catch (error) {
      console.error('Error fetching pharmacies:', error)
      setPharmacies([])
      toast({
        title: 'Error',
        description: 'Failed to load pharmacies',
        variant: 'destructive'
      })
    }
  }

  const fetchServableStates = async () => {
    try {
      setLoadingStates(true)
      console.log('Fetching servable states...');
      // Note: baseURL already has trailing /api/v1/, so don't use leading slash
      const response = await axiosInstance.get('routing-configurations/available-states/')
      console.log('Servable states response:', response.data);
      const servable = response.data.servable_states || [];
      console.log('Setting servable states:', servable);
      setServableStates(servable)
    } catch (error) {
      console.error('Error fetching servable states:', error)
      // Do NOT fallback to all states - leave servableStates empty
      // This will cause all states to appear as unservable
      toast({
        title: 'Warning',
        description: 'Could not load pharmacy coverage. Please refresh the page.',
        variant: 'destructive'
      })
    } finally {
      setLoadingStates(false)
    }
  }

  const toggleGlobalState = (stateCode: string) => {
    setGlobalStates((prev) => {
      const isSelected = prev.includes(stateCode)
      const newStates = isSelected 
        ? prev.filter(s => s !== stateCode)
        : [...prev, stateCode]
      
      // Update all matches to sync with global states
      setMatches(matches.map(m => ({ ...m, states: newStates })))
      return newStates
    })
  }

  const selectAllStates = () => {
    // Only select states that are servable
    const selectableCodes = servableStates.length > 0 
      ? servableStates 
      : US_STATES.map(s => s.code)
    setGlobalStates(selectableCodes)
    setMatches(matches.map(m => ({ ...m, states: selectableCodes })))
  }

  const clearAllStates = () => {
    setGlobalStates([])
    setMatches(matches.map(m => ({ ...m, states: [] })))
  }

  const addMatch = () => {
    const newMatch: Match = {
      id: Math.random().toString(36).substr(2, 9),
      states: [...globalStates],
      stateCondition: stateCondition,
      pharmacy_id: '',
      priority: matches.length + 1
    }
    setMatches([...matches, newMatch])
  }

  const removeMatch = (id: string) => {
    setMatches(matches.filter(m => m.id !== id))
  }

  const updateMatch = (id: string, field: keyof Match, value: any) => {
    setMatches(matches.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  // Helper to check if pharmacy serves the selected states
  const getStateMismatches = (pharmacyId: string, selectedStates: string[]): string[] => {
    if (!pharmacyId || selectedStates.length === 0) return [];
    const pharmacy = pharmacies.find(p => p.id.toString() === pharmacyId);
    if (!pharmacy) return [];
    const serviceStates = pharmacy.service_states || [];
    // Empty service_states means serves all states
    if (serviceStates.length === 0) return [];
    return selectedStates.filter(s => !serviceStates.includes(s));
  }

  // Check if ANY pharmacy serves the selected states (uses backend data)
  const getUnservableStates = (selectedStates: string[]): string[] => {
    if (selectedStates.length === 0 || servableStates.length === 0) return [];
    return selectedStates.filter(s => !servableStates.includes(s));
  };

  const addElseCondition = () => {
    setElseCondition({
      pharmacy_id: '',
      priority: matches.length + 1
    })
  }

  const handleSave = async () => {
    try {
      setLoading(true)

      // Validate basic fields
      if (!name || !category) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in Name and Category',
          variant: 'destructive'
        })
        setLoading(false)
        return
      }

      // Check if any states are completely unservable
      if (globalStates.length > 0) {
        const unservableStates = getUnservableStates(globalStates);
        if (unservableStates.length > 0) {
          toast({
            title: "Configuration Error",
            description: `None of your pharmacies serve ${unservableStates.join(", ")}. Please update pharmacy service states or remove these states from the routing rule.`,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // Validate matches
      for (const match of matches) {
        if (!match.pharmacy_id) {
          toast({
            title: 'Validation Error',
            description: 'Please select pharmacy for all matches',
            variant: 'destructive'
          })
          setLoading(false)
          return
        }
        if (match.priority <= 0) {
          toast({
            title: 'Validation Error',
            description: 'Priority must be greater than 0',
            variant: 'destructive'
          })
          setLoading(false)
          return
        }
      }

      // Build matches payload
      // Ensure states are synced with global states for this UI implementation
      const matchesPayload = matches.map(m => ({
        conditions: {
          state: globalStates.length > 0 ? globalStates : m.states
        },
        pharmacy_id: parseInt(m.pharmacy_id),
        priority: m.priority
      }))

      // Build else match payload
      const elseMatchPayload = elseCondition ? {
        pharmacy_id: parseInt(elseCondition.pharmacy_id),
        priority: elseCondition.priority
      } : null

      const payload = {
        name,
        category_group: category,
        matches: matchesPayload,
        else_match: elseMatchPayload
      }

      if (initialData) {
        // Update existing
        await axiosInstance.put(`/routing-configurations/${initialData.id}/`, payload)
        toast({
          title: 'Success',
          description: 'Routing configuration updated successfully'
        })
      } else {
        // Create new
        await axiosInstance.post('/routing-configurations/', payload)
        toast({
          title: 'Success',
          description: 'Routing configuration created successfully'
        })
      }

      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error('Error saving routing config:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to save routing configuration',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setName('')
    setCategory('')
    setGlobalStates([])
    setMatches([])
    setElseCondition(null)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 dark:text-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 z-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{initialData ? 'Edit Routing Config' : 'New Routing Config'}</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter configuration name"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* State Selection */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium text-base">If</span>
                <span className="font-medium text-base">State</span>
                <Select value={stateCondition} onValueChange={(value: 'in' | 'not_in') => setStateCondition(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">In</SelectItem>
                    <SelectItem value="not_in">Not In</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllStates}
                  className="text-xs h-8 bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 dark:bg-sky-900 dark:text-sky-200 dark:border-sky-700 dark:hover:bg-sky-800"
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearAllStates}
                  className="text-xs h-8 dark:text-gray-200"
                >
                  Clear All
                </Button>
              </div>
            </div>

            {/* Global unservable states warning */}
            {globalStates.length > 0 && (() => {
              const unservable = getUnservableStates(globalStates);
              if (unservable.length === 0) return null;
              
              return (
                <div className="bg-red-50 border border-red-200 rounded p-3 dark:bg-red-900/30 dark:border-red-700">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>⚠️ Configuration Error:</strong> None of your pharmacies serve{" "}
                    <strong>{unservable.join(", ")}</strong>. 
                    You must update pharmacy service states before saving this rule.
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Go to Admin Portal → Pharmacies → Edit pharmacy → Service States
                  </p>
                </div>
              );
            })()}


            <div className="border rounded-lg p-4 bg-gray-50/50 dark:bg-gray-800/50 dark:border-gray-700">
              {loadingStates ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading pharmacy coverage...
                </div>
              ) : (
                <>
                  {/* Info about unservable states */}
                  {servableStates.length > 0 && servableStates.length < US_STATES.length && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3 dark:bg-blue-900/30 dark:border-blue-700">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>ℹ️ Note:</strong> {US_STATES.length - servableStates.length} states 
                        are disabled because no pharmacy serves them. 
                        Contact admin to add pharmacy coverage.
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1">
                    {US_STATES.map((state) => {
                      const isServable = servableStates.includes(state.code);
                      const isSelected = globalStates.includes(state.code);
                      
                      return (
                        <button
                          key={state.code}
                          type="button"
                          onClick={() => isServable && toggleGlobalState(state.code)}
                          disabled={!isServable}
                          title={
                            isServable 
                              ? state.name 
                              : `${state.name} - No pharmacy serves this state`
                          }
                          className={`
                            flex items-center justify-center px-1 py-1.5 rounded text-xs 
                            transition border
                            ${isSelected 
                              ? 'bg-sky-500 text-white border-sky-500 font-medium' 
                              : isServable
                                ? 'bg-white text-gray-700 border-gray-300 hover:border-sky-300 shadow-sm dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:border-sky-400'
                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50 line-through dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'
                            }
                          `}
                        >
                          {state.code}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground italic">
                      {globalStates.length === 0 
                        ? "No states selected — rule will apply to ALL states." 
                        : `${globalStates.length} state${globalStates.length !== 1 ? 's' : ''} selected.`}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Matches Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Matches</Label>
            
            {matches.map((match) => (
              <div key={match.id} className="border rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                {/* Pharmacy and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">
                      Pharmacy <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={match.pharmacy_id}
                      onValueChange={(value) => updateMatch(match.id, 'pharmacy_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Pharmacy" />
                      </SelectTrigger>
                      <SelectContent>
                        {pharmacies.map((pharmacy) => (
                          <SelectItem key={pharmacy.id} value={pharmacy.id.toString()}>
                            {pharmacy.store_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!match.pharmacy_id && (
                      <p className="text-xs text-red-500">Please select a pharmacy</p>
                    )}
                    {/* State mismatch warning */}
                    {match.pharmacy_id && globalStates.length > 0 && (() => {
                      const mismatches = getStateMismatches(match.pharmacy_id, globalStates);
                      if (mismatches.length === 0) return null;
                      const pharmacy = pharmacies.find(p => p.id.toString() === match.pharmacy_id);
                      return (
                        <div className="bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                          <p className="text-xs text-amber-800">
                            ⚠️ <strong>{pharmacy?.store_name}</strong> does not serve {mismatches.join(', ')}.
                            Patients from these states will be routed to another pharmacy.
                          </p>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">
                      Priority <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={match.priority}
                      onChange={(e) => updateMatch(match.id, 'priority', parseInt(e.target.value) || 0)}
                      className={match.priority <= 0 ? 'border-red-500' : ''}
                    />
                    {match.priority <= 0 && (
                      <p className="text-xs text-red-500">Priority must be greater than 0</p>
                    )}
                  </div>
                </div>

                {/* Remove Match Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => removeMatch(match.id)}
                    className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addMatch}
              className="w-full border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Match
            </Button>
          </div>

          {/* Else Condition */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Else</Label>
            
            {elseCondition ? (
              <div className="border rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">
                      Pharmacy <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={elseCondition.pharmacy_id}
                      onValueChange={(value) => setElseCondition({ ...elseCondition, pharmacy_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Pharmacy" />
                      </SelectTrigger>
                      <SelectContent>
                        {pharmacies.map((pharmacy) => (
                          <SelectItem key={pharmacy.id} value={pharmacy.id.toString()}>
                            {pharmacy.store_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">
                      Priority <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={elseCondition.priority}
                      onChange={(e) => setElseCondition({ ...elseCondition, priority: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={addElseCondition}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Condition
              </Button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t sticky bottom-0 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}
