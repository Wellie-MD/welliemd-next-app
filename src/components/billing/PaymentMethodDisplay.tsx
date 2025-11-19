import { useQuery } from "@tanstack/react-query";
import { CreditCard, AlertCircle, Loader2, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { clientApi, PaymentMethodInfo } from "@/api/clientApi";

interface PaymentMethodDisplayProps {
  clientId: string;
}

export function PaymentMethodDisplay({ clientId }: PaymentMethodDisplayProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["paymentMethod", clientId],
    queryFn: () => clientApi.getPaymentMethod(clientId),
    enabled: !!clientId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
          <CardDescription>Saved payment method for billing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
          <CardDescription>Saved payment method for billing</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load payment method. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const paymentMethod = data?.payment_method;

  if (!paymentMethod || data?.status === "none") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
          <CardDescription>Saved payment method for billing</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No payment method on file. Add a payment method to enable billing.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Method
        </CardTitle>
        <CardDescription>Saved payment method for billing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            {/* Card Display */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded text-white font-semibold text-xs">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-lg">{paymentMethod.display_name}</p>
                <p className="text-sm text-muted-foreground">
                  {paymentMethod.brand} ending in {paymentMethod.last4}
                </p>
              </div>
            </div>

            {/* Expiry and Gateway */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Expires</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{paymentMethod.expiry_display}</p>
                  {paymentMethod.is_expired && (
                    <Badge variant="destructive" className="text-xs">
                      Expired
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Gateway</p>
                <p className="text-sm font-medium">{paymentMethod.gateway_display}</p>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div>
            {paymentMethod.is_expired ? (
              <Badge variant="destructive">Expired</Badge>
            ) : (
              <Badge variant="default" className="bg-green-500">
                Active
              </Badge>
            )}
          </div>
        </div>

        {/* Warning for expired cards */}
        {paymentMethod.is_expired && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This payment method has expired. Please update the payment method to continue billing.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
