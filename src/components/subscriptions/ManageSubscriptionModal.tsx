import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '@/api/subscriptionApi';
import { Client } from '@/api/clientApi';
import { Button } from '@/components/ui/button';
import { X, Copy, Building2, ExternalLink, Store } from 'lucide-react';
import { toast } from 'sonner';

interface ManageSubscriptionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export const ManageSubscriptionModal: React.FC<ManageSubscriptionModalProps> = ({
  isOpen,
  onOpenChange,
  client,
}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (clientId: string) => subscriptionApi.cancel(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Subscription cancelled successfully!');
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      console.error('Subscription cancel error:', error);
      const axiosError = error as unknown;
      const message = axiosError?.response?.data?.detail || axiosError?.message || 'An error occurred';
      toast.error(`Failed to cancel subscription: ${message}`);
    },
  });

  if (!client) return null;

  const handleCopyId = () => {
    if (client.stripe_subscription_id) {
      navigator.clipboard.writeText(client.stripe_subscription_id);
      toast.success('Subscription ID copied to clipboard');
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 transition-opacity duration-300 ease-in-out"></div>
          <div className="relative z-10">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md transform transition-transform duration-300 ease-in-out scale-100">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Subscription</h3>
                <button
                  onClick={() => onOpenChange(false)}
                  className="text-gray-400 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Client Info Card */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mr-4">
                      <Building2 className="w-6 h-6 text-primary dark:text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{client.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Premium Plan</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <p className="text-gray-500 dark:text-gray-400">Subscription ID:</p>
                    <div className="flex items-center">
                      <span className="font-mono text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        {client.stripe_subscription_id ? (
                          client.stripe_subscription_id.length > 10
                            ? `${client.stripe_subscription_id.substring(0, 10)}...`
                            : client.stripe_subscription_id
                        ) : 'N/A'}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyId}
                        disabled={!client.stripe_subscription_id}
                        className="h-6 w-6 p-0 ml-2"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {client.stripe_subscription_id && (
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
                      asChild
                    >
                      <a
                        href={`https://dashboard.stripe.com/subscriptions/${client.stripe_subscription_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View in Stripe Dashboard
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                )}

                {/* Danger Zone */}
                {client.stripe_subscription_id && (
                  <div className="border-t border-red-200 dark:border-red-800/20 pt-5">
                    <div className="flex flex-col items-start">
                      <h4 className="text-md font-semibold text-red-600 dark:text-red-400">Danger Zone</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-3">Canceling will immediately revoke access to this subscription.</p>
                      <Button
                        type="button"
                        variant="destructive"
                        className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm"
                        onClick={() => mutation.mutate(client.id)}
                        disabled={mutation.isPending}
                      >
                        <X className="w-4 h-4 mr-2" />
                        {mutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
