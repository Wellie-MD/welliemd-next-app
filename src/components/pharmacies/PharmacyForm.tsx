"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { pharmacyApi, Pharmacy } from "@/api/pharmacyApi";
import { toast } from "@/components/ui/use-toast";

type Props = {
  mode: "create" | "edit";
  pharmacy?: Pharmacy | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
};

export default function PharmacyForm({ mode, pharmacy, open = true, onOpenChange, onSuccess }: Props) {
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Pharmacy>({
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
      Object.entries(pharmacy).forEach(([k, v]) => setValue(k as any, v as any));
      setValue("api_password", ""); // keep blank on edit
    }
  }, [pharmacy, setValue]);

  const onSubmit = async (data: Pharmacy) => {
    try {
      setLoading(true);

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
        ...(data.api_password ? { api_password: data.api_password } : {}),
        practice_id: data.practice_id,
        vendor_id: data.vendor_id,
        location_id: data.location_id,
        network_id: data.network_id,
        api_name: data.api_name,
      };

      if (mode === "edit" && pharmacy?.id) {
        await pharmacyApi.update(pharmacy.id, corePayload);
        await pharmacyApi.updateIntegration(pharmacy.id, integrationPayload);
        toast({
          title: "Success",
          description: "Pharmacy updated successfully!",
        });
      } else {
        await pharmacyApi.create({ ...corePayload, ...integrationPayload });
        toast({
          title: "Success",
          description: "Pharmacy created successfully!",
        });
        reset();
      }

      onOpenChange?.(false);
      onSuccess?.();
    } catch (e: any) {
      console.error(e);
      const errorMessage = e?.response?.data?.error || 
                          e?.response?.data?.detail || 
                          e?.message || 
                          (mode === "edit" ? "Error updating pharmacy" : "Error creating pharmacy");
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => onOpenChange?.(v)}>
      <DialogTrigger className="hidden" />
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="px-6 pt-6">
          <h2 className="text-2xl font-semibold">
            {mode === "edit" ? `Edit Pharmacy${pharmacy?.store_name ? `: ${pharmacy.store_name}` : ""}` : "Create New Pharmacy"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Manage pharmacy info and integration credentials.
          </p>
        </div>

        <div className="px-6 max-h-[calc(90vh-180px)] overflow-y-auto scrollbar-hide">
          <form id="pharmacy-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-24">
            {/* Basic Info */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Pharmacy Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Pharmacy Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    {...register("store_name", { 
                      required: "Pharmacy name is required" 
                    })} 
                    className="border px-3 py-2 rounded w-full" 
                  />
                  {errors.store_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.store_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Active</label>
                  <input type="checkbox" {...register("is_active")} className="h-4 w-4" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Address 1 <span className="text-red-500">*</span>
                  </label>
                  <input 
                    {...register("address_1", { 
                      required: "Address is required" 
                    })} 
                    className="border px-3 py-2 rounded w-full" 
                  />
                  {errors.address_1 && (
                    <p className="text-red-500 text-xs mt-1">{errors.address_1.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address 2</label>
                  <input {...register("address_2")} className="border px-3 py-2 rounded w-full" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input 
                    {...register("city", { 
                      required: "City is required" 
                    })} 
                    className="border px-3 py-2 rounded w-full" 
                  />
                  {errors.city && (
                    <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input 
                    {...register("state", { 
                      required: "State is required",
                      maxLength: { value: 2, message: "State must be 2 characters" },
                      pattern: { value: /^[A-Z]{2}$/, message: "State must be 2 uppercase letters" }
                    })} 
                    className="border px-3 py-2 rounded w-full" 
                    maxLength={2}
                    placeholder="e.g., NY"
                  />
                  {errors.state && (
                    <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Zip Code <span className="text-red-500">*</span>
                  </label>
                  <input 
                    {...register("zip_code", { 
                      required: "Zip code is required" 
                    })} 
                    className="border px-3 py-2 rounded w-full" 
                  />
                  {errors.zip_code && (
                    <p className="text-red-500 text-xs mt-1">{errors.zip_code.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input 
                    {...register("primary_phone", { 
                      required: "Phone number is required" 
                    })} 
                    className="border px-3 py-2 rounded w-full" 
                  />
                  {errors.primary_phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.primary_phone.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Fax <span className="text-red-500">*</span>
                  </label>
                  <input 
                    {...register("primary_fax", { 
                      required: "Fax number is required" 
                    })} 
                    className="border px-3 py-2 rounded w-full" 
                  />
                  {errors.primary_fax && (
                    <p className="text-red-500 text-xs mt-1">{errors.primary_fax.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    NCPDP ID <span className="text-red-500">*</span>
                  </label>
                  <input 
                    {...register("ncpdp_id", { 
                      required: "NCPDP ID is required" 
                    })} 
                    className="border px-3 py-2 rounded w-full" 
                  />
                  {errors.ncpdp_id && (
                    <p className="text-red-500 text-xs mt-1">{errors.ncpdp_id.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Beluga Pharmacy ID</label>
                  <input {...register("beluga_pharmacy_id")} placeholder="e.g. 110373" className="border px-3 py-2 rounded w-full" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional. Only used if you want to link to an existing Beluga pharmacy.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="email"
                    {...register("email", { 
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address"
                      }
                    })} 
                    className="border px-3 py-2 rounded w-full" 
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Website <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="url"
                    {...register("website", { 
                      required: "Website is required" 
                    })} 
                    className="border px-3 py-2 rounded w-full" 
                    placeholder="https://example.com"
                  />
                  {errors.website && (
                    <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* API Integration */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Prescription Push Pharmacy API Integration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Pharmacy API <span className="text-red-500">*</span>
                  </label>
                  <select 
                    {...register("api_vendor", { 
                      required: "Pharmacy API is required" 
                    })} 
                    className="border px-3 py-2 rounded w-full"
                  >
                    <option value="">— Not configured —</option>
                    {vendorOptions.map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
))}
                  </select>
                  {errors.api_vendor && (
                    <p className="text-red-500 text-xs mt-1">{errors.api_vendor.message}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    API URL <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="url"
                    {...register("api_url", { 
                      required: "API URL is required" 
                    })} 
                    className="border px-3 py-2 rounded w-full" 
                  />
                  {errors.api_url && (
                    <p className="text-red-500 text-xs mt-1">{errors.api_url.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    API User <span className="text-red-500">*</span>
                  </label>
                  <input 
                    {...register("api_user", { 
                      required: "API User is required" 
                    })} 
                    className="border px-3 py-2 rounded w-full" 
                  />
                  {errors.api_user && (
                    <p className="text-red-500 text-xs mt-1">{errors.api_user.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    API Password <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="password"
                    {...register("api_password", { 
                      required: "API Password is required" 
                    })} 
                    className="border px-3 py-2 rounded w-full" 
                  />
                  {errors.api_password && (
                    <p className="text-red-500 text-xs mt-1">{errors.api_password.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Practice ID <span className="text-red-500">*</span>
                  </label>
                  <input 
                    {...register("practice_id", { 
                      required: "Practice ID is required" 
                    })} 
                    className="border px-3 py-2 rounded w-full" 
                  />
                  {errors.practice_id && (
                    <p className="text-red-500 text-xs mt-1">{errors.practice_id.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Vendor ID <span className="text-red-500">*</span>
                  </label>
                  <input 
                    {...register("vendor_id", { 
                      required: "Vendor ID is required" 
                    })} 
                    className="border px-3 py-2 rounded w-full" 
                  />
                  {errors.vendor_id && (
                    <p className="text-red-500 text-xs mt-1">{errors.vendor_id.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Location ID <span className="text-red-500">*</span>
                  </label>
                  <input 
                    {...register("location_id", { 
                      required: "Location ID is required" 
                    })} 
                    className="border px-3 py-2 rounded w-full" 
                  />
                  {errors.location_id && (
                    <p className="text-red-500 text-xs mt-1">{errors.location_id.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Network ID <span className="text-red-500">*</span>
                  </label>
                  <input 
                    {...register("network_id", { 
                      required: "Network ID is required" 
                    })} 
                    className="border px-3 py-2 rounded w-full" 
                  />
                  {errors.network_id && (
                    <p className="text-red-500 text-xs mt-1">{errors.network_id.message}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    API Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    {...register("api_name", { 
                      required: "API Name is required" 
                    })} 
                    className="border px-3 py-2 rounded w-full" 
                  />
                  {errors.api_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.api_name.message}</p>
                  )}
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
