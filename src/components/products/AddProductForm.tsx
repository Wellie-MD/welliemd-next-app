"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Product, productApi } from "@/api/products"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

type ProductFormValues = {
  // Client-editable fields
  description?: string
  application_directions?: string
  learn_more?: string
  product_image?: File | null
  safety_information?: string
  side_effects?: string
  quantity?: string
  
  // Client-editable pricing fields
  base_price?: string
  cost_to_client?: string
  shipping_cost_to_client?: string
  shipping_fee_patient?: string
  
  // Read-only fields (displayed but not editable)
  name: string
  manufacturer_name?: string
  purchase_type: string
  treatment: string
  rx_or_otc: string
  dose?: string
  refills: number
  rx_quantity: string
  rx_drug_form?: string
  ndc_number?: string
  product_type: string
  cost_to_welliemd?: string
  shipping_cost_to_welliemd?: string
}

export default function AddProductForm({
  open,
  onOpenChange,
  onSuccess,
  product,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess?: () => void
  product?: Product | null
}) {
  const { register, handleSubmit, reset, setValue } = useForm<ProductFormValues>()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Load product data for editing
  useEffect(() => {
    if (product) {
      reset({
        // Client-editable fields
        description: product.description ?? "",
        application_directions: product.application_directions ?? "",
        learn_more: product.learn_more ?? "",
        safety_information: product.safety_information ?? "",
        side_effects: product.side_effects ?? "",
        quantity: product.quantity ?? "1",
        
        // Client-editable pricing fields
        base_price: product.base_price ?? "0.00",
        cost_to_client: product.cost_to_client ?? "",
        shipping_cost_to_client: product.shipping_cost_to_client ?? "0.00",
        shipping_fee_patient: product.shipping_fee_patient ?? "0.00",
        
        // Read-only fields (for display)
        name: product.name,
        manufacturer_name: product.manufacturer_name ?? "",
        purchase_type: product.purchase_type,
        treatment: product.treatment,
        rx_or_otc: product.rx_or_otc,
        dose: product.dose ?? "",
        refills: product.refills,
        rx_quantity: product.rx_quantity,
        rx_drug_form: product.rx_drug_form ?? "",
        ndc_number: product.ndc_number ?? "",
        product_type: product.product_type,
        cost_to_welliemd: product.cost_to_welliemd ?? "",
        shipping_cost_to_welliemd: product.shipping_cost_to_welliemd ?? "0.00",
      })
    }
  }, [product, reset])

  const onSubmit = async (data: ProductFormValues) => {
    if (!product) return

    try {
      setLoading(true)
      
      // Build FormData with only client-editable fields
      const fd = new FormData()
      
      // Only include client-editable fields
      if (data.description !== undefined) fd.append("description", data.description)
      if (data.application_directions !== undefined) fd.append("application_directions", data.application_directions)
      if (data.learn_more !== undefined) fd.append("learn_more", data.learn_more)
      if (data.safety_information !== undefined) fd.append("safety_information", data.safety_information)
      if (data.side_effects !== undefined) fd.append("side_effects", data.side_effects)
      if (data.quantity !== undefined) fd.append("quantity", data.quantity)
      
      // Client-editable pricing fields
      if (data.base_price !== undefined) fd.append("base_price", data.base_price)
      if (data.cost_to_client !== undefined) fd.append("cost_to_client", data.cost_to_client)
      if (data.shipping_cost_to_client !== undefined) fd.append("shipping_cost_to_client", data.shipping_cost_to_client)
      if (data.shipping_fee_patient !== undefined) fd.append("shipping_fee_patient", data.shipping_fee_patient)
      
      // Handle image upload
      if (data.product_image instanceof File) {
        fd.append("product_image", data.product_image)
      }

      await productApi.updateProduct(product.id, Object.fromEntries(fd))
      
      toast({
        title: "Success",
        description: "Product updated successfully",
      })
      
      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className="hidden" />
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>Edit Product: {product?.name ?? ""}</DialogTitle>
          <DialogDescription>
            Fields marked as read-only are managed by the admin and cannot be edited.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable body - hide scrollbar */}
        <form onSubmit={handleSubmit(onSubmit)} className="max-h-[70vh] overflow-y-auto pr-2 space-y-6 scrollbar-hide">
          {/* Read-only Product Information */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Product Information (Read-only)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Product Name</label>
                <input 
                  {...register("name")} 
                  disabled 
                  className="border px-3 py-2 rounded w-full bg-muted text-muted-foreground cursor-not-allowed mt-1" 
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Product Type</label>
                <input 
                  {...register("product_type")} 
                  disabled 
                  className="border px-3 py-2 rounded w-full bg-muted text-muted-foreground cursor-not-allowed mt-1" 
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Treatment</label>
                <input 
                  {...register("treatment")} 
                  disabled 
                  className="border px-3 py-2 rounded w-full bg-muted text-muted-foreground cursor-not-allowed mt-1" 
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Purchase Type</label>
                <input 
                  {...register("purchase_type")} 
                  disabled 
                  className="border px-3 py-2 rounded w-full bg-muted text-muted-foreground cursor-not-allowed mt-1" 
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">RX/OTC</label>
                <input 
                  {...register("rx_or_otc")} 
                  disabled 
                  className="border px-3 py-2 rounded w-full bg-muted text-muted-foreground cursor-not-allowed mt-1" 
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Manufacturer</label>
                <input 
                  {...register("manufacturer_name")} 
                  disabled 
                  className="border px-3 py-2 rounded w-full bg-muted text-muted-foreground cursor-not-allowed mt-1" 
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">NDC Number</label>
                <input 
                  {...register("ndc_number")} 
                  disabled 
                  className="border px-3 py-2 rounded w-full bg-muted text-muted-foreground cursor-not-allowed mt-1" 
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Dose</label>
                <input 
                  {...register("dose")} 
                  disabled 
                  className="border px-3 py-2 rounded w-full bg-muted text-muted-foreground cursor-not-allowed mt-1" 
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Drug Form</label>
                <input 
                  {...register("rx_drug_form")} 
                  disabled 
                  className="border px-3 py-2 rounded w-full bg-muted text-muted-foreground cursor-not-allowed mt-1" 
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Refills</label>
                <input 
                  {...register("refills")} 
                  disabled 
                  className="border px-3 py-2 rounded w-full bg-muted text-muted-foreground cursor-not-allowed mt-1" 
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">RX Quantity</label>
                <input 
                  {...register("rx_quantity")} 
                  disabled 
                  className="border px-3 py-2 rounded w-full bg-muted text-muted-foreground cursor-not-allowed mt-1" 
                />
              </div>
            </div>
          </div>

          {/* Platform Costs (Read-only) */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Platform Costs (Read-only)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Cost from Platform</label>
                <div className="flex items-center mt-1">
                  <span className="border px-3 py-2 rounded-l bg-muted text-muted-foreground">$</span>
                  <input 
                    {...register("cost_to_welliemd")} 
                    disabled 
                    className="border border-l-0 px-3 py-2 rounded-r w-full bg-muted text-muted-foreground cursor-not-allowed" 
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Platform Shipping Cost</label>
                <div className="flex items-center mt-1">
                  <span className="border px-3 py-2 rounded-l bg-muted text-muted-foreground">$</span>
                  <input 
                    {...register("shipping_cost_to_welliemd")} 
                    disabled 
                    className="border border-l-0 px-3 py-2 rounded-r w-full bg-muted text-muted-foreground cursor-not-allowed" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Editable Pricing Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Your Pricing (Editable)</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Your Price</label>
                <div className="flex items-center mt-1">
                  <span className="border px-3 py-2 rounded-l bg-gray-50">$</span>
                  <input 
                    type="number"
                    step="0.01"
                    {...register("base_price")} 
                    className="border border-l-0 px-3 py-2 rounded-r w-full" 
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Price you charge customers</p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Base Shipping Cost</label>
                <div className="flex items-center mt-1">
                  <span className="border px-3 py-2 rounded-l bg-gray-50">$</span>
                  <input 
                    type="number"
                    step="0.01"
                    {...register("shipping_cost_to_client")} 
                    className="border border-l-0 px-3 py-2 rounded-r w-full" 
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Your shipping cost</p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Shipping Fee (Patient)</label>
                <div className="flex items-center mt-1">
                  <span className="border px-3 py-2 rounded-l bg-gray-50">$</span>
                  <input 
                    type="number"
                    step="0.01"
                    {...register("shipping_fee_patient")} 
                    className="border border-l-0 px-3 py-2 rounded-r w-full" 
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Per-patient fee</p>
              </div>

              <div>
                <label className="text-sm font-medium">Quantity</label>
                <input 
                  type="text" 
                  {...register("quantity")} 
                  className="border px-3 py-2 rounded w-full mt-1" 
                  placeholder="Available quantity"
                />
                <p className="text-xs text-muted-foreground mt-1">Available inventory</p>
              </div>
            </div>
          </div>

          {/* Editable Content Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Product Content (Editable)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  rows={4} 
                  {...register("description")} 
                  className="border px-3 py-2 rounded w-full mt-1" 
                  placeholder="Enter product description"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Application Directions</label>
                <textarea 
                  rows={4} 
                  {...register("application_directions")} 
                  className="border px-3 py-2 rounded w-full mt-1" 
                  placeholder="How to use/apply the product"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Learn More</label>
                <textarea 
                  rows={4} 
                  {...register("learn_more")} 
                  className="border px-3 py-2 rounded w-full mt-1" 
                  placeholder="Additional information"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Safety Information</label>
                <textarea 
                  rows={4} 
                  {...register("safety_information")} 
                  className="border px-3 py-2 rounded w-full mt-1" 
                  placeholder="Safety information for patients"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Side Effects</label>
                <textarea 
                  rows={4} 
                  {...register("side_effects")} 
                  className="border px-3 py-2 rounded w-full mt-1" 
                  placeholder="Potential side effects"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-sm font-medium block mb-2">Product Image</label>
              
              {/* Show current image if exists */}
              {product?.product_image && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">Current image:</p>
                  <div className="relative inline-block">
                    <img 
                      src={product.product_image} 
                      alt={product.name}
                      className="max-w-xs max-h-48 rounded-lg border border-gray-200 object-contain"
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 break-all">
                    {product.product_image}
                  </p>
                </div>
              )}
              
              {/* File input */}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setValue("product_image", e.target.files?.[0] ?? null)} 
                className="border px-3 py-2 rounded w-full" 
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload a new image to replace the current one
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
