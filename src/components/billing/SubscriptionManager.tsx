import { useState } from "react";
import { Plus, AlertCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SubscriptionForm } from "./SubscriptionForm";

interface SubscriptionManagerProps {
  clientId: string;
  hasPaymentMethod: boolean;
  paymentMethodStatus?: 'no_customer' | 'no_payment_method' | 'active';
}

export function SubscriptionManager({ clientId, hasPaymentMethod, paymentMethodStatus = 'no_customer' }: SubscriptionManagerProps) {
  // LEGACY COMPONENT:
  // Stripe-managed subscription creation is deprecated in favor of
  // custom billing config + activation flow.
  // Kept only for backward compatibility and should not be used for new tenants.
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const handleCreateSubscription = () => {
    if (!hasPaymentMethod) {
      return; // Button should be disabled, but double-check
    }
    setShowSubscriptionModal(true);
  };

  const handleSubscriptionSuccess = () => {
    setShowSubscriptionModal(false);
    // Optionally refresh client data or show success message
  };

  const getDisabledReason = () => {
    if (paymentMethodStatus === 'no_customer') {
      return 'Client must add payment method from Client Portal first';
    }
    if (paymentMethodStatus === 'no_payment_method') {
      return 'Client has started payment setup but not completed it yet';
    }
    if (!hasPaymentMethod) {
      return 'Payment method required before creating subscription';
    }
    return '';
  };

  const disabledReason = getDisabledReason();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Management
          </CardTitle>
          <CardDescription>
            Manage billing subscriptions for this client
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasPaymentMethod && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                A payment method is required before creating a subscription. 
                {paymentMethodStatus === 'no_customer' && ' The client needs to add their payment method from the Client Portal.'}
                {paymentMethodStatus === 'no_payment_method' && ' The client has started but not completed payment method setup.'}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Create New Subscription</p>
              <p className="text-xs text-muted-foreground">
                Set up recurring billing for this client
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      onClick={handleCreateSubscription}
                      disabled={!hasPaymentMethod}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create Subscription
                    </Button>
                  </span>
                </TooltipTrigger>
                {disabledReason && (
                  <TooltipContent>
                    <p>{disabledReason}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          {!hasPaymentMethod && (
            <p className="text-xs text-muted-foreground">
              Note: Client must add payment method before subscription creation is enabled.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Subscription Creation Modal */}
      <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Subscription</DialogTitle>
            <DialogDescription>
              Set up a recurring billing subscription for this client
            </DialogDescription>
          </DialogHeader>
          <SubscriptionForm
            clientId={clientId}
            onSuccess={handleSubscriptionSuccess}
            onCancel={() => setShowSubscriptionModal(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
