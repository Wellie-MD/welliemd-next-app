"use client"

import { useState, useEffect, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Plus, X, Trash2 } from "lucide-react"
import axiosInstance from "@/api/axiosInstance"
import { toast } from "@/hooks/use-toast"
import Select from "react-select"
import { ProductSelectionSheet } from "@/components/coupons/ProductSelectionSheet"
import { PatientSelectionDropdown } from "@/components/coupons/PatientSelectionDropdown"

type Product = { id: string; name: string }

type CouponFormData = {
  name: string
  code: string
  expiration: "never" | "date"
  expires_at: string
  frequency_based: boolean
  type: "percent" | "fixed"
  value: number
  max_threshold: number | null
  applicable_products: string[]
  exclude_products: boolean
  usage_type: "one_time" | "first_order" | "all_orders" | "n_orders" | "first_payment"
  n_orders_count: number | null
  redemptions: "infinite" | "limited"
  max_usage: number | null
  eligible_patients: "all" | "specific"
  selected_patient_ids: string[]
  patient_emails: string
  is_active: boolean
}

const defaultFormData: CouponFormData = {
  name: "",
  code: "",
  expiration: "never",
  expires_at: "",
  frequency_based: false,
  type: "percent",
  value: 0,
  max_threshold: null,
  applicable_products: [],
  exclude_products: false,
  usage_type: "one_time",
  n_orders_count: null,
  redemptions: "infinite",
  max_usage: null,
  eligible_patients: "all",
  selected_patient_ids: [],
  patient_emails: "",
  is_active: true,
}

type Patient = { id: string; user?: { email: string }; email?: string; first_name?: string; last_name?: string }

type ProductCategory = {
  key: string
  label: string
  icon: string
  count: number
}

export default function CreateCouponPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditMode = !!id

  const [formData, setFormData] = useState<CouponFormData>(defaultFormData)
  const [products, setProducts] = useState<Product[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [productCategories, setProductCategories] = useState<{
    product_types: ProductCategory[]
    rx_types: ProductCategory[]
    categories: { id: string; name: string; count: number }[]
  }>({ product_types: [], rx_types: [], categories: [] })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Product selection sheet state
  const [productSheetOpen, setProductSheetOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<{
    type: 'all' | 'product_type' | 'rx_or_otc' | 'category'
    key?: string
    label: string
  } | undefined>(undefined)

  // Selected patient options (to show names instead of IDs)
  const [selectedPatientOptions, setSelectedPatientOptions] = useState<{ value: string; label: string }[]>([])

  // Fetch products for selection
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axiosInstance.get("/products/")
        setProducts(res.data?.results || [])
      } catch {
        setProducts([])
      }
    }
    fetchProducts()
  }, [])

  // Fetch patients for selection (only when specific patients mode)
  useEffect(() => {
    if (formData.eligible_patients !== "specific") return
    
    const fetchPatients = async () => {
      try {
        const res = await axiosInstance.get("/medical/patients/")
        const patientList = res.data?.results || res.data || []
        setPatients(patientList)
      } catch (err) {
        console.error('Failed to fetch patients:', err)
        setPatients([])
      }
    }
    fetchPatients()
  }, [formData.eligible_patients])

  // Fetch product categories for dynamic display
  useEffect(() => {
    const fetchProductCategories = async () => {
      try {
        const res = await axiosInstance.get("/products/coupon-categories/")
        setProductCategories(res.data)
      } catch (err) {
        console.error('Failed to fetch product categories:', err)
      }
    }
    fetchProductCategories()
  }, [])

  // Fetch coupon data if editing
  useEffect(() => {
    if (isEditMode && id) {
      const fetchCoupon = async () => {
        setLoading(true)
        try {
          const res = await axiosInstance.get(`/coupons/${id}/`)
          const coupon = res.data
          setFormData({
            name: coupon.name || coupon.code,
            code: coupon.code,
            expiration: coupon.expires_at ? "date" : "never",
            expires_at: coupon.expires_at || "",
            frequency_based: coupon.frequency_based || false,
            type: coupon.type,
            value: parseFloat(coupon.value) || 0,
            max_threshold: coupon.max_discount_threshold || null,
            applicable_products: coupon.applicable_products || [],
            exclude_products: coupon.exclude_products || false,
            usage_type: coupon.usage_type || "one_time",
            n_orders_count: coupon.n_orders_count || null,
            redemptions: coupon.max_usage ? "limited" : "infinite",
            max_usage: coupon.max_usage || null,
            eligible_patients: coupon.eligible_patients || "all",
            selected_patient_ids: coupon.eligible_patient_ids || [],
            patient_emails: coupon.patient_emails || "",
            is_active: coupon.is_active,
          })
        } catch (err) {
          toast({ title: "Failed to load coupon", variant: "destructive" })
        } finally {
          setLoading(false)
        }
      }
      fetchCoupon()
    }
  }, [isEditMode, id])

  const handleInputChange = (field: keyof CouponFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!formData.code.trim()) {
      toast({ title: "Code is required", variant: "destructive" })
      return
    }
    if (formData.value <= 0) {
      toast({ title: "Amount must be greater than 0", variant: "destructive" })
      return
    }
    if (formData.type === "percent" && formData.value > 100) {
      toast({ title: "Percentage discount cannot exceed 100%", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: formData.name,
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: formData.value,
        max_discount_threshold: formData.type === "fixed" ? null : formData.max_threshold,
        is_active: formData.is_active,
        expires_at: formData.expiration === "date" && formData.expires_at ? formData.expires_at : null,
        applicable_products: formData.applicable_products,
        max_usage: formData.redemptions === "limited" ? formData.max_usage : null,
        usage_type: formData.usage_type,
        eligible_patients: formData.eligible_patients,
        selected_patient_ids: formData.selected_patient_ids,
        patient_emails: formData.patient_emails,
        exclude_products: formData.exclude_products,
      }

      if (isEditMode && id) {
        await axiosInstance.put(`/coupons/${id}/`, payload)
        toast({ title: "Coupon updated successfully" })
      } else {
        await axiosInstance.post("/coupons/", payload)
        toast({ title: "Coupon created successfully" })
      }
      navigate("/dashboard/coupon-codes")
    } catch (err: any) {
      const msg = err.response?.data?.code?.[0] || err.response?.data?.detail || "Failed to save coupon"
      toast({ title: msg, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = () => {
    navigate("/dashboard/coupon-codes")
  }

  const productOptions = products.map(p => ({ value: p.id, label: p.name }))
  const selectedProducts = productOptions.filter(o => formData.applicable_products.includes(o.value))

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={handleDiscard}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold">
            {isEditMode ? "Edit coupon code" : "Create coupon code"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleDiscard} disabled={saving}>
            Discard
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Content - 2 Column Layout */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Details Section */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-700 p-6 space-y-4">
              <h2 className="text-lg font-semibold">Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                    <Input
                      placeholder="Black Friday 50%"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="bg-gray-50 dark:bg-slate-900 text-foreground placeholder:text-muted-foreground border-border"
                    />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Code <span className="text-red-500">*</span>
                  </label>
                    <Input
                      placeholder="BLF-50"
                      value={formData.code}
                      onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
                      disabled={isEditMode}
                      className="bg-gray-50 dark:bg-slate-900 text-foreground placeholder:text-muted-foreground border-border"
                    />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Expiration</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                    value={formData.expiration}
                    onChange={(e) => handleInputChange("expiration", e.target.value)}
                  >
                    <option value="never">Never</option>
                    <option value="date">Set Date</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expiration date</label>
                    <Input
                      type="datetime-local"
                      value={formData.expires_at}
                      onChange={(e) => handleInputChange("expires_at", e.target.value)}
                      disabled={formData.expiration === "never"}
                      placeholder="MM / DD / YYYY"
                      className="bg-gray-50 dark:bg-slate-900 text-foreground placeholder:text-muted-foreground border-border"
                    />
                </div>
              </div>

              {/* Discount Type & Amount */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Discount type</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      handleInputChange("type", newType);
                      if (newType === "fixed") {
                        handleInputChange("max_threshold", null);
                      }
                    }}
                  >
                    <option value="percent">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {formData.type === "percent" ? "Percent" : "Amount"} <span className="text-red-500">*</span>
                  </label>
                    <Input
                      type="number"
                      placeholder={formData.type === "percent" ? "10%" : "10$"}
                      value={formData.value || ""}
                      onChange={(e) => handleInputChange("value", parseFloat(e.target.value) || 0)}
                      className="bg-gray-50 dark:bg-slate-900 text-foreground placeholder:text-muted-foreground border-border"
                    />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max. threshold</label>
                    <Input
                      type="number"
                      placeholder="100$"
                      value={formData.max_threshold || ""}
                      onChange={(e) => handleInputChange("max_threshold", parseFloat(e.target.value) || null)}
                      disabled={formData.type === "fixed"}
                      className="bg-gray-50 dark:bg-slate-900 text-foreground placeholder:text-muted-foreground border-border"
                    />
                </div>
              </div>
            </div>

            {/* Products Application Section */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-700 p-6 space-y-4">
              <h2 className="text-lg font-semibold">Products application</h2>
              <p className="text-sm text-muted-foreground">
                {formData.applicable_products.length === 0
                  ? "No products selected (0)"
                  : `${formData.applicable_products.length} products selected`}
              </p>

              {/* Product Categories - Dynamic */}
              <div className="space-y-3">
                {/* Only show single product type (drugs), filter out bundles */}
                {productCategories.product_types
                  .filter(pt => pt.key === 'single')
                  .map((pt) => (
                  <div 
                    key={pt.key} 
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => {
                      setCategoryFilter({ type: 'product_type', key: pt.key, label: pt.label })
                      setProductSheetOpen(true)
                    }}
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs">{pt.icon}</div>
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground uppercase">Product Type</div>
                      <div className="font-medium">{pt.label}</div>
                    </div>
                    <span className="text-sm text-muted-foreground">{pt.count} products</span>
                  </div>
                ))}

                {/* Product categories from database */}
                {productCategories.categories.map((cat) => (
                  <div 
                    key={cat.id} 
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => {
                      setCategoryFilter({ type: 'category', key: cat.id, label: cat.name })
                      setProductSheetOpen(true)
                    }}
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-xs">📦</div>
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground uppercase">Category</div>
                      <div className="font-medium">{cat.name}</div>
                    </div>
                    <span className="text-sm text-muted-foreground">{cat.count} products</span>
                  </div>
                ))}
              </div>

              {/* Specific Product Selection */}
              <div className="pt-4" id="product-selection">
                <label className="block text-sm font-medium mb-2">Or select specific products:</label>
                <Select
                  isMulti
                  options={productOptions}
                  value={selectedProducts}
                  onChange={(sel) => handleInputChange("applicable_products", sel.map(s => s.value))}
                  placeholder="Select products..."
                  className="text-sm"
                  styles={{
                    control: (provided, state) => ({
                      ...provided,
                      backgroundColor: "hsl(var(--background))",
                      color: "hsl(var(--foreground))",
                      borderColor: state.isFocused ? "#0ea5e9" : "hsl(var(--border))",
                      boxShadow: state.isFocused ? "0 0 0 3px rgba(14, 165, 233, 0.1)" : provided.boxShadow,
                      "&:hover": {
                        borderColor: state.isFocused ? "#0ea5e9" : "hsl(var(--border))",
                      },
                    }),
                    menu: (provided) => ({
                      ...provided,
                      backgroundColor: "hsl(var(--popover))",
                      color: "hsl(var(--foreground))",
                      border: "1px solid hsl(var(--border))",
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      backgroundColor: state.isSelected
                        ? "hsl(var(--primary))"
                        : state.isFocused
                        ? "hsl(var(--accent))"
                        : "transparent",
                      color: state.isSelected ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                    }),
                    singleValue: (provided) => ({
                      ...provided,
                      color: "hsl(var(--foreground))",
                    }),
                    multiValue: (provided) => ({
                      ...provided,
                      backgroundColor: "hsl(var(--muted))",
                    }),
                    multiValueLabel: (provided) => ({
                      ...provided,
                      color: "hsl(var(--foreground))",
                    }),
                    placeholder: (provided) => ({
                      ...provided,
                      color: "hsl(var(--muted-foreground))",
                    }),
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Usage Section */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-700 p-6 space-y-4">
              <h2 className="text-lg font-semibold">Usage</h2>
              
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                  value={formData.usage_type}
                  onChange={(e) => handleInputChange("usage_type", e.target.value)}
                >
                  <option value="one_time">One Time</option>
                  <option value="first_order">First Order</option>
                  <option value="all_orders">All Orders (Inc. Auto Refills)</option>
                  <option value="n_orders">Nº of Orders</option>
                </select>
                {formData.usage_type === "n_orders" && (
                  <Input
                    type="number"
                    placeholder="Number of orders"
                    className="mt-2 bg-gray-50 dark:bg-slate-900 text-foreground placeholder:text-muted-foreground border-border"
                    value={formData.n_orders_count || ""}
                    onChange={(e) => handleInputChange("n_orders_count", parseInt(e.target.value) || null)}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Redemptions</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                  value={formData.redemptions}
                  onChange={(e) => handleInputChange("redemptions", e.target.value)}
                >
                  <option value="infinite">Infinite</option>
                  <option value="limited">Limited</option>
                </select>
                {formData.redemptions === "infinite" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    The coupon can be redeemed infinitely.
                  </p>
                )}
                {formData.redemptions === "limited" && (
                  <Input
                    type="number"
                    placeholder="Max redemptions"
                    className="mt-2 bg-gray-50 dark:bg-slate-900 text-foreground placeholder:text-muted-foreground border-border"
                    value={formData.max_usage || ""}
                    onChange={(e) => handleInputChange("max_usage", parseInt(e.target.value) || null)}
                  />
                )}
              </div>
            </div>

            {/* Eligible Patients Section */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-700 p-6 space-y-4">
              <h2 className="text-lg font-semibold">Eligible patients</h2>
              
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="eligible_patients"
                    checked={formData.eligible_patients === "all"}
                    onChange={() => handleInputChange("eligible_patients", "all")}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">All patients</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="eligible_patients"
                    checked={formData.eligible_patients === "specific"}
                    onChange={() => handleInputChange("eligible_patients", "specific")}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">Specific patients</span>
                </label>
              </div>

              {/* Patient Selection - shown when specific is selected */}
              {formData.eligible_patients === "specific" && (
                <div className="space-y-4 pt-2">
                  {/* Auto-add patients by search */}
                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium text-sm">Auto-add patients by search</div>
                        <div className="text-xs text-muted-foreground">{selectedPatientOptions.length} patients selected</div>
                      </div>
                    </div>
                    <PatientSelectionDropdown
                      selectedPatients={selectedPatientOptions}
                      onSelectionChange={(patients) => {
                        setSelectedPatientOptions(patients)
                        handleInputChange("selected_patient_ids", patients.map((s) => s.value))
                      }}
                      placeholder="Search patients by name or email..."
                    />
                  </div>

                  {/* Manually add patient emails */}
                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:bg-slate-800">
                    <div className="mb-2">
                      <div className="font-medium text-sm">Manually add patient emails</div>
                      <div className="text-xs text-muted-foreground">{formData.patient_emails.split('\n').filter(e => e.trim()).length} emails</div>
                    </div>
                    <textarea
                      className="w-full border rounded-md px-3 py-2 text-sm min-h-[100px]"
                      placeholder="customer-one@email.com&#10;customer-two@email.com&#10;customer-three@email.com"
                      value={formData.patient_emails}
                      onChange={(e) => handleInputChange("patient_emails", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Enter one email per line.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Status Section */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-700 p-6 space-y-4">
              <h2 className="text-lg font-semibold">Status</h2>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange("is_active", e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Active
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Inactive coupons cannot be used by customers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Product Selection Sheet */}
      <ProductSelectionSheet
        open={productSheetOpen}
        onOpenChange={setProductSheetOpen}
        selectedProductIds={formData.applicable_products}
        onSelectionChange={(productIds) => handleInputChange("applicable_products", productIds)}
        categoryFilter={categoryFilter}
      />
    </>
  )
}
