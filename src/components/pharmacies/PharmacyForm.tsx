"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { pharmacyApi, Pharmacy } from "@/api/pharmacyApi";

type Props = {
  mode: "create" | "edit";
  pharmacy?: Pharmacy | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
};

export default function PharmacyForm({ mode, pharmacy, open = true, onOpenChange, onSuccess }: Props) {
  const { register, handleSubmit, reset, setValue } = useForm<Pharmacy>({
    defaultValues: {
      store_name: pharmacy?.store_name ?? "",
      address_1: pharmacy?.address_1 ?? "",
      address_2: pharmacy?.address_2 ?? "",
      city: pharmacy?.city ?? "",
      state: pharmacy?.state ?? "",
      zip_code: pharmacy?.zip_code ?? "",
      primary_phone: pharmacy?.primary_phone ?? "",
      primary_fax: pharmacy?.primary_fax ?? "",
      email: pharmacy?.email ?? "",
      website: pharmacy?.website ?? "",
      ncpdp_id: pharmacy?.ncpdp_id ?? "",
      is_active: pharmacy?.is_active ?? true,
      beluga_pharmacy_id: pharmacy?.beluga_pharmacy_id ?? "",


      api_vendor: pharmacy?.api_vendor ?? "",
      api_url: pharmacy?.api_url ?? "",
      api_user: pharmacy?.api_user ?? "",
      api_password: "",
      practice_id: pharmacy?.practice_id ?? "",
      vendor_id: pharmacy?.vendor_id ?? "",
      location_id: pharmacy?.location_id ?? "",
      network_id: pharmacy?.network_id ?? "",
      api_name: pharmacy?.api_name ?? "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [vendorOptions, setVendorOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    pharmacyApi.vendors().then(setVendorOptions).catch(() => setVendorOptions([]));
  }, []);

  useEffect(() => {
    if (pharmacy) {
      // keep password empty for edit by default
      Object.entries(pharmacy).forEach(([k, v]) => setValue(k as any, v as any));
      setValue("api_password", "");
    }
  }, [pharmacy, setValue]);

  const onSubmit = async (data: Pharmacy) => {
    try {
      setLoading(true);

      // Split core + integration, so we can call right endpoints if editing integration only later
      const corePayload: Partial<Pharmacy> = {
        store_name: data.store_name,
        address_1: data.address_1,
        address_2: data.address_2,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        primary_phone: data.primary_phone,
        primary_fax: data.primary_fax,
        email: data.email,
        website: data.website,
        ncpdp_id: data.ncpdp_id,
        is_active: data.is_active,
      };

      const integrationPayload: Partial<Pharmacy> = {
        api_vendor: data.api_vendor,
        api_url: data.api_url,
        api_user: data.api_user,
        // send api_password only if user typed something
        ...(data.api_password ? { api_password: data.api_password } : {}),
        practice_id: data.practice_id,
        vendor_id: data.vendor_id,
        location_id: data.location_id,
        network_id: data.network_id,
        api_name: data.api_name,
      };

      if (mode === "edit" && pharmacy?.id) {
        // update core
        await pharmacyApi.update(pharmacy.id, corePayload);
        // update integration (separate endpoint)
        await pharmacyApi.updateIntegration(pharmacy.id, integrationPayload);
        alert("Pharmacy updated successfully!");
      } else {
        // create in one go (backend accepts extra fields)
        await pharmacyApi.create({ ...corePayload, ...integrationPayload });
        alert("Pharmacy created successfully!");
        reset();
      }

      onOpenChange?.(false);
      onSuccess?.();
    } catch (e) {
      console.error(e);
      alert(mode === "edit" ? "Error updating pharmacy" : "Error creating pharmacy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => onOpenChange?.(v)}>
      <DialogTrigger className="hidden" />
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
        <div className="px-6 pt-6">
          <h2 className="text-2xl font-semibold">
            {mode === "edit" ? `Edit Pharmacy${pharmacy?.store_name ? `: ${pharmacy.store_name}` : ""}` : "Create New Pharmacy"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Manage pharmacy info and integration credentials.
          </p>
        </div>

        <div className="px-6 max-h-[70vh] overflow-y-auto">
          <form id="pharmacy-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-24">
            {/* Basic Info */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Pharmacy Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Pharmacy Name *</label>
                  <input {...register("store_name", { required: true })} className="border px-3 py-2 rounded w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Active</label>
                  <input type="checkbox" {...register("is_active")} className="h-4 w-4" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Address 1 *</label>
                  <input {...register("address_1", { required: true })} className="border px-3 py-2 rounded w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address 2</label>
                  <input {...register("address_2")} className="border px-3 py-2 rounded w-full" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <input {...register("city", { required: true })} className="border px-3 py-2 rounded w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State *</label>
                  <input {...register("state", { required: true })} className="border px-3 py-2 rounded w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Zip Code *</label>
                  <input {...register("zip_code", { required: true })} className="border px-3 py-2 rounded w-full" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input {...register("primary_phone")} className="border px-3 py-2 rounded w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fax</label>
                  <input {...register("primary_fax")} className="border px-3 py-2 rounded w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">NCPDP ID</label>
                  <input {...register("ncpdp_id")} className="border px-3 py-2 rounded w-full" />
                </div>


                <div>
                <label className="block text-sm font-medium mb-1">Beluga Pharmacy ID</label>
                <input
                    {...register("beluga_pharmacy_id")}
                    placeholder="e.g. 110373"
                    className="border px-3 py-2 rounded w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                    Optional. Only used if you want to link to an existing Beluga pharmacy.
                </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" {...register("email")} className="border px-3 py-2 rounded w-full" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Website</label>
                  <input type="url" {...register("website")} className="border px-3 py-2 rounded w-full" />
                </div>
              </div>
            </div>

            {/* Integration */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Prescription Push Pharmacy API Integration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Pharmacy API</label>
                  <select {...register("api_vendor")} className="border px-3 py-2 rounded w-full bg-white">
                    <option value="">— Not configured —</option>
                    {vendorOptions.map((v) => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">API URL</label>
                  <input {...register("api_url")} className="border px-3 py-2 rounded w-full" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">API User</label>
                  <input {...register("api_user")} className="border px-3 py-2 rounded w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">API Password</label>
                  <input type="password" {...register("api_password")} className="border px-3 py-2 rounded w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">API Name</label>
                  <input {...register("api_name")} className="border px-3 py-2 rounded w-full" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Practice ID</label>
                  <input {...register("practice_id")} className="border px-3 py-2 rounded w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vendor ID</label>
                  <input {...register("vendor_id")} className="border px-3 py-2 rounded w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location ID</label>
                  <input {...register("location_id")} className="border px-3 py-2 rounded w-full" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Network ID</label>
                  <input {...register("network_id")} className="border px-3 py-2 rounded w-full" />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t px-6 py-4 flex justify-end">
          <button
            type="submit"
            form="pharmacy-form"
            disabled={loading}
            className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-md transition"
          >
            {loading ? (mode === "edit" ? "Saving..." : "Creating...") : mode === "edit" ? "Save changes" : "Create Pharmacy"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
