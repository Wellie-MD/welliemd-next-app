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
  expires_at?: string | null
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
    expires_at?: string | null
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
      expires_at: toLocalDatetimeInputValue(coupon?.expires_at ?? null),
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
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700">
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
                    className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
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
                    <span className="border border-l-0 rounded-r px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 shrink-0">
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
                              backgroundColor: "hsl(var(--background))",
                              color: "hsl(var(--foreground))",
                              borderColor: state.isFocused ? '#0ea5e9' : 'hsl(var(--border))',
                              boxShadow: state.isFocused ? '0 0 0 3px rgba(14, 165, 233, 0.1)' : provided.boxShadow,
                              '&:hover': {
                                borderColor: state.isFocused ? '#0ea5e9' : 'hsl(var(--border))',
                              }
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
                      )
                    }}
                  />
                </div>
              </div>
            </div>

            {/* === Status & Scheduling === */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Status & Scheduling</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {/* Active */}
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    {...register("is_active")} 
                    id="is_active" 
                    className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 dark:border-slate-600 dark:bg-slate-900 rounded" 
                  />
                  <label htmlFor="is_active" className="text-sm font-medium select-none">
                    Is Active
                  </label>
                </div>

                {/* Expiry Date */}
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
        <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t dark:border-slate-700 px-6 py-4 flex justify-end">
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
