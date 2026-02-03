import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { clientApi } from "@/api/clientApi";

interface SubscriptionFormProps {
  clientId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SubscriptionForm({ clientId, onSuccess, onCancel }: SubscriptionFormProps) {
  const [selectedPriceId, setSelectedPriceId] = useState<string>("");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available Stripe prices
  const { data: pricesData, isLoading: isLoadingPrices } = useQuery({
    queryKey: ["stripePrices"],
    queryFn: () => clientApi.listStripePrices(),
  });

  // Fetch payment method to get payment_method_id
  const { data: paymentMethodData } = useQuery({
    queryKey: ["paymentMethod", clientId],
    queryFn: () => clientApi.getPaymentMethod(clientId),
    enabled: !!clientId,
  });

  // Extract payment method ID when data is available
  useEffect(() => {
    if (paymentMethodData?.payment_method?.id) {
      setPaymentMethodId(paymentMethodData.payment_method.id);
    }
  }, [paymentMethodData]);

  const prices = Array.isArray(pricesData) ? pricesData : pricesData?.prices || [];
  const monthlyPrices = prices.filter((price: any) => price.recurring?.interval === "month" && price.active);
  const basePrices = monthlyPrices.filter((price: any) => price.recurring?.usage_type !== "metered");
  const meteredPrices = monthlyPrices.filter((price: any) => price.recurring?.usage_type === "metered");
  
  // Get selected price details
  const selectedPrice = basePrices.find((price: any) => price.id === selectedPriceId);
  const selectedMeteredPrice = meteredPrices[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPriceId) {
      setError("Please select a subscription plan");
      return;
    }

    if (!paymentMethodId) {
      setError("Payment method not found. Please add a payment method first.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = selectedMeteredPrice
        ? {
            base_price_id: selectedPriceId,
            metered_price_id: selectedMeteredPrice.id,
            payment_method_id: paymentMethodId,
          }
        : {
            price_id: selectedPriceId,
            payment_method_id: paymentMethodId,
          };

      // Call the actual subscription creation API
      await clientApi.createSubscription(clientId, payload);

      toast({
        title: "Subscription Created",
        description: `Successfully created subscription for this client`,
      });

      onSuccess();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || "Failed to create subscription";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingPrices) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading subscription plans...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Plan Selection */}
      <div className="space-y-2">
        <Label htmlFor="plan">Subscription Plan</Label>
        <Select value={selectedPriceId} onValueChange={setSelectedPriceId}>
          <SelectTrigger id="plan">
            <SelectValue placeholder="Select a plan" />
          </SelectTrigger>
          <SelectContent>
            {basePrices.length === 0 ? (
              <SelectItem value="none" disabled>
                No plans available
              </SelectItem>
            ) : (
              basePrices.map((price: any) => (
                <SelectItem key={price.id} value={price.id}>
                  {price.product?.name || "Subscription"} - $
                  {Number(price.unit_amount).toFixed(2)}/
                  {price.recurring?.interval || "month"}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select a subscription plan from your Stripe account
        </p>
      </div>

      {/* Price Display */}
      {selectedPrice && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{selectedPrice.product?.name || "Subscription"}</p>
              <p className="text-sm text-muted-foreground">
                Billed {selectedPrice.recurring?.interval || "monthly"}
              </p>
              {selectedMeteredPrice && (
                <p className="text-xs text-muted-foreground">
                  Usage price: ${Number(selectedMeteredPrice.unit_amount).toFixed(2)} per active patient
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                ${Number(selectedPrice.unit_amount).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                per {selectedPrice.recurring?.interval || "month"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !selectedPriceId || !paymentMethodId}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Subscription"
          )}
        </Button>
      </div>

      {!paymentMethodId && (
        <Alert>
          <AlertDescription className="text-xs">
            Note: A payment method is required to create a subscription. Please add a payment method first.
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}
