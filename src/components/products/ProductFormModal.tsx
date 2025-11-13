import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { productApi, Product } from "@/api/products";
import {
  PRODUCT_TYPE_OPTIONS,
  PURCHASE_TYPE_OPTIONS,
  RX_OTC_OPTIONS,
  TREATMENT_OPTIONS,
  RX_DRUG_FORM_OPTIONS,
} from "@/api/products";
import { CategorySelector } from "./CategorySelector";

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSuccess: () => void;
}

export function ProductFormModal({
  open,
  onOpenChange,
  product,
  onSuccess,
}: ProductFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    application_directions: "",
    category: null as number | null,
    product_type: "single",
    purchase_type: "one_time",
    treatment: "general",
    rx_or_otc: "rx",
    base_price: "0.00",
    cost_to_welliemd: "0.00",
    shipping_cost_to_client: "0.00",
    shipping_cost_to_welliemd: "0.00",
    manufacturer_name: "",
    ndc_number: "",
    rx_drug_form: "tablet",
    rx_quantity: "30",
    rx_drug_strength: "",
    rx_days_supply: 30,
    refills: 0,
    beluga_medicine_id: "",
    provider_network: "welliemd",
    followup_days_after: 30,
    quantity: "100",
    is_active: true,
    requires_video_visit: false,
    allow_client_modifications: true,
    sync_to_tenants: false,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        application_directions: product.application_directions || "",
        category: (product as unknown).category || null,
        product_type: product.product_type || "single",
        purchase_type: product.purchase_type || "one_time",
        treatment: product.treatment || "general",
        rx_or_otc: product.rx_or_otc || "rx",
        base_price: product.base_price?.toString() || "0.00",
        cost_to_welliemd: product.cost_to_welliemd?.toString() || "0.00",
        shipping_cost_to_client: product.shipping_cost_to_client?.toString() || "0.00",
        shipping_cost_to_welliemd: product.shipping_cost_to_welliemd?.toString() || "0.00",
        manufacturer_name: product.manufacturer_name || "",
        ndc_number: product.ndc_number || "",
        rx_drug_form: product.rx_drug_form || "tablet",
        rx_quantity: product.rx_quantity?.toString() || "30",
        rx_drug_strength: product.rx_drug_strength || "",
        rx_days_supply: product.rx_days_supply || 30,
        refills: product.refills || 0,
        beluga_medicine_id: product.beluga_medicine_id || "",
        provider_network: product.provider_network || "welliemd",
        followup_days_after: product.followup_days_after || 30,
        quantity: product.quantity?.toString() || "100",
        is_active: product.is_active !== undefined ? product.is_active : true,
        requires_video_visit: product.requires_video_visit || false,
        allow_client_modifications: product.allow_client_modifications !== undefined ? product.allow_client_modifications : true,
        sync_to_tenants: product.sync_to_tenants || false,
      });
    } else {
      // Reset form for new product
      setFormData({
        name: "",
        description: "",
        application_directions: "",
        category: null,
        product_type: "single",
        purchase_type: "one_time",
        treatment: "general",
        rx_or_otc: "rx",
        base_price: "0.00",
        cost_to_welliemd: "0.00",
        shipping_cost_to_client: "0.00",
        shipping_cost_to_welliemd: "0.00",
        manufacturer_name: "",
        ndc_number: "",
        rx_drug_form: "tablet",
        rx_quantity: "30",
        rx_drug_strength: "",
        rx_days_supply: 30,
        refills: 0,
        beluga_medicine_id: "",
        provider_network: "welliemd",
        followup_days_after: 30,
        quantity: "100",
        is_active: true,
        requires_video_visit: false,
        allow_client_modifications: true,
        sync_to_tenants: false,
      });
    }
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.beluga_medicine_id.trim()) {
      toast({
        title: "Validation Error",
        description: "Beluga Medicine ID is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        base_price: parseFloat(formData.base_price),
        cost_to_welliemd: parseFloat(formData.cost_to_welliemd),
        shipping_cost_to_client: parseFloat(formData.shipping_cost_to_client),
        shipping_cost_to_welliemd: parseFloat(formData.shipping_cost_to_welliemd),
        rx_quantity: parseFloat(formData.rx_quantity),
        quantity: parseInt(formData.quantity),
      };

      if (product) {
        await productApi.updateProduct(product.id, payload);
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        await productApi.createProduct(payload);
        toast({
          title: "Success",
          description: "Product created successfully",
        });
      }

      onSuccess();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error.response?.data?.error || `Failed to ${product ? "update" : "create"} product`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle>
            {product ? "Edit Product" : "Create New Product"}
          </DialogTitle>
          <DialogDescription>
            {product
              ? "Update product details below."
              : "Fill in the product information to create a new product."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Semaglutide 2.5mg"
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product description"
                  rows={3}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="category">Product Category</Label>
                <CategorySelector
                  value={formData.category}
                  onChange={(categoryId) => setFormData({ ...formData, category: categoryId })}
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="product_type">Product Type</Label>
                <Select
                  value={formData.product_type}
                  onValueChange={(value) => setFormData({ ...formData, product_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="purchase_type">Purchase Type</Label>
                <Select
                  value={formData.purchase_type}
                  onValueChange={(value) => setFormData({ ...formData, purchase_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PURCHASE_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="treatment">Treatment</Label>
                <Select
                  value={formData.treatment}
                  onValueChange={(value) => setFormData({ ...formData, treatment: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TREATMENT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rx_or_otc">RX/OTC</Label>
                <Select
                  value={formData.rx_or_otc}
                  onValueChange={(value) => setFormData({ ...formData, rx_or_otc: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RX_OTC_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pricing</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="base_price">Base Price ($)</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="cost_to_welliemd">Cost to WellieMD ($)</Label>
                <Input
                  id="cost_to_welliemd"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_to_welliemd}
                  onChange={(e) => setFormData({ ...formData, cost_to_welliemd: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="shipping_cost_to_client">Shipping Cost to Client ($)</Label>
                <Input
                  id="shipping_cost_to_client"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.shipping_cost_to_client}
                  onChange={(e) => setFormData({ ...formData, shipping_cost_to_client: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="shipping_cost_to_welliemd">Shipping Cost to WellieMD ($)</Label>
                <Input
                  id="shipping_cost_to_welliemd"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.shipping_cost_to_welliemd}
                  onChange={(e) => setFormData({ ...formData, shipping_cost_to_welliemd: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Product Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manufacturer_name">Manufacturer</Label>
                <Input
                  id="manufacturer_name"
                  value={formData.manufacturer_name}
                  onChange={(e) => setFormData({ ...formData, manufacturer_name: e.target.value })}
                  placeholder="Manufacturer name"
                />
              </div>

              <div>
                <Label htmlFor="ndc_number">NDC Number</Label>
                <Input
                  id="ndc_number"
                  value={formData.ndc_number}
                  onChange={(e) => setFormData({ ...formData, ndc_number: e.target.value })}
                  placeholder="National Drug Code"
                />
              </div>

              <div>
                <Label htmlFor="rx_drug_form">Drug Form</Label>
                <Select
                  value={formData.rx_drug_form}
                  onValueChange={(value) => setFormData({ ...formData, rx_drug_form: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RX_DRUG_FORM_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rx_quantity">RX Quantity</Label>
                <Input
                  id="rx_quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.rx_quantity}
                  onChange={(e) => setFormData({ ...formData, rx_quantity: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="rx_drug_strength">Drug Strength</Label>
                <Input
                  id="rx_drug_strength"
                  value={formData.rx_drug_strength}
                  onChange={(e) => setFormData({ ...formData, rx_drug_strength: e.target.value })}
                  placeholder="e.g., 5mg/ml, 10mg"
                />
              </div>

              <div>
                <Label htmlFor="rx_days_supply">Days Supply</Label>
                <Input
                  id="rx_days_supply"
                  type="number"
                  min="1"
                  value={formData.rx_days_supply}
                  onChange={(e) => setFormData({ ...formData, rx_days_supply: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="refills">Refills</Label>
                <Input
                  id="refills"
                  type="number"
                  min="0"
                  value={formData.refills}
                  onChange={(e) => setFormData({ ...formData, refills: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="quantity">Inventory Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="followup_days_after">Follow-up Days After</Label>
                <Input
                  id="followup_days_after"
                  type="number"
                  min="0"
                  value={formData.followup_days_after}
                  onChange={(e) => setFormData({ ...formData, followup_days_after: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* Integration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Integration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="beluga_medicine_id">
                  Beluga Medicine ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="beluga_medicine_id"
                  value={formData.beluga_medicine_id}
                  onChange={(e) => setFormData({ ...formData, beluga_medicine_id: e.target.value })}
                  placeholder="Beluga system ID"
                  required
                />
              </div>

              <div>
                <Label htmlFor="provider_network">Provider Network</Label>
                <Input
                  id="provider_network"
                  value={formData.provider_network}
                  onChange={(e) => setFormData({ ...formData, provider_network: e.target.value })}
                  placeholder="e.g., welliemd"
                />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Settings</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="requires_video_visit">Requires Video Visit</Label>
                <Switch
                  id="requires_video_visit"
                  checked={formData.requires_video_visit}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_video_visit: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="allow_client_modifications">Allow Client Modifications</Label>
                <Switch
                  id="allow_client_modifications"
                  checked={formData.allow_client_modifications}
                  onCheckedChange={(checked) => setFormData({ ...formData, allow_client_modifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sync_to_tenants">Sync to Tenants</Label>
                <Switch
                  id="sync_to_tenants"
                  checked={formData.sync_to_tenants}
                  onCheckedChange={(checked) => setFormData({ ...formData, sync_to_tenants: checked })}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : product ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
