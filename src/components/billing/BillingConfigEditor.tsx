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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
 * Admin component for editing client billing configuration:
 * - Base monthly fee
 * - Per-patient fee rate
 * - Patient fee toggle
 * - Billing anchor day
 * - Billing timezone
 */
export function BillingConfigEditor({ clientId }: BillingConfigEditorProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<Partial<BillingConfig>>({});
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

    // Sync form data when config loads
    useEffect(() => {
        if (config) {
            setFormData({
                b2b_base_fee: config.b2b_base_fee,
                b2b_patient_fee_rate: config.b2b_patient_fee_rate,
                b2b_patient_fee_enabled: config.b2b_patient_fee_enabled,
                b2b_billing_anchor_day: config.b2b_billing_anchor_day,
                b2b_billing_timezone: config.b2b_billing_timezone,
            });
            setIsDirty(false);
        }
    }, [config]);

    const updateMutation = useMutation({
        mutationFn: (data: Partial<BillingConfig>) =>
            clientApi.updateBillingConfig(clientId, data),
        onSuccess: () => {
            toast.success("Billing configuration saved");
            queryClient.invalidateQueries({ queryKey: ["billingConfig", clientId] });
            setIsDirty(false);
        },
        onError: (err: any) => {
            toast.error(err?.message || "Failed to save configuration");
        },
    });

    const handleChange = (field: keyof BillingConfig, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setIsDirty(true);
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
            setFormData({
                b2b_base_fee: config.b2b_base_fee,
                b2b_patient_fee_rate: config.b2b_patient_fee_rate,
                b2b_patient_fee_enabled: config.b2b_patient_fee_enabled,
                b2b_billing_anchor_day: config.b2b_billing_anchor_day,
                b2b_billing_timezone: config.b2b_billing_timezone,
            });
            setIsDirty(false);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Failed to load billing configuration</AlertDescription>
            </Alert>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">Billing Configuration</CardTitle>
                    </div>
                    {isDirty && (
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={handleReset}>
                                Reset
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={handleSaveAndActivate}
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Activating...
                                    </>
                                ) : (
                                    <>
                                        <Play className="mr-2 h-4 w-4" />
                                        Save & Activate Now
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
                <CardDescription>
                    Configure monthly billing settings for this client
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Base Fee */}
                <div className="space-y-2">
                    <Label htmlFor="base_fee" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        Base Monthly Fee
                    </Label>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">$</span>
                        <Input
                            id="base_fee"
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-32"
                            value={formData.b2b_base_fee || ""}
                            onChange={(e) => handleChange("b2b_base_fee", e.target.value)}
                        />
                        <span className="text-sm text-muted-foreground">/ month</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Fixed monthly platform fee charged regardless of patient count
                    </p>
                </div>

                {/* Patient Fee */}
                <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="patient_fee_toggle" className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            Per-Patient Fee
                        </Label>
                        <Switch
                            id="patient_fee_toggle"
                            checked={formData.b2b_patient_fee_enabled ?? true}
                            onCheckedChange={(checked) =>
                                handleChange("b2b_patient_fee_enabled", checked)
                            }
                        />
                    </div>

                    {formData.b2b_patient_fee_enabled && (
                        <div className="space-y-2">
                            <Label htmlFor="patient_fee_rate">Fee per active patient</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">$</span>
                                <Input
                                    id="patient_fee_rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="w-32"
                                    value={formData.b2b_patient_fee_rate || ""}
                                    onChange={(e) =>
                                        handleChange("b2b_patient_fee_rate", e.target.value)
                                    }
                                />
                                <span className="text-sm text-muted-foreground">/ patient / month</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Billing Schedule */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Billing Schedule
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="anchor_day">Billing Anchor Day</Label>
                            <Select
                                value={String(formData.b2b_billing_anchor_day || 1)}
                                onValueChange={(value) =>
                                    handleChange("b2b_billing_anchor_day", parseInt(value))
                                }
                            >
                                <SelectTrigger>
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
                            <p className="text-xs text-muted-foreground">
                                Day of month when billing cycle starts
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="timezone" className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                Timezone
                            </Label>
                            <Select
                                value={formData.b2b_billing_timezone || "UTC"}
                                onValueChange={(value) =>
                                    handleChange("b2b_billing_timezone", value)
                                }
                            >
                                <SelectTrigger>
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
                <Alert>
                    <AlertDescription className="text-xs">
                        <strong>Note:</strong> Changes to billing configuration take effect
                        on the next billing cycle. Mid-cycle changes do not affect the
                        current invoice. Use <strong>Save & Activate Now</strong> to run
                        initial onboarding charge immediately.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
}
