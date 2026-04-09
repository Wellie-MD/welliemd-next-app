import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Order } from "@/api/ordersApi"
import { productApi, Product } from "@/api/products"
import { changeProduct } from "@/api/ordersApi"

export interface PendingProductChange {
  productId: string
  productName: string
  unitPrice: number
  shippingFee: number
  subtotal: number
  discountAmount: number
  newAmount: number
}

interface ChangeProductModalProps {
  order: Order
  open: boolean
  quantity: number
  onOpenChange: (open: boolean) => void
  onApply: (change: PendingProductChange) => void
}

export function ChangeProductModal({
  order,
  open,
  quantity,
  onOpenChange,
  onApply,
}: ChangeProductModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [isStaging, setIsStaging] = useState(false)
  const { toast } = useToast()

  const currentProductId = order.product ? String(order.product) : ""
  const currentProductName = (order.product_name || "").trim().toLowerCase()
  const orderTreatment = (order.treatment || "").trim().toLowerCase()
  const currentProduct =
    products.find((p) => String(p.id) === currentProductId) ||
    products.find((p) => p.name.trim().toLowerCase() === currentProductName)
  const currentTreatment = (currentProduct?.treatment || orderTreatment || "").trim().toLowerCase()
  const availableProducts = currentTreatment
    ? products.filter((p) => p.treatment.trim().toLowerCase() === currentTreatment)
    : products

  useEffect(() => {
    if (open) {
      setSelectedProductId("")
      setIsStaging(false)
    }
  }, [open])

  const fetchProducts = useCallback(async () => {
    try {
      const resp: unknown = await productApi.listProducts({ page_size: 100 })
      const data = resp as { results?: Product[] } | Product[]
      const items = Array.isArray(data) ? data : (data.results || [])
      setProducts(Array.isArray(items) ? items : [])
    } catch (err) {
      console.error(err)
      toast({
        title: "Error fetching products",
        description: "Failed to load available products.",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    if (open) {
      fetchProducts()
    }
  }, [open, fetchProducts])

  const selectedProduct = availableProducts.find((p) => String(p.id) === selectedProductId)
  const isSameProduct = !!selectedProduct && (
    (currentProductId && String(selectedProduct.id) === currentProductId) ||
    selectedProduct.name.trim().toLowerCase() === currentProductName
  )

  useEffect(() => {
    if (!open || selectedProductId || availableProducts.length === 0) return
    const current = availableProducts.find((p) =>
      (currentProductId && String(p.id) === currentProductId) ||
      p.name.trim().toLowerCase() === currentProductName
    )
    if (current) {
      setSelectedProductId(String(current.id))
    }
  }, [open, selectedProductId, availableProducts, currentProductId, currentProductName])

  useEffect(() => {
    if (!selectedProductId) return
    if (!availableProducts.some((p) => String(p.id) === selectedProductId)) {
      setSelectedProductId("")
    }
  }, [availableProducts, selectedProductId])

  const handleApply = async () => {
    if (!selectedProduct || !order.id) return
    
    setIsStaging(true)
    try {
      const dryRunRes = await changeProduct(order.id, selectedProduct.id, quantity, true)
      
      const pricing = dryRunRes?.pricing || {}
      
      onApply({
        productId: String(selectedProduct.id),
        productName: selectedProduct.name,
        unitPrice: Number.parseFloat(pricing.unit_price || "0"),
        shippingFee: Number.parseFloat(pricing.shipping_fee || "0"),
        subtotal: Number.parseFloat(pricing.subtotal || "0"),
        discountAmount: Number.parseFloat(pricing.discount_amount || "0"),
        newAmount: Number.parseFloat(pricing.new_amount || "0"),
      })

      toast({
        title: "Product staged",
        description: "Review changes and click Update Order to save.",
      })
      onOpenChange(false)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Failed to stage product change"
      toast({ title: message, variant: "destructive" })
    } finally {
      setIsStaging(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Product</DialogTitle>
          <DialogDescription>
            Select a new product. Pricing will be recalulated and the payment will be automatically adjusted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">Current Product</p>
            <p className="text-sm">{order.product_name || "N/A"}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">New Product</p>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableProducts.length === 0 && (
              <p className="text-xs text-amber-500 mt-1">
                No products found in the same treatment type for this order.
              </p>
            )}
            {isSameProduct && selectedProductId && (
              <p className="text-xs text-amber-500 mt-1">This is the current product.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isStaging}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={!selectedProductId || isSameProduct || isStaging || availableProducts.length === 0}
          >
            {isStaging ? "Staging..." : "Stage Edit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
