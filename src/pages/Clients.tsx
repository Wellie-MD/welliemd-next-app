"use client"

import { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, KeyRound } from 'lucide-react';
import { clientApi } from '@/api/clientApi';
import { ClientDataTable } from '@/components/clients/ClientDataTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export default function Clients() {
  const navigate = useNavigate();
  const [isSendingKey, setIsSendingKey] = useState(false);

  const masterkeyMutation = useMutation({
    mutationFn: clientApi.sendMasterKeyEmail,
    onMutate: () => setIsSendingKey(true),
    onSettled: () => setIsSendingKey(false),
    onSuccess: (data) => {
      toast({ title: 'Email sent', description: data.message });
    },
    onError: () => {
      toast({
        title: 'Failed to send',
        description: 'Could not send master key email. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  const { data: clients, isLoading, isError } = useQuery({
    queryKey: ['clients'],
    queryFn: clientApi.list,
  });

  const visibleClients = useMemo(
    () => (clients || []).filter((client) => client.lifecycle_state !== 'infra_removed'),
    [clients]
  );
  const infraRemovedCount = (clients || []).length - visibleClients.length;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">All Clients</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage client organizations and their configurations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button disabled>
              <KeyRound className="h-4 w-4 mr-2" />
              Get Master Key
            </Button>
            <Button onClick={() => navigate('/dashboard/clients/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Client
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">All Clients</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage client organizations and their configurations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button disabled>
              <KeyRound className="h-4 w-4 mr-2" />
              Get Master Key
            </Button>
            <Button onClick={() => navigate('/dashboard/clients/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Client
            </Button>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500">Failed to load clients. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">All Clients</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage client organizations and their configurations
            {infraRemovedCount > 0 ? ` · ${infraRemovedCount} infra-removed client${infraRemovedCount === 1 ? '' : 's'} hidden from the default view` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => masterkeyMutation.mutate()}
            disabled={isSendingKey}
          >
            <KeyRound className="h-4 w-4 mr-2" />
            {isSendingKey ? 'Sending…' : 'Get Master Key'}
          </Button>
          <Button onClick={() => navigate('/dashboard/clients/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Client
          </Button>
        </div>
      </div>
      <ClientDataTable clients={visibleClients} />
    </div>
  );
}
