"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axiosInstance from "@/api/axiosInstance";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";

type ProductFormValues = {
  name: string;
  description?: string;
  application_directions?: string;
  product_image?: File | null;

  price: string;
  cost?: string;
  base_shipping_cost?: string;
  shipping_fee?: string;

  dose?: string;
  quantity?: number;
  refills?: number;
  rx_quantity?: number;
  rx_drug_strength?: string;
  rx_days_supply?: number;
  rx_drug_form?: string;

  ndic_number?: string;
  manufacturer_name?: string;
  purchase_type: string;
  safety_info?: string;
  side_effects?: string;
};

type Product = {
  id: number | string;
  name: string;
  description?: string | null;
  application_directions?: string | null;
  product_image?: string | null;
  price: string | number;
  cost: string | number;
  base_shipping_cost: string | number;
  shipping_fee: string | number;
  dose?: string | null;
  quantity: number;
  refills: number;
  rx_quantity: number;
  rx_drug_strength?: string | null;
  rx_days_supply: number;
  rx_drug_form?: string | null;
  ndic_number?: string | null;
  manufacturer_name?: string | null;
  purchase_type: string;
  safety_info?: string | null;
  side_effects?: string | null;
};

export default function AddProductForm({
  mode,
  open,
  onOpenChange,
  onSuccess,
  product,
}: {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
  product?: Product | null;
}) {
  const { register, handleSubmit, reset, setValue, watch } =
    useForm<ProductFormValues>({
      defaultValues: {
        name: "",
        description: "",
        application_directions: "",
        price: "0.00",
        cost: "",
        base_shipping_cost: "",
        shipping_fee: "",
        dose: "",
        quantity: 1,
        refills: 0,
        rx_quantity: 1,
        rx_drug_strength: "",
        rx_days_supply: 30,
        rx_drug_form: "",
        ndic_number: "",
        manufacturer_name: "",
        purchase_type: "One Time",
        safety_info: "",
        side_effects: "",
        product_image: null,
      },
    });

  const [loading, setLoading] = useState(false);

  // preload for edit
  useEffect(() => {
    if (mode === "edit" && product) {
      reset({
        name: product.name ?? "",
        description: product.description ?? "",
        application_directions: product.application_directions ?? "",
        price: String(product.price ?? "0.00"),
        cost: product.cost ? String(product.cost) : "",
        base_shipping_cost: product.base_shipping_cost
          ? String(product.base_shipping_cost)
          : "",
        shipping_fee: product.shipping_fee ? String(product.shipping_fee) : "",
        dose: product.dose ?? "",
        quantity: product.quantity ?? 1,
        refills: product.refills ?? 0,
        rx_quantity: product.rx_quantity ?? 1,
        rx_drug_strength: product.rx_drug_strength ?? "",
        rx_days_supply: product.rx_days_supply ?? 30,
        rx_drug_form: product.rx_drug_form ?? "",
        ndic_number: product.ndic_number ?? "",
        manufacturer_name: product.manufacturer_name ?? "",
        purchase_type: product.purchase_type ?? "One Time",
        safety_info: product.safety_info ?? "",
        side_effects: product.side_effects ?? "",
        product_image: null,
      });
    }
  }, [mode, product, reset]);

  const buildFormData = (data: ProductFormValues) => {
    const fd = new FormData();
    // append only defined fields
    const entries: [string, unknown][] = [
      ["name", data.name],
      ["description", data.description],
      ["application_directions", data.application_directions],
      ["price", data.price],
      ["cost", data.cost],
      ["base_shipping_cost", data.base_shipping_cost],
      ["shipping_fee", data.shipping_fee],
      ["dose", data.dose],
      ["quantity", data.quantity],
      ["refills", data.refills],
      ["rx_quantity", data.rx_quantity],
      ["rx_drug_strength", data.rx_drug_strength],
      ["rx_days_supply", data.rx_days_supply],
      ["rx_drug_form", data.rx_drug_form],
      ["ndic_number", data.ndic_number],
      ["manufacturer_name", data.manufacturer_name],
      ["purchase_type", data.purchase_type],
      ["safety_info", data.safety_info],
      ["side_effects", data.side_effects],
    ];
    for (const [k, v] of entries) {
      if (v !== undefined && v !== null && v !== "") fd.append(k, String(v));
    }
    const file = data.product_image;
    if (file instanceof File) {
      fd.append("product_image", file);
    }
    return fd;
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setLoading(true);
      if (mode === "create") {
        const fd = buildFormData(data);
        await axiosInstance.post("/products/", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Product created");
      } else if (product) {
        const fd = buildFormData(data);
        await axiosInstance.patch(`/products/${product.id}/`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Product updated");
      }
      onSuccess?.();
      onOpenChange(false);
      reset();
    } catch (err) {
      console.error(err);
      alert("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className="hidden" />
      <DialogContent className="max-w-3xl w-full">
        <h2 className="text-xl font-bold mb-4">
          {mode === "create"
            ? "Add New Product"
            : `Edit Product: ${product?.name ?? ""}`}
        </h2>

        {/* Scrollable body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-h-[70vh] overflow-y-auto pr-1"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <input
                  {...register("name", { required: true })}
                  className="border px-3 py-2 rounded w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Manufacturer</label>
                <input
                  {...register("manufacturer_name")}
                  className="border px-3 py-2 rounded w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Purchase Type</label>
                <select
                  {...register("purchase_type")}
                  className="border px-3 py-2 rounded w-full"
                >
                  <option value="One Time">One Time</option>
                  <option value="Subscription">Subscription</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Price</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("price", { required: true })}
                  className="border px-3 py-2 rounded w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("cost")}
                    className="border px-3 py-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Shipping Fee</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("shipping_fee")}
                    className="border px-3 py-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Base Shipping Cost
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("base_shipping_cost")}
                    className="border px-3 py-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    NDC / NDIC Number
                  </label>
                  <input
                    {...register("ndic_number")}
                    className="border px-3 py-2 rounded w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setValue("product_image", e.target.files?.[0] ?? null)
                  }
                  className="border px-3 py-2 rounded w-full"
                />
              </div>
            </div>

            {/* Right */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Dose</label>
                  <input
                    {...register("dose")}
                    className="border px-3 py-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Drug Form</label>
                  <input
                    {...register("rx_drug_form")}
                    className="border px-3 py-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <input
                    type="number"
                    {...register("quantity", { valueAsNumber: true })}
                    className="border px-3 py-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Refills</label>
                  <input
                    type="number"
                    {...register("refills", { valueAsNumber: true })}
                    className="border px-3 py-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Rx Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("rx_quantity", { valueAsNumber: true })}
                    className="border px-3 py-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Drug Strength</label>
                  <input
                    {...register("rx_drug_strength")}
                    placeholder="e.g., 5mg/ml"
                    className="border px-3 py-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Rx Days Supply</label>
                  <input
                    type="number"
                    {...register("rx_days_supply", { valueAsNumber: true })}
                    className="border px-3 py-2 rounded w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  rows={3}
                  {...register("description")}
                  className="border px-3 py-2 rounded w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Application Directions
                </label>
                <textarea
                  rows={3}
                  {...register("application_directions")}
                  className="border px-3 py-2 rounded w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Safety Info</label>
                  <textarea
                    rows={3}
                    {...register("safety_info")}
                    className="border px-3 py-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Side Effects</label>
                  <textarea
                    rows={3}
                    {...register("side_effects")}
                    className="border px-3 py-2 rounded w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 text-right">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition"
            >
              {loading
                ? mode === "create"
                  ? "Creating…"
                  : "Saving…"
                : mode === "create"
                ? "Create Product"
                : "Save changes"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
