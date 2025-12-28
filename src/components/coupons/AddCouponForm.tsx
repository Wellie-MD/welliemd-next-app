"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import axiosInstance from "@/api/axiosInstance"
import Select from "react-select"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"


type Product = {
  id: string
  name: string
}

type CouponFormValues = {
  code: string
  type: "fixed" | "percent"
  value: number
  applicable_products: string[]
  is_active: boolean
  max_usage?: number | null
  max_usage_per_user?: number | null
  min_spend?: number | null
  expires_at?: string | null
  // ---- NEW FIELDS (frontend form) ----
  purchase_applicability: "both" | "first_only" | "followup_only"
  catalog_applicability: "medical_only" | "labs_only" | "both"
  subscription_applicability: "first_cycle_only" | "every_cycle"
}

type Props = {
  mode: "create" | "edit"
  coupon?: {
    id: string
    code: string
    type: "fixed" | "percent"
    value: number | string
    applicable_products: string[]
    is_active: boolean
    max_usage?: number | null
    max_usage_per_user?: number | null
    min_spend?: number | string | null
    expires_at?: string | null
    // ---- NEW (for edit mode defaults) ----
    purchase_applicability: "both" | "first_only" | "followup_only"
    catalog_applicability: "medical_only" | "labs_only" | "both"
    subscription_applicability: "first_cycle_only" | "every_cycle"
  }
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

function toLocalDatetimeInputValue(iso?: string | null) {
  if (!iso) return ""
  try {
    const d = new Date(iso)
    const pad = (n: number) => n.toString().padStart(2, "0")
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const mi = pad(d.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
  } catch {
    return ""
  }
}

export default function AddCouponForm({
  mode,
  coupon,
  open = true,
  onOpenChange,
  onSuccess,
}: Props) {
  const { register, handleSubmit, reset, control, setValue, watch } = useForm<CouponFormValues>({
    defaultValues: {
      code: coupon?.code ?? "",
      type: coupon?.type ?? "fixed",
      value:
        coupon?.value !== undefined
          ? typeof coupon.value === "string"
            ? parseFloat(coupon.value)
            : coupon.value
          : 0,
      applicable_products: coupon?.applicable_products ?? [],
      is_active: coupon?.is_active ?? true,
      max_usage: coupon?.max_usage ?? null,
      max_usage_per_user: coupon?.max_usage_per_user ?? null,
      min_spend:
        coupon?.min_spend === null || coupon?.min_spend === undefined
          ? null
          : typeof coupon?.min_spend === "string"
          ? parseFloat(coupon.min_spend as string)
          : (coupon?.min_spend as number),
      expires_at: toLocalDatetimeInputValue(coupon?.expires_at ?? null),
      // ---- NEW defaults (mirror backend defaults) ----
      purchase_applicability: coupon?.purchase_applicability ?? "both",
      catalog_applicability: coupon?.catalog_applicability ?? "medical_only",
      subscription_applicability: coupon?.subscription_applicability ?? "first_cycle_only",
    },
  })

  const type = watch("type")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    axiosInstance
      .get("/products/")
      .then((res) => setProducts(res.data?.results || []))
      .catch(() => setProducts([])
    )
  }, [])

  const productOptions = useMemo(
    () => products.map((p) => ({ value: p.id, label: p.name })),
    [products]
  )

  useEffect(() => {
    if (coupon?.applicable_products) {
      setValue("applicable_products", coupon.applicable_products)
    }
  }, [coupon, setValue])

  const { toast } = useToast()

  const onSubmit = async (data: CouponFormValues) => {
    try {
      setLoading(true)
      const payload = {
        ...data,
        expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null,
      }

      if (mode === "edit" && coupon?.id) {
        await axiosInstance.patch(`/coupons/${coupon.id}/`, payload)
      } else {
        await axiosInstance.post("/coupons/", payload)
        reset()
      }

      // no alerts — close & notify parent
      onOpenChange?.(false)
      onSuccess?.()
    } catch (err) {
      // no alerts — just log
      console.error(mode === "edit" ? "Error updating coupon" : "Error creating coupon", err)

      // Toast error message
      const message =
    err?.response?.data?.code?.[0] ||
    (mode === "edit"
      ? "Error updating coupon"
      : "Error creating coupon")

  toast({
    variant: "destructive",
    title: "Coupon Error",
    description: message,
  })

    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => onOpenChange?.(v)}>
      <DialogTrigger className="hidden" />
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            {mode === "edit" ? `Edit Coupon${coupon?.code ? `: ${coupon.code}` : ""}` : "Create New Coupon"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Configure discount details, limits, and scheduling. Fields marked with * are required.
          </p>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="px-6 max-h-[70vh] overflow-y-auto">
          <form id="coupon-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-24">
            {/* === Details === */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Code */}
                <div>
                  <label className="block text-sm font-medium mb-1">Code *</label>
                  <Input
                    {...register("code", { required: true })}
                    placeholder="e.g. SUMMER25"
                    disabled={mode === "edit"}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Unique coupon code customers will enter.</p>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <select
                    {...register("type", { required: true })}
                    className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-white"
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="percent">Percent</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fixed subtracts a currency amount; Percent takes a percentage off.
                  </p>
                </div>

                {/* Value */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {type === "percent" ? "Percent Value *" : "Amount Value *"}
                  </label>
                  <div className="flex">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={type === "percent" ? "10" : "12.00"}
                      {...register("value", { required: true })}
                      className="rounded-r-none"
                    />
                    <span className="border border-l-0 rounded-r px-3 py-2 text-sm bg-gray-50 shrink-0">
                      {type === "percent" ? "%" : "$"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {type === "percent" ? "0–100 accepted." : "Enter the discount amount in your store currency."}
                  </p>
                </div>

                {/* Spacer to push products full width on its own row */}
                <div className="md:col-span-1"></div>

                {/* Products (full width row) */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Applies to Products</label>
                  <Controller
                    name="applicable_products"
                    control={control}
                    render={({ field }) => {
                      const selected = productOptions.filter((o) => (field.value || []).includes(o.value))
                      return (
                        <Select
                          {...field}
                          options={productOptions}
                          isMulti
                          className="w-full"
                          classNamePrefix="react-select"
                          placeholder="Select products (leave empty to apply to all)"
                          value={selected}
                          onChange={(sel) => field.onChange(sel.map((s) => s.value))}
                          styles={{
                            control: (provided, state) => ({
                              ...provided,
                              borderColor: state.isFocused ? '#0ea5e9' : provided.borderColor,
                              boxShadow: state.isFocused ? '0 0 0 3px rgba(14, 165, 233, 0.1)' : provided.boxShadow,
                              '&:hover': {
                                borderColor: state.isFocused ? '#0ea5e9' : provided.borderColor,
                              }
                            })
                          }}
                        />
                      )
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave empty to apply the coupon to all products.</p>
                </div>
              </div>
            </div>

            {/* === Applicability === */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Applicability</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Coupon Applicable To */}
                <div>
                  <label className="block text-sm font-medium mb-1">Coupon Applicable To</label>
                  <select
                    {...register("purchase_applicability")}
                    className="border px-3 py-2 rounded w-full bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                  >
                    <option value="both">For Both First and Followup Purchase</option>
                    <option value="first_only">First Purchase Only</option>
                    <option value="followup_only">Follow-up Purchase Only</option>
                  </select>
                </div>

                {/* Apply To Subscription Products */}
                <div>
                  <label className="block text-sm font-medium mb-1">Apply To Subscription Products</label>
                  <select
                    {...register("subscription_applicability")}
                    className="border px-3 py-2 rounded w-full bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                  >
                    <option value="first_cycle_only">Apply Only to First Billing Cycle</option>
                    <option value="every_cycle">Apply to Every Billing Cycle</option>
                  </select>
                </div>

                {/* Coupon Applicable To Meds/Lab Panel (full width on md) */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Coupon Applicable To Meds/Lab Panel</label>
                  <select
                    {...register("catalog_applicability")}
                    className="border px-3 py-2 rounded w-full bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                  >
                    <option value="medical_only">Apply Only to Medical Products</option>
                    <option value="labs_only">Apply Only to Lab Panels</option>
                    <option value="both">Apply to both Medical Products/Lab Panels</option>
                  </select>
                </div>
              </div>
            </div>

            {/* === Limits & Rules === */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Limits &amp; Rules</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                {/* Active */}
                <div className="flex items-center gap-2 md:col-span-1">
                  <input 
                    type="checkbox" 
                    {...register("is_active")} 
                    id="is_active" 
                    className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded" 
                  />
                  <label htmlFor="is_active" className="text-sm font-medium select-none">
                    Is Active
                  </label>
                </div>

                {/* Max usage */}
                <div>
                  <label className="block text-sm font-medium mb-1">Max Usage</label>
                  <Input
                    type="number"
                    {...register("max_usage")}
                    placeholder="e.g. 100"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Total number of times this coupon can be used.</p>
                </div>

                {/* Max per user */}
                <div>
                  <label className="block text-sm font-medium mb-1">Max per User</label>
                  <Input
                    type="number"
                    {...register("max_usage_per_user")}
                    placeholder="e.g. 1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Limit usage for each customer.</p>
                </div>

                {/* Minimum spend */}
                <div>
                  <label className="block text-sm font-medium mb-1">Minimum Spend</label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register("min_spend")}
                    placeholder="e.g. 50.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Order subtotal must be at least this amount.</p>
                </div>
              </div>
            </div>

            {/* === Scheduling === */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Scheduling</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Expiry Date</label>
                  <Input
                    type="datetime-local"
                    {...register("expires_at")}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave empty if the coupon should not expire.</p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t px-6 py-4 flex justify-end">
          <Button
            type="submit"
            form="coupon-form"
            disabled={loading}
          >
            {loading ? (mode === "edit" ? "Saving..." : "Creating...") : mode === "edit" ? "Save changes" : "Create Coupon"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
