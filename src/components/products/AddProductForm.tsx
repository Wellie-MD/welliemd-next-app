"use client"

import { ReactNode, useEffect, useMemo, useState } from "react"
import { UseFormRegisterReturn, useForm } from "react-hook-form"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Box, DollarSign, ImageIcon, Lock, MapPin, Power, X } from "lucide-react"

import { Product, productApi } from "@/api/products"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC", "PR",
]

type ProductFormValues = {
  description?: string
  application_directions?: string
  learn_more?: string
  product_image?: File | null
  safety_information?: string
  side_effects?: string
  quantity?: string
  is_active?: boolean
  base_price?: string
  shipping_fee_patient?: string
  discounted_price?: string
  service_states?: string[]
}

const normalizeStates = (states?: string[] | null) =>
  Array.from(
    new Set(
      (states || [])
        .map((state) => String(state || "").trim().toUpperCase())
        .filter(Boolean)
    )
  )

const asNumber = (value?: string | number | null) => {
  const parsed = typeof value === "number" ? value : Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const money = (value?: string | number | null) => `$${asNumber(value).toFixed(2)}`

const titleCase = (value?: string) => {
  if (!value) return "-"
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

const purchaseTypeLabel = (value?: string) => {
  if (value === "one_time") return "One Time"
  if (value === "subscription") return "Subscription"
  return titleCase(value)
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
  const { register, handleSubmit, reset, setValue, watch } = useForm<ProductFormValues>()
  const [loading, setLoading] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState("")
  const { toast } = useToast()

  const adminAllowedStates = normalizeStates(
    product?.admin_service_states?.length ? product.admin_service_states : product?.service_states
  )
  const selectedServiceStates = normalizeStates(watch("service_states") || [])
  const availableServiceStates = adminAllowedStates.length
    ? US_STATES.filter((state) => adminAllowedStates.includes(state))
    : []
  const isActive = watch("is_active", product?.is_active ?? true)
  const selectedImage = watch("product_image")

  const basePrice = watch("base_price", product?.base_price ?? "0.00")
  const discountedPrice = watch("discounted_price", product?.discounted_price ?? "")
  const shippingFee = watch("shipping_fee_patient", product?.shipping_fee_patient ?? "0.00")
  const effectivePatientPrice = asNumber(discountedPrice) > 0 ? asNumber(discountedPrice) : asNumber(basePrice)
  const costToClient = asNumber(product?.cost_to_client)
  const shippingCost = asNumber(product?.shipping_cost_to_client)
  const totalCost = costToClient + shippingCost
  const patientPays = effectivePatientPrice + asNumber(shippingFee)
  const profit = patientPays - totalCost
  const margin = patientPays > 0 ? (profit / patientPays) * 100 : 0

  const activeStateCount = selectedServiceStates.filter((state) =>
    availableServiceStates.includes(state)
  ).length

  const imageName = useMemo(() => {
    if (selectedImage instanceof File) return selectedImage.name
    if (!product?.product_image) return ""
    try {
      return decodeURIComponent(product.product_image.split("/").pop() || product.product_image)
    } catch {
      return product.product_image
    }
  }, [product?.product_image, selectedImage])

  useEffect(() => {
    if (!(selectedImage instanceof File)) {
      setSelectedImageUrl("")
      return
    }

    const objectUrl = URL.createObjectURL(selectedImage)
    setSelectedImageUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [selectedImage])

  useEffect(() => {
    if (!product) return

    reset({
      description: product.description ?? "",
      application_directions: product.application_directions ?? "",
      learn_more: product.learn_more ?? "",
      safety_information: product.safety_information ?? "",
      side_effects: product.side_effects ?? "",
      quantity: product.quantity ?? "1",
      base_price: product.base_price ?? "0.00",
      shipping_fee_patient: product.shipping_fee_patient ?? "0.00",
      discounted_price: product.discounted_price ?? "",
      service_states: normalizeStates(product.service_states),
      is_active: product.is_active ?? true,
      product_image: null,
    })
  }, [product, reset])

  const onSubmit = async (data: ProductFormValues) => {
    if (!product) return

    try {
      setLoading(true)

      const fd = new FormData()
      if (data.description !== undefined) fd.append("description", data.description)
      if (data.application_directions !== undefined) fd.append("application_directions", data.application_directions)
      if (data.learn_more !== undefined) fd.append("learn_more", data.learn_more)
      if (data.safety_information !== undefined) fd.append("safety_information", data.safety_information)
      if (data.side_effects !== undefined) fd.append("side_effects", data.side_effects)
      if (data.quantity !== undefined) fd.append("quantity", data.quantity)
      if (data.is_active !== undefined) fd.append("is_active", String(data.is_active))
      if (data.base_price !== undefined) fd.append("base_price", data.base_price)
      if (data.shipping_fee_patient !== undefined) fd.append("shipping_fee_patient", data.shipping_fee_patient)
      if (data.discounted_price !== undefined && data.discounted_price !== '') fd.append("discounted_price", data.discounted_price)
      if (data.service_states !== undefined) {
        const selectedStates = normalizeStates(data.service_states).filter((state) => adminAllowedStates.includes(state))
        fd.append("service_states", JSON.stringify(selectedStates))
      }
      if (data.product_image instanceof File) {
        fd.append("product_image", data.product_image)
      }

      await productApi.updateProduct(product.id, fd)

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
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/55" />
        <DialogPrimitive.Content
          className="fixed z-50 flex w-[calc(100vw-24px)] max-w-[990px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
          style={{
            top: "24px",
            bottom: "24px",
            left: "50%",
            height: "auto",
            maxHeight: "none",
            transform: "translateX(-50%)",
          }}
        >
          <div className="shrink-0 border-b border-slate-200 px-8 py-6 text-left">
          <div className="flex items-start gap-4">
            <SectionIcon>
              <Box className="h-5 w-5" />
            </SectionIcon>
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <DialogPrimitive.Title className="text-xl font-bold text-slate-900">
                  Edit Product
                </DialogPrimitive.Title>
                <StatusBadge active={Boolean(isActive)} />
              </div>
              <div className="mt-1 truncate text-[15px] font-medium text-slate-900">
                {product?.name}
              </div>
              <DialogPrimitive.Description className="text-sm text-slate-500">
                Fields marked read-only are managed by the admin and cannot be edited.
              </DialogPrimitive.Description>
            </div>
          </div>
          <DialogPrimitive.Close className="absolute right-6 top-6 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain bg-slate-50 px-8 py-6 [scrollbar-gutter:stable]">
            <Panel
              icon={<Box className="h-5 w-5" />}
              title="Product Information"
              badge="Admin-managed"
              badgeIcon={<Lock className="h-3.5 w-3.5" />}
            >
              <div
                className="grid gap-y-5"
                style={{
                  gridTemplateColumns: "260px minmax(0, 1fr)",
                  columnGap: "32px",
                }}
              >
                <ReadOnlyField
                  label="Product Name"
                  value={product?.name}
                  strong
                />
                <ReadOnlyField
                  label="Product Description"
                  value={
                    product?.description ||
                    `${product?.name || "Product"} - prescription ${product?.rx_drug_form || "medication"} dispensed by ${product?.manufacturer_name || "the pharmacy"}.`
                  }
                  description
                />
              </div>
              <div className="my-4 border-t border-slate-200" />
              <div
                className="grid"
                style={{
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  columnGap: "32px",
                }}
              >
                <div className="space-y-4">
                  <ReadOnlyField label="Product Type" value={titleCase(product?.product_type)} />
                  <ReadOnlyField label="Pharmacy" value={product?.manufacturer_name || "-"} />
                </div>
                <div className="space-y-4">
                  <ReadOnlyField label="Purchase Type" value={purchaseTypeLabel(product?.purchase_type)} />
                  <ReadOnlyField label="Drug Form" value={titleCase(product?.rx_drug_form)} />
                </div>
                <div className="space-y-4">
                  <ReadOnlyField label="RX / OTC" value={(product?.rx_or_otc || "-").toUpperCase()} />
                  <ReadOnlyField label="RX Quantity" value={product?.rx_quantity || "-"} />
                </div>
              </div>
            </Panel>

            <Panel
              icon={<DollarSign className="h-5 w-5" />}
              title="Pricing & Profit"
              badge="Editable"
              badgeTone="green"
            >
              <div className="grid gap-4 md:grid-cols-3">
                <MoneyInput
                  label="Base Price (Patient)"
                  helper="Retail price shown to patients"
                  registration={register("base_price")}
                />
                <MoneyInput
                  label="Discounted Price (Patient)"
                  helper="Optional promotional price"
                  registration={register("discounted_price")}
                />
                <MoneyInput
                  label="Shipping Fee (Patient)"
                  helper="Per-patient fee"
                  registration={register("shipping_fee_patient")}
                />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                    Your cost
                    <SmallBadge>
                      <Lock className="h-3.5 w-3.5" />
                      Admin-managed
                    </SmallBadge>
                  </div>
                  <CostRow label="Cost to Client" value={money(costToClient)} />
                  <CostRow label="Shipping cost" value={money(shippingCost)} />
                  <div className="my-4 border-t border-slate-200" />
                  <CostRow label="Total cost" value={money(totalCost)} strong />
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="mb-4 text-sm font-bold text-slate-900">Profit breakdown</div>
                  <CostRow label="Patient pays" value={money(effectivePatientPrice)} />
                  <CostRow label="Shipping fee" value={`+ ${money(shippingFee)}`} />
                  <CostRow label="Your cost" value={`- ${money(totalCost)}`} />
                  <div className="my-4 border-t border-emerald-200" />
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900">Profit per order</div>
                      <div className="mt-1 text-sm text-slate-500">Excludes visit cost</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-600">{money(profit)}</div>
                      <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                        {margin.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel icon={<Power className="h-5 w-5" />} title="Availability">
              <div className="flex items-center justify-between gap-6">
                <p className="text-[15px] text-slate-500">
                  Inactive products are hidden from product selection in intake.
                </p>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{isActive ? "Active" : "Inactive"}</div>
                    <div className="text-xs text-slate-500">
                      {isActive ? "Shown in product selection" : "Hidden from product selection"}
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(isActive)}
                    onClick={() => setValue("is_active", !isActive, { shouldDirty: true })}
                    className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-0 p-0 transition-colors"
                    style={{
                      backgroundColor: isActive ? "#46b6e6" : "#cbd5e1",
                    }}
                  >
                    <span
                      className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform"
                      style={{
                        transform: isActive ? "translateX(22px)" : "translateX(2px)",
                      }}
                    />
                  </button>
                </div>
              </div>
            </Panel>

            <Panel
              icon={<MapPin className="h-5 w-5" />}
              title="Service States"
              rightBadge={`${activeStateCount} of ${availableServiceStates.length} active`}
            >
              <p className="text-[15px] text-slate-500">
                Select the states where this assigned product should remain available. You can only choose states configured by admin.
              </p>
              {adminAllowedStates.length ? (
                <>
                  <div className="mt-4 flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-lg border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                      onClick={() => setValue("service_states", availableServiceStates, { shouldDirty: true })}
                    >
                      Select all states
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 px-0 text-sm font-semibold text-slate-500 hover:bg-transparent hover:text-slate-700"
                      onClick={() => setValue("service_states", [], { shouldDirty: true })}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {availableServiceStates.map((state) => {
                      const checked = selectedServiceStates.includes(state)
                      return (
                        <button
                          key={state}
                          type="button"
                          onClick={() => {
                            const nextStates = checked
                              ? selectedServiceStates.filter((item) => item !== state)
                              : [...selectedServiceStates, state]
                            setValue("service_states", nextStates, { shouldDirty: true })
                          }}
                          className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                          style={{
                            minWidth: "44px",
                            borderColor: checked ? "#46b6e6" : "#e8ebee",
                            backgroundColor: checked ? "#46b6e6" : "#ffffff",
                            color: checked ? "#ffffff" : "#1f2937",
                          }}
                        >
                          {state}
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  No explicit product-level states were configured by admin. This product inherits pharmacy coverage.
                </p>
              )}
            </Panel>

            <Panel
              icon={<ImageIcon className="h-5 w-5" />}
              title="Product Image"
              badge="Editable"
              badgeTone="green"
            >
              <div
                className="grid items-start"
                style={{
                  gridTemplateColumns: "145px minmax(0, 1fr)",
                  columnGap: "24px",
                }}
              >
                <div className="min-w-0">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    {selectedImageUrl ? "Selected" : "Current"}
                  </div>
                  <div
                    className="flex items-center justify-center overflow-hidden rounded-xl border border-slate-200"
                    style={{
                      width: "132px",
                      height: "150px",
                      background: "linear-gradient(180deg,#fbfcfd,#eef2f5)",
                    }}
                  >
                    {selectedImageUrl || product?.product_image ? (
                      <img
                        key={selectedImageUrl || product?.product_image}
                        src={selectedImageUrl || product?.product_image}
                        alt={product?.name || "Product"}
                        className="h-full w-full object-contain"
                        onError={(event) => {
                          event.currentTarget.style.display = "none"
                        }}
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                  {imageName && (
                    <div
                      className="mt-2 truncate text-xs font-medium text-slate-900"
                      style={{ maxWidth: "132px" }}
                      title={imageName}
                    >
                      {imageName}
                    </div>
                  )}
                  {!selectedImageUrl && product?.product_image && (
                    <a
                      href={product.product_image}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs font-medium text-sky-700 hover:underline"
                    >
                      View original
                    </a>
                  )}
                </div>

                <label
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white px-6 py-8 text-center transition-colors hover:border-sky-300"
                  style={{
                    minHeight: "242px",
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    const file = event.dataTransfer.files?.[0]
                    if (file && file.type.startsWith("image/")) {
                      setValue("product_image", file, { shouldDirty: true })
                    }
                  }}
                >
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="sr-only"
                    onChange={(event) => setValue("product_image", event.target.files?.[0] ?? null, { shouldDirty: true })}
                  />
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                    <ImageIcon className="h-5 w-5" />
                  </span>
                  <span className="mt-3 text-sm font-semibold text-slate-900">
                    {selectedImage instanceof File ? selectedImage.name : "Click to upload"}
                  </span>
                  <span className="text-sm text-slate-500">or drag and drop an image here</span>
                  <span className="mt-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                    PNG or JPG - up to 5MB
                  </span>
                </label>
              </div>
            </Panel>
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white px-7 py-4 shadow-[0_-1px_3px_rgba(16,32,48,0.04)]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 min-w-[93px] shrink-0 rounded-lg border-slate-200 px-5 text-sm font-medium text-slate-900 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 min-w-[144px] shrink-0 whitespace-nowrap rounded-lg bg-sky-500 px-5 text-sm font-semibold text-white hover:bg-sky-600"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function SectionIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
      {children}
    </span>
  )
}

function Panel({
  icon,
  title,
  badge,
  badgeIcon,
  badgeTone,
  rightBadge,
  children,
}: {
  icon: ReactNode
  title: string
  badge?: string
  badgeIcon?: ReactNode
  badgeTone?: "green"
  rightBadge?: string
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
            {icon}
          </span>
          <h3 className="font-bold text-slate-900">{title}</h3>
          {badge && (
            <SmallBadge tone={badgeTone}>
              {badgeIcon}
              {badge}
            </SmallBadge>
          )}
        </div>
        {rightBadge && (
          <span className="rounded-full bg-sky-100 px-4 py-1.5 text-sm font-bold text-sky-700">
            {rightBadge}
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function SmallBadge({
  children,
  tone,
}: {
  children: ReactNode
  tone?: "green"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
        tone === "green"
          ? "bg-emerald-100 text-emerald-600"
          : "bg-slate-100 text-slate-500"
      )}
    >
      {children}
    </span>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-3 py-1 text-sm font-semibold",
        active ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  )
}

function ReadOnlyField({
  label,
  value,
  strong,
  className,
  description,
}: {
  label: string
  value?: ReactNode
  strong?: boolean
  className?: string
  description?: boolean
}) {
  return (
    <div className={className}>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-[15px] font-medium leading-5 text-slate-950",
          strong && "text-base font-semibold leading-6",
          description && "text-sm font-normal leading-6"
        )}
      >
        {value || "-"}
      </div>
    </div>
  )
}

function MoneyInput({
  label,
  helper,
  registration,
}: {
  label: string
  helper: string
  registration: UseFormRegisterReturn
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-500">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
        <input
          type="number"
          step="0.01"
          {...registration}
          className="h-11 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-[15px] text-slate-900 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-300"
          placeholder="0.00"
        />
      </div>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </div>
  )
}

function CostRow({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 text-[15px]">
      <span className="text-slate-500">{label}</span>
      <span className={cn("text-slate-900", strong ? "font-bold" : "font-semibold")}>{value}</span>
    </div>
  )
}
