"use client"

import { useQuery } from '@tanstack/react-query';
import { clientApi } from '@/api/clientApi';
import { ClientDataTable } from '@/components/clients/ClientDataTable';
import { Skeleton } from '@/components/ui/skeleton';
import CreateClientForm from "@/components/clients/CreateClientForm";

export default function Clients() {
  const { data: clients, isLoading, isError } = useQuery({
    queryKey: ['clients'],
    queryFn: clientApi.list,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">All Clients</h2>
          <CreateClientForm onCreate={() => {}} />
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
          <h2 className="text-lg font-semibold">All Clients</h2>
          <CreateClientForm onCreate={() => {}} />
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
        <h2 className="text-lg font-semibold">All Clients</h2>
        <CreateClientForm onCreate={() => {}} />
      </div>
      <ClientDataTable clients={clients || []} />
    </div>
  );
}
