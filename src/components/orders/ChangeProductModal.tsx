import { useState, useEffect } from "react"
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

  const currentProductName = (order.product_name || "").trim().toLowerCase()

  useEffect(() => {
    if (open) {
      setSelectedProductId("")
      setIsStaging(false)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      fetchProducts()
    }
  }, [open])

  const fetchProducts = async () => {
    try {
      const resp: any = await productApi.listProducts({ page_size: 100 })
      const items = resp.results || resp || []
      setProducts(Array.isArray(items) ? items : [])
    } catch (err) {
      console.error(err)
      toast({
        title: "Error fetching products",
        description: "Failed to load available products.",
        variant: "destructive",
      })
    }
  }

  const selectedProduct = products.find((p) => String(p.id) === selectedProductId)
  const isSameProduct =
    !!selectedProduct && selectedProduct.name.trim().toLowerCase() === currentProductName

  useEffect(() => {
    if (!open || selectedProductId || products.length === 0) return
    const current = products.find((p) => p.name.trim().toLowerCase() === currentProductName)
    if (current) {
      setSelectedProductId(String(current.id))
    }
  }, [open, selectedProductId, products, currentProductName])

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
                {products.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            disabled={!selectedProductId || isSameProduct || isStaging}
          >
            {isStaging ? "Staging..." : "Stage Edit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
