// src/components/clients/ClientDataTable.tsx
import React from 'react';
import type { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Client } from '@/api/clientApi';
import { Building2, CheckCircle, XCircle, Pencil, AlertTriangle, Ban, ExternalLink, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axiosInstance from '@/api/axiosInstance';
import { startSuperAdminAccess, type SuperAdminPortalType } from '@/api/superAdminAccessApi';

interface ClientDataTableProps {
  clients: Client[];
  onSearch?: (searchTerm: string) => void;
  canLaunchSuperAdminAccess?: boolean;
}

export const ClientDataTable: React.FC<ClientDataTableProps> = ({
  clients,
  onSearch,
  canLaunchSuperAdminAccess = false,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleEditClient = (client: Client) => {
    navigate(`/dashboard/clients/edit/${client.id}`);
  };

  const handleViewLifecycle = (client: Client) => {
    navigate(`/dashboard/clients/${client.id}/lifecycle`);
  };

  const handleImpersonate = async (client: Client) => {
    try {
      const { data } = await axiosInstance.post(`/clients/${client.id}/impersonate/`);
      if (data.token && data.admin_panel_domain) {
        const url = new URL(data.admin_panel_domain);
        url.searchParams.set('impersonate_token', data.token);
        window.open(url.toString(), '_blank');
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ error?: string }>;
      toast({
        title: "Impersonation failed",
        description: axiosError.response?.data?.error || "Could not log in as client",
        variant: "destructive",
      });
    }
  };

  const handleBrokerLaunch = async (client: Client, portalType: SuperAdminPortalType) => {
    try {
      const data = await startSuperAdminAccess(client.id, portalType);
      window.open(data.launch_url, '_blank', 'noopener,noreferrer');
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ error?: string }>;
      toast({
        title: "Super Admin access failed",
        description: axiosError.response?.data?.error || `Could not open ${portalType} portal`,
        variant: "destructive",
      });
    }
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
            className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${value
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
      key: 'lifecycle_state',
      label: 'Lifecycle',
      headerClassName: 'w-1/6 text-center',
      className: 'text-center',
      render: (_: unknown, row: Client) => {
        const hasWarnings =
          row.lifecycle_state === 'ready_with_warnings' ||
          row.provisioning_status === 'ready_with_warnings' ||
          row.latest_lifecycle_job_status === 'completed_with_warnings';
        const variant =
          row.lifecycle_state === 'ready' && !hasWarnings
            ? 'default'
            : row.lifecycle_state === 'error'
              ? 'destructive'
              : 'secondary';
        return (
          <div className="flex flex-col items-center gap-1">
            <Badge
              variant={variant}
              className={hasWarnings ? 'border-amber-300 bg-amber-100 text-amber-950 hover:bg-amber-100' : undefined}
            >
              {row.lifecycle_state || 'draft'}
            </Badge>
            <span className={hasWarnings ? 'text-xs text-amber-700' : 'text-xs text-muted-foreground'}>
              {row.latest_lifecycle_job_operation_type
                ? `${row.latest_lifecycle_job_operation_type}:${row.latest_lifecycle_job_status || 'pending'}`
                : row.provisioning_status || 'idle'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'b2b_subscription_status',
      label: 'Subscription Status',
      headerClassName: 'w-1/4 text-center',
      className: 'text-center',
      render: (_: unknown, row: Client) => {
        const status = row.b2b_subscription_status ?? 'inactive';
        const isPendingCancel = Boolean(row.b2b_cancel_at_period_end);

        const statusUi = {
          active: {
            label: isPendingCancel ? 'Subscribed (Cancel Scheduled)' : 'Subscribed',
            className: 'text-green-800 bg-green-100 dark:text-green-300 dark:bg-green-900/50',
            icon: isPendingCancel ? AlertTriangle : CheckCircle,
          },
          past_due: {
            label: 'Past Due',
            className: 'text-red-800 bg-red-100 dark:text-red-300 dark:bg-red-900/50',
            icon: AlertTriangle,
          },
          canceled: {
            label: 'Canceled',
            className: 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-700/70',
            icon: Ban,
          },
          inactive: {
            label: 'No Subscription',
            className: 'text-yellow-800 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/50',
            icon: XCircle,
          },
        }[status as 'active' | 'past_due' | 'canceled' | 'inactive'];

        const Icon = statusUi.icon;
        return (
          <div className="flex justify-center">
            <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${statusUi.className}`}>
              <Icon className="w-3 h-3 mr-1" />
              {statusUi.label}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'w-1/6 text-right',
      className: 'text-right',
      render: (_: unknown, row: Client) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewLifecycle(row)}
            className="flex items-center gap-1 text-gray-600 hover:text-primary hover:bg-gray-100 dark:text-gray-400 dark:hover:text-primary dark:hover:bg-gray-800"
          >
            <Activity className="w-4 h-4" />
            Lifecycle
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditClient(row)}
            className="flex items-center gap-1 text-gray-600 hover:text-primary hover:bg-gray-100 dark:text-gray-400 dark:hover:text-primary dark:hover:bg-gray-800"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleBrokerLaunch(row, 'client')}
            disabled={!row.admin_panel_domain || !canLaunchSuperAdminAccess}
            className="flex items-center gap-1 text-gray-600 hover:text-primary hover:bg-gray-100 dark:text-gray-400 dark:hover:text-primary dark:hover:bg-gray-800"
            title={canLaunchSuperAdminAccess ? undefined : 'Admin or Super Admin role required'}
          >
            <ExternalLink className="w-4 h-4" />
            Open Client
          </Button>
          {/* Login as Client — hidden for now
          <Button
            variant="default"
            size="sm"
            onClick={() => handleImpersonate(row)}
            disabled={!row.admin_panel_domain}
            className="flex items-center"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Login as Client
          </Button>
          */}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={clients ?? []}
      columns={columns}
      searchPlaceholder="Search clients..."
      onSearch={onSearch}
      showExport={false}
      showDatePicker={false}
      showResetFilters={false}
    />
  );
};
