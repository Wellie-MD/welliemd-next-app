// src/components/clients/ClientDataTable.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Client } from '@/api/clientApi';
import { CreateSubscriptionModal } from '@/components/subscriptions/CreateSubscriptionModal';
import { ManageSubscriptionModal } from '@/components/subscriptions/ManageSubscriptionModal';
import { Building2, CheckCircle, XCircle, CreditCard, Settings, Plus, Pencil } from 'lucide-react';

interface ClientDataTableProps {
  clients: Client[];
}

export const ClientDataTable: React.FC<ClientDataTableProps> = ({ clients }) => {
  const navigate = useNavigate();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleCreateSubscription = (client: Client) => {
    setSelectedClient(client);
    setCreateModalOpen(true);
  };

  const handleManageSubscription = (client: Client) => {
    setSelectedClient(client);
    setManageModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    navigate(`/dashboard/clients/edit/${client.id}`);
  };

  const columns = [
    {
      key: 'name',
      label: 'Client Name',
      sortable: true,
      headerClassName: 'w-1/3',
      className: 'w-1/3',
      render: (value: string | null | undefined, row: Client) => {
        const email = row.user?.email ?? null; // <-- safe
        return (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {value || 'Unnamed client'}
              </div>
              {email && (
                <div className="text-xs text-gray-500 dark:text-gray-400">{email}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'is_active',
      label: 'Status',
      headerClassName: 'w-1/6 text-center',
      className: 'text-center',
      render: (value: boolean) => (
        <div className="flex justify-center">
          <span
            className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
              value
                ? 'text-green-800 bg-green-100 dark:text-green-300 dark:bg-green-900/50'
                : 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-600'
            }`}
          >
            {value ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </>
            ) : (
              'Inactive'
            )}
          </span>
        </div>
      ),
    },
    {
      key: 'stripe_subscription_id',
      label: 'Subscription Status',
      headerClassName: 'w-1/4 text-center',
      className: 'text-center',
      render: (value: string | null) => (
        <div className="flex justify-center">
          <span
            className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
              value
                ? 'text-green-800 bg-green-100 dark:text-green-300 dark:bg-green-900/50'
                : 'text-yellow-800 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/50'
            }`}
          >
            {value ? (
              <>
                <CreditCard className="w-3 h-3 mr-1" />
                Active Subscription
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 mr-1" />
                No Subscription
              </>
            )}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'w-1/3 text-right',
      className: 'text-right',
      render: (_: any, row: Client) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditClient(row)}
            className="flex items-center gap-1 text-gray-600 hover:text-primary hover:bg-gray-100 dark:text-gray-400 dark:hover:text-primary dark:hover:bg-gray-800"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Button>
          {row.stripe_subscription_id ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleManageSubscription(row)}
              className="flex items-center gap-2 text-primary bg-white border border-primary hover:bg-primary/5 dark:bg-gray-800 dark:hover:bg-primary/10"
            >
              <Settings className="w-4 h-4" />
              Manage Subscription
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => handleCreateSubscription(row)}
              className="flex items-center gap-2 text-white bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Create Subscription
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={clients ?? []}
        columns={columns}
        searchPlaceholder="Search clients..."
        showExport={false}
        showDatePicker={false}
        showResetFilters={false}
      />
      <CreateSubscriptionModal
        isOpen={createModalOpen}
        onOpenChange={setCreateModalOpen}
        client={selectedClient}
      />
      <ManageSubscriptionModal
        isOpen={manageModalOpen}
        onOpenChange={setManageModalOpen}
        client={selectedClient}
      />
    </>
  );
};
