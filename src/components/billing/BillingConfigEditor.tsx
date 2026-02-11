import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Settings,
    Save,
    Loader2,
    AlertTriangle,
    Calendar,
    Globe,
    DollarSign,
    Users,
    Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { clientApi } from "@/api/clientApi";
import type { BillingConfig } from "@/types/b2bBilling";
import { toast } from "sonner";

interface BillingConfigEditorProps {
    clientId: string;
}

// Common timezones for billing
const TIMEZONES = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix",
    "Pacific/Honolulu",
];

/**
 * BillingConfigEditor
 * 
 * Admin component for editing client billing configuration.
 * Styled to match billing_tab.html Section 3.
 */
export function BillingConfigEditor({ clientId }: BillingConfigEditorProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<Partial<BillingConfig>>({});
    const [initialFormData, setInitialFormData] = useState<Partial<BillingConfig>>({});
    const [isDirty, setIsDirty] = useState(false);

    const {
        data: config,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["billingConfig", clientId],
        queryFn: () => clientApi.getBillingConfig(clientId),
        enabled: !!clientId,
    });

    const { data: billingStatus } = useQuery({
        queryKey: ["b2bBillingStatus", clientId],
        queryFn: () => clientApi.getB2BBillingStatus(clientId),
        enabled: !!clientId,
    });

    // Sync form data when config loads
    useEffect(() => {
        if (config) {
            const nextFormData: Partial<BillingConfig> = {
                b2b_base_fee: config.b2b_base_fee,
                b2b_patient_fee_rate: config.b2b_patient_fee_rate,
                b2b_patient_fee_enabled: config.b2b_patient_fee_enabled,
                b2b_billing_anchor_day: config.b2b_billing_anchor_day,
                b2b_billing_timezone: config.b2b_billing_timezone,
            };
            setFormData(nextFormData);
            setInitialFormData(nextFormData);
            setIsDirty(false);
        }
    }, [config]);

    const normalizeForDirtyCheck = (data: Partial<BillingConfig>) => ({
        b2b_base_fee: String(data.b2b_base_fee ?? ""),
        b2b_patient_fee_rate: String(data.b2b_patient_fee_rate ?? ""),
        b2b_patient_fee_enabled: Boolean(data.b2b_patient_fee_enabled),
        b2b_billing_anchor_day: Number(data.b2b_billing_anchor_day ?? 1),
        b2b_billing_timezone: String(data.b2b_billing_timezone ?? "UTC"),
    });

    useEffect(() => {
        const current = JSON.stringify(normalizeForDirtyCheck(formData));
        const initial = JSON.stringify(normalizeForDirtyCheck(initialFormData));
        setIsDirty(current !== initial);
    }, [formData, initialFormData]);

    const updateMutation = useMutation({
        mutationFn: (data: Partial<BillingConfig>) =>
            clientApi.updateBillingConfig(clientId, data),
        onSuccess: () => {
            toast.success("Billing configuration saved");
            queryClient.invalidateQueries({ queryKey: ["billingConfig", clientId] });
            queryClient.invalidateQueries({ queryKey: ["b2bBillingStatus", clientId] });
            setIsDirty(false);
        },
        onError: (err: any) => {
            toast.error(err?.message || "Failed to save configuration");
        },
    });

    const handleChange = (field: keyof BillingConfig, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        updateMutation.mutate(formData);
    };

    const handleSaveAndActivate = () => {
        updateMutation.mutate(
            {
                ...formData,
                activate_subscription_now: true,
            },
            {
                onSuccess: () => {
                    toast.success("Billing configuration saved and initial charge attempted");
                    queryClient.invalidateQueries({ queryKey: ["billingConfig", clientId] });
                    queryClient.invalidateQueries({ queryKey: ["b2bBillingStatus", clientId] });
                    setIsDirty(false);
                },
            }
        );
    };

    const handleReset = () => {
        if (config) {
            const resetData: Partial<BillingConfig> = {
                b2b_base_fee: config.b2b_base_fee,
                b2b_patient_fee_rate: config.b2b_patient_fee_rate,
                b2b_patient_fee_enabled: config.b2b_patient_fee_enabled,
                b2b_billing_anchor_day: config.b2b_billing_anchor_day,
                b2b_billing_timezone: config.b2b_billing_timezone,
            };
            setFormData(resetData);
            setInitialFormData(resetData);
            setIsDirty(false);
        }
    };

    const subscriptionStatus = billingStatus?.subscription_status || "inactive";
    const canShowActivateNow =
        subscriptionStatus === "inactive" || subscriptionStatus === "canceled";
    const hasActivePaymentMethod = billingStatus?.payment_method_status === "active";
    const activationLabel =
        subscriptionStatus === "canceled" ? "Save & Reactivate Now" : "Save & Activate Now";

    if (isLoading) {
        return (
            <section className="bg-card rounded-2xl border shadow-sm p-8 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </section>
        );
    }

    if (error) {
        return (
            <section className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                <div className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 p-2 rounded-full">
                    <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-red-700 dark:text-red-400">Error</h3>
                    <p className="text-sm text-red-600 dark:text-red-300">Failed to load billing configuration</p>
                </div>
            </section>
        );
    }

    return (
        <section className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Billing Configuration
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Configure monthly billing settings</p>
            </div>

            <div className="p-4 space-y-6">
                {/* Base Monthly Fee */}
                <div>
                    <Label htmlFor="base_fee" className="text-sm font-medium flex items-center gap-1 mb-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        Base Monthly Fee
                    </Label>
                    <div className="flex items-center gap-2">
                        <div className="relative w-32">
                            <span className="absolute left-3 top-2 text-muted-foreground">$</span>
                            <Input
                                id="base_fee"
                                type="number"
                                step="0.01"
                                min="0"
                                className="pl-6 bg-card"
                                value={formData.b2b_base_fee || ""}
                                onChange={(e) => handleChange("b2b_base_fee", e.target.value)}
                            />
                        </div>
                        <span className="text-sm text-muted-foreground">/ month</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Fixed monthly platform fee regardless of patient count
                    </p>
                </div>

                {/* Per-Patient Fee */}
                <div className="bg-muted/50 rounded-xl p-4 border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <span className="text-sm font-medium">Per-Patient Fee</span>
                        </div>
                        <Switch
                            id="patient_fee_toggle"
                            checked={formData.b2b_patient_fee_enabled ?? true}
                            onCheckedChange={(checked) =>
                                handleChange("b2b_patient_fee_enabled", checked)
                            }
                        />
                    </div>
                    {formData.b2b_patient_fee_enabled && (
                        <div className="pl-0 sm:pl-8">
                            <Label htmlFor="patient_fee_rate" className="block text-xs font-medium text-muted-foreground mb-1.5">
                                Fee per active patient
                            </Label>
                            <div className="flex items-center gap-2">
                                <div className="relative w-32">
                                    <span className="absolute left-3 top-2 text-muted-foreground">$</span>
                                    <Input
                                        id="patient_fee_rate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="pl-6 bg-card"
                                        value={formData.b2b_patient_fee_rate || ""}
                                        onChange={(e) =>
                                            handleChange("b2b_patient_fee_rate", e.target.value)
                                        }
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground">/ patient / month</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Billing Schedule */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <h3 className="text-sm font-semibold">Billing Schedule</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="anchor_day" className="block text-xs font-medium text-muted-foreground mb-1.5">
                                Billing Anchor Day
                            </Label>
                            <Select
                                value={String(formData.b2b_billing_anchor_day || 1)}
                                onValueChange={(value) =>
                                    handleChange("b2b_billing_anchor_day", parseInt(value))
                                }
                            >
                                <SelectTrigger className="bg-card">
                                    <SelectValue placeholder="Select day" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                                        <SelectItem key={day} value={String(day)}>
                                            {day}{day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground mt-1">
                                Day of month when billing cycle starts
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="timezone" className="block text-xs font-medium text-muted-foreground mb-1.5">
                                Timezone
                            </Label>
                            <Select
                                value={formData.b2b_billing_timezone || "UTC"}
                                onValueChange={(value) =>
                                    handleChange("b2b_billing_timezone", value)
                                }
                            >
                                <SelectTrigger className="bg-card">
                                    <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIMEZONES.map((tz) => (
                                        <SelectItem key={tz} value={tz}>
                                            {tz.replace("_", " ")}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3 rounded-lg text-xs text-muted-foreground">
                    <span className="font-bold text-blue-700 dark:text-blue-400">Note:</span>{" "}
                    Changes to billing configuration take effect on the next billing cycle.
                    Mid-cycle changes do not affect the current invoice.
                    {canShowActivateNow ? (
                        <>
                            {" "}Use <strong>{activationLabel}</strong> to run initial onboarding charge immediately.
                        </>
                    ) : (
                        <> No immediate charge is run when saving while subscription is active.</>
                    )}
                </div>

                {/* Action Buttons */}
                {isDirty && (
                    <div className="flex items-center gap-2 justify-end pt-2">
                        <Button variant="ghost" size="sm" onClick={handleReset}>
                            Reset
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                            className="flex items-center gap-1"
                        >
                            {updateMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                        {canShowActivateNow && (
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={handleSaveAndActivate}
                                disabled={updateMutation.isPending || !hasActivePaymentMethod}
                                className="flex items-center gap-1"
                            >
                                {updateMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Activating...
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4" />
                                        {activationLabel}
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
