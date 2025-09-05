# Extension Playbook

This document provides step-by-step guides for common development tasks in the WellieMD Patient Portal.

## 📋 Table of Contents

1. [Adding a New Feature Module](#adding-a-new-feature-module)
2. [Adding a New API Endpoint](#adding-a-new-api-endpoint)
3. [Adding a New Route](#adding-a-new-route)
4. [Adding New Permissions/Roles](#adding-new-permissionsroles)
5. [Adding a New Zustand Store](#adding-a-new-zustand-store)
6. [Adding a New Component](#adding-a-new-component)
7. [Adding Tests](#adding-tests)
8. [Adding Feature Flags](#adding-feature-flags)

---

## Adding a New Feature Module

### 1. Create Feature Directory Structure

```bash
mkdir -p src/features/medical-records
cd src/features/medical-records

# Create subdirectories
mkdir components hooks services store types pages __tests__
```

### 2. Define Types

Create `src/features/medical-records/types/medical-records.types.ts`:

```typescript
import { z } from 'zod';

// Define your schemas
export const MedicalRecordSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  providerId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string(),
  category: z.enum(['diagnosis', 'treatment', 'lab-result', 'imaging']),
  date: z.string().datetime(),
  attachments: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MedicalRecord = z.infer<typeof MedicalRecordSchema>;

// Request/Response types
export const CreateMedicalRecordRequestSchema = MedicalRecordSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateMedicalRecordRequest = z.infer<typeof CreateMedicalRecordRequestSchema>;

export const UpdateMedicalRecordRequestSchema = CreateMedicalRecordRequestSchema.partial();

export type UpdateMedicalRecordRequest = z.infer<typeof UpdateMedicalRecordRequestSchema>;
```

### 3. Create Service

Create `src/features/medical-records/services/medical-records.service.ts`:

```typescript
import { apiClient } from '@/shared/api/client';
import { ApiSuccessResponse, PaginatedResponse } from '@/shared/api/types';
import { debugLog } from '@/config/env';

import {
  MedicalRecord,
  MedicalRecordSchema,
  CreateMedicalRecordRequest,
  UpdateMedicalRecordRequest,
} from '../types/medical-records.types';

export class MedicalRecordsService {
  private static instance: MedicalRecordsService;

  public static getInstance(): MedicalRecordsService {
    if (!MedicalRecordsService.instance) {
      MedicalRecordsService.instance = new MedicalRecordsService();
    }
    return MedicalRecordsService.instance;
  }

  async getMedicalRecords(
    patientId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<MedicalRecord>> {
    debugLog('MedicalRecordsService.getMedicalRecords:', { patientId, page, limit });

    const response = await apiClient.get<PaginatedResponse<MedicalRecord>>(
      `/patients/${patientId}/medical-records`,
      {
        params: { page, limit },
      }
    );

    // Validate response data
    const validatedItems = response.data.data.items.map(item =>
      MedicalRecordSchema.parse(item)
    );

    return {
      ...response.data,
      data: {
        ...response.data.data,
        items: validatedItems,
      },
    };
  }

  async getMedicalRecord(id: string): Promise<MedicalRecord> {
    debugLog('MedicalRecordsService.getMedicalRecord:', { id });

    const response = await apiClient.get<ApiSuccessResponse<MedicalRecord>>(
      `/medical-records/${id}`
    );

    return MedicalRecordSchema.parse(response.data.data);
  }

  async createMedicalRecord(data: CreateMedicalRecordRequest): Promise<MedicalRecord> {
    debugLog('MedicalRecordsService.createMedicalRecord:', data);

    const response = await apiClient.post<ApiSuccessResponse<MedicalRecord>>(
      '/medical-records',
      data
    );

    return MedicalRecordSchema.parse(response.data.data);
  }

  async updateMedicalRecord(id: string, data: UpdateMedicalRecordRequest): Promise<MedicalRecord> {
    debugLog('MedicalRecordsService.updateMedicalRecord:', { id, data });

    const response = await apiClient.patch<ApiSuccessResponse<MedicalRecord>>(
      `/medical-records/${id}`,
      data
    );

    return MedicalRecordSchema.parse(response.data.data);
  }

  async deleteMedicalRecord(id: string): Promise<void> {
    debugLog('MedicalRecordsService.deleteMedicalRecord:', { id });

    await apiClient.delete(`/medical-records/${id}`);
  }
}

export const medicalRecordsService = MedicalRecordsService.getInstance();
```

### 4. Create Store

Create `src/features/medical-records/store/medical-records.store.ts`:

```typescript
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { debugLog } from '@/config/env';
import { medicalRecordsService } from '../services/medical-records.service';
import {
  MedicalRecord,
  CreateMedicalRecordRequest,
  UpdateMedicalRecordRequest,
} from '../types/medical-records.types';

interface MedicalRecordsState {
  // State
  records: MedicalRecord[];
  selectedRecord: MedicalRecord | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchRecords: (patientId: string, page?: number) => Promise<void>;
  fetchRecord: (id: string) => Promise<void>;
  createRecord: (data: CreateMedicalRecordRequest) => Promise<MedicalRecord>;
  updateRecord: (id: string, data: UpdateMedicalRecordRequest) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  setSelectedRecord: (record: MedicalRecord | null) => void;
  clearError: () => void;

  // Selectors
  getRecordById: (id: string) => MedicalRecord | undefined;
}

export const useMedicalRecordsStore = create<MedicalRecordsState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        records: [],
        selectedRecord: null,
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
        isLoading: false,
        error: null,

        // Actions
        fetchRecords: async (patientId: string, page = 1) => {
          debugLog('MedicalRecordsStore.fetchRecords:', { patientId, page });

          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const response = await medicalRecordsService.getMedicalRecords(
              patientId,
              page,
              get().pagination.limit
            );

            set((state) => {
              state.records = response.data.items;
              state.pagination = response.data.pagination;
              state.isLoading = false;
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch records';

            set((state) => {
              state.isLoading = false;
              state.error = errorMessage;
            });

            throw error;
          }
        },

        fetchRecord: async (id: string) => {
          debugLog('MedicalRecordsStore.fetchRecord:', { id });

          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const record = await medicalRecordsService.getMedicalRecord(id);

            set((state) => {
              state.selectedRecord = record;
              state.isLoading = false;
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch record';

            set((state) => {
              state.isLoading = false;
              state.error = errorMessage;
            });

            throw error;
          }
        },

        createRecord: async (data: CreateMedicalRecordRequest) => {
          debugLog('MedicalRecordsStore.createRecord:', data);

          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const newRecord = await medicalRecordsService.createMedicalRecord(data);

            set((state) => {
              state.records.unshift(newRecord);
              state.pagination.total += 1;
              state.isLoading = false;
            });

            return newRecord;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create record';

            set((state) => {
              state.isLoading = false;
              state.error = errorMessage;
            });

            throw error;
          }
        },

        updateRecord: async (id: string, data: UpdateMedicalRecordRequest) => {
          debugLog('MedicalRecordsStore.updateRecord:', { id, data });

          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const updatedRecord = await medicalRecordsService.updateMedicalRecord(id, data);

            set((state) => {
              const index = state.records.findIndex(r => r.id === id);
              if (index !== -1) {
                state.records[index] = updatedRecord;
              }

              if (state.selectedRecord?.id === id) {
                state.selectedRecord = updatedRecord;
              }

              state.isLoading = false;
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update record';

            set((state) => {
              state.isLoading = false;
              state.error = errorMessage;
            });

            throw error;
          }
        },

        deleteRecord: async (id: string) => {
          debugLog('MedicalRecordsStore.deleteRecord:', { id });

          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            await medicalRecordsService.deleteMedicalRecord(id);

            set((state) => {
              state.records = state.records.filter(r => r.id !== id);
              state.pagination.total = Math.max(0, state.pagination.total - 1);

              if (state.selectedRecord?.id === id) {
                state.selectedRecord = null;
              }

              state.isLoading = false;
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete record';

            set((state) => {
              state.isLoading = false;
              state.error = errorMessage;
            });

            throw error;
          }
        },

        setSelectedRecord: (record: MedicalRecord | null) => {
          set((state) => {
            state.selectedRecord = record;
          });
        },

        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },

        // Selectors
        getRecordById: (id: string) => {
          return get().records.find(record => record.id === id);
        },
      }))
    ),
    {
      name: 'medical-records-store',
    }
  )
);

// Selectors
export const medicalRecordsSelectors = {
  records: () => useMedicalRecordsStore((state) => state.records),
  selectedRecord: () => useMedicalRecordsStore((state) => state.selectedRecord),
  pagination: () => useMedicalRecordsStore((state) => state.pagination),
  isLoading: () => useMedicalRecordsStore((state) => state.isLoading),
  error: () => useMedicalRecordsStore((state) => state.error),
  getRecordById: (id: string) => useMedicalRecordsStore((state) => state.getRecordById(id)),
};
```

### 5. Create Hook

Create `src/features/medical-records/hooks/use-medical-records.ts`:

```typescript
import { useCallback } from 'react';
import { useMedicalRecordsStore } from '../store/medical-records.store';
import {
  CreateMedicalRecordRequest,
  UpdateMedicalRecordRequest,
} from '../types/medical-records.types';

export function useMedicalRecords(patientId?: string) {
  const {
    records,
    selectedRecord,
    pagination,
    isLoading,
    error,
    fetchRecords,
    fetchRecord,
    createRecord,
    updateRecord,
    deleteRecord,
    setSelectedRecord,
    clearError,
    getRecordById,
  } = useMedicalRecordsStore();

  const loadRecords = useCallback(
    async (page = 1) => {
      if (!patientId) return;
      await fetchRecords(patientId, page);
    },
    [patientId, fetchRecords]
  );

  const loadRecord = useCallback(
    async (id: string) => {
      await fetchRecord(id);
    },
    [fetchRecord]
  );

  const handleCreateRecord = useCallback(
    async (data: CreateMedicalRecordRequest) => {
      return await createRecord(data);
    },
    [createRecord]
  );

  const handleUpdateRecord = useCallback(
    async (id: string, data: UpdateMedicalRecordRequest) => {
      await updateRecord(id, data);
    },
    [updateRecord]
  );

  const handleDeleteRecord = useCallback(
    async (id: string) => {
      await deleteRecord(id);
    },
    [deleteRecord]
  );

  return {
    // State
    records,
    selectedRecord,
    pagination,
    isLoading,
    error,

    // Actions
    loadRecords,
    loadRecord,
    createRecord: handleCreateRecord,
    updateRecord: handleUpdateRecord,
    deleteRecord: handleDeleteRecord,
    setSelectedRecord,
    clearError,

    // Utilities
    getRecordById,
  };
}
```

### 6. Create Components

Create `src/features/medical-records/components/medical-records-list.tsx`:

```typescript
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/shared/lib/utils';
import { useMedicalRecords } from '../hooks/use-medical-records';
import { MedicalRecord } from '../types/medical-records.types';

interface MedicalRecordsListProps {
  patientId: string;
  onRecordSelect?: (record: MedicalRecord) => void;
}

export function MedicalRecordsList({ patientId, onRecordSelect }: MedicalRecordsListProps) {
  const { records, isLoading, error, loadRecords } = useMedicalRecords(patientId);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  if (isLoading) {
    return <div>Loading medical records...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-6">
          <p className="text-muted-foreground">No medical records found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <Card key={record.id} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{record.title}</CardTitle>
              <Badge variant="secondary">{record.category}</Badge>
            </div>
            <CardDescription>
              {formatDate(record.date)} • Dr. {record.providerId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{record.description}</p>
            {onRecordSelect && (
              <Button variant="outline" onClick={() => onRecordSelect(record)}>
                View Details
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### 7. Create Page Component

Create `src/features/medical-records/pages/medical-records.page.tsx`:

```typescript
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { MedicalRecordsList } from '../components/medical-records-list';
import { MedicalRecord } from '../types/medical-records.types';

export default function MedicalRecordsPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  if (!patientId) {
    return <div>Patient ID is required</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Medical Records</h1>
          <p className="text-muted-foreground">
            View and manage patient medical records
          </p>
        </div>
        <Button>Add New Record</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MedicalRecordsList
            patientId={patientId}
            onRecordSelect={setSelectedRecord}
          />
        </div>
        
        <div>
          {selectedRecord ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">Record Details</h3>
              {/* Record details component would go here */}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              Select a record to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 8. Create Public API

Create `src/features/medical-records/index.ts`:

```typescript
// Export public API
export { MedicalRecordsList } from './components/medical-records-list';
export { useMedicalRecords } from './hooks/use-medical-records';
export { useMedicalRecordsStore, medicalRecordsSelectors } from './store/medical-records.store';
export { medicalRecordsService } from './services/medical-records.service';

// Export types
export type {
  MedicalRecord,
  CreateMedicalRecordRequest,
  UpdateMedicalRecordRequest,
} from './types/medical-records.types';

// Export schemas for external validation
export {
  MedicalRecordSchema,
  CreateMedicalRecordRequestSchema,
  UpdateMedicalRecordRequestSchema,
} from './types/medical-records.types';
```

### 9. Add Route

Update `src/app/router/index.tsx` to include the new route:

```typescript
// Add to the router configuration
{
  path: '/patients/:patientId/medical-records',
  element: (
    <RoleGuard requiredPermissions={[PERMISSIONS.PROVIDER_VIEW_PATIENTS]}>
      <Suspense fallback={<RouteLoader message="Loading medical records..." />}>
        <MedicalRecordsPage />
      </Suspense>
    </RoleGuard>
  ),
},
```

### 10. Write Tests

Create `src/features/medical-records/__tests__/medical-records.service.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { medicalRecordsService } from '../services/medical-records.service';
import { createMockApiResponse } from '@/__tests__/utils';

vi.mock('@/shared/api/client');

describe('MedicalRecordsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMedicalRecords', () => {
    it('should fetch medical records successfully', async () => {
      const mockResponse = createMockApiResponse({
        items: [
          {
            id: 'record-1',
            patientId: 'patient-1',
            providerId: 'provider-1',
            title: 'Annual Checkup',
            description: 'Routine annual physical examination',
            category: 'diagnosis',
            date: '2024-01-15T10:00:00Z',
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });

      const result = await medicalRecordsService.getMedicalRecords('patient-1');

      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].title).toBe('Annual Checkup');
    });
  });
});
```

### 11. Update Navigation

Add the new feature to your navigation components as needed.

---

## Adding a New API Endpoint

### 1. Define the Endpoint Contract

Update your API documentation and define the endpoint:

```typescript
// In your service file
async getPatientVitals(patientId: string): Promise<PatientVitals[]> {
  const response = await apiClient.get<ApiSuccessResponse<PatientVitals[]>>(
    `/patients/${patientId}/vitals`
  );
  
  return response.data.data.map(vital => PatientVitalsSchema.parse(vital));
}
```

### 2. Add MSW Handler (for testing)

Update `src/__tests__/mocks/handlers.ts`:

```typescript
http.get(`${API_BASE_URL}/patients/:patientId/vitals`, ({ params }) => {
  const { patientId } = params;
  
  const mockVitals = [
    {
      id: 'vital-1',
      patientId: patientId as string,
      type: 'blood_pressure',
      value: '120/80',
      unit: 'mmHg',
      recordedAt: new Date().toISOString(),
    },
  ];
  
  return HttpResponse.json(createMockApiResponse(mockVitals));
}),
```

### 3. Add Type Definitions

```typescript
export const PatientVitalsSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  type: z.enum(['blood_pressure', 'heart_rate', 'temperature', 'weight', 'height']),
  value: z.string(),
  unit: z.string(),
  recordedAt: z.string().datetime(),
});

export type PatientVitals = z.infer<typeof PatientVitalsSchema>;
```

### 4. Write Tests

```typescript
describe('getPatientVitals', () => {
  it('should fetch patient vitals successfully', async () => {
    const vitals = await patientService.getPatientVitals('patient-1');
    
    expect(vitals).toHaveLength(1);
    expect(vitals[0].type).toBe('blood_pressure');
    expect(vitals[0].value).toBe('120/80');
  });
});
```

---

## Adding a New Route

### 1. Create Route Component

Create the page component in the appropriate feature:

```typescript
// src/features/appointments/pages/appointment-calendar.page.tsx
export default function AppointmentCalendarPage() {
  return (
    <div>
      <h1>Appointment Calendar</h1>
      {/* Calendar implementation */}
    </div>
  );
}
```

### 2. Add Route Configuration

Update `src/config/routes.ts`:

```typescript
export const ROUTES = {
  // ... existing routes
  APPOINTMENT_CALENDAR: '/appointments/calendar',
} as const;

export const ROUTE_CONFIGS: Record<string, RouteConfig> = {
  // ... existing configs
  [ROUTES.APPOINTMENT_CALENDAR]: {
    path: ROUTES.APPOINTMENT_CALENDAR,
    title: 'Appointment Calendar',
    description: 'View appointments in calendar format',
    requiresAuth: true,
    requiredPermissions: ['patient:view:appointments'],
    showInNavigation: true,
    icon: 'Calendar',
    order: 3,
  },
};
```

### 3. Add to Router

Update `src/app/router/index.tsx`:

```typescript
{
  path: ROUTES.APPOINTMENT_CALENDAR,
  element: (
    <RoleGuard requiredPermissions={[PERMISSIONS.PATIENT_VIEW_APPOINTMENTS]}>
      <Suspense fallback={<RouteLoader message="Loading calendar..." />}>
        <AppointmentCalendarPage />
      </Suspense>
    </RoleGuard>
  ),
},
```

### 4. Add to Navigation

Update your navigation component to include the new route.

---

## Adding New Permissions/Roles

### 1. Define Permission Constants

Update `src/features/auth/types/auth.types.ts`:

```typescript
export const PERMISSIONS = {
  // ... existing permissions
  PATIENT_MANAGE_FAMILY: 'patient:manage:family',
  PROVIDER_MANAGE_SCHEDULE: 'provider:manage:schedule',
} as const;
```

### 2. Update Role Mappings

```typescript
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.PATIENT]: [
    // ... existing permissions
    PERMISSIONS.PATIENT_MANAGE_FAMILY,
  ],
  [UserRole.PROVIDER]: [
    // ... existing permissions
    PERMISSIONS.PROVIDER_MANAGE_SCHEDULE,
  ],
  // ...
};
```

### 3. Update RBAC Utilities

The existing RBAC utilities will automatically support the new permissions.

### 4. Use in Components

```typescript
import { usePermission } from '@/shared/hooks/use-rbac';

function FamilyManagementSection() {
  const canManageFamily = usePermission(PERMISSIONS.PATIENT_MANAGE_FAMILY);
  
  if (!canManageFamily) {
    return null;
  }
  
  return <div>Family management controls</div>;
}
```

---

## Adding a New Zustand Store

### 1. Create Store File

Create `src/shared/store/notifications.store.ts`:

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  
  // Selectors
  getUnreadNotifications: () => Notification[];
}

export const useNotificationsStore = create<NotificationsState>()(
  devtools(
    persist(
      immer((set, get) => ({
        notifications: [],
        unreadCount: 0,
        isLoading: false,

        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: crypto.randomUUID(),
            read: false,
            createdAt: new Date().toISOString(),
          };

          set((state) => {
            state.notifications.unshift(newNotification);
            state.unreadCount += 1;
          });
        },

        markAsRead: (id) => {
          set((state) => {
            const notification = state.notifications.find(n => n.id === id);
            if (notification && !notification.read) {
              notification.read = true;
              state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
          });
        },

        markAllAsRead: () => {
          set((state) => {
            state.notifications.forEach(notification => {
              notification.read = true;
            });
            state.unreadCount = 0;
          });
        },

        removeNotification: (id) => {
          set((state) => {
            const index = state.notifications.findIndex(n => n.id === id);
            if (index !== -1) {
              const notification = state.notifications[index];
              if (!notification.read) {
                state.unreadCount = Math.max(0, state.unreadCount - 1);
              }
              state.notifications.splice(index, 1);
            }
          });
        },

        clearAll: () => {
          set((state) => {
            state.notifications = [];
            state.unreadCount = 0;
          });
        },

        getUnreadNotifications: () => {
          return get().notifications.filter(n => !n.read);
        },
      })),
      {
        name: 'notifications-store',
        partialize: (state) => ({
          notifications: state.notifications,
          unreadCount: state.unreadCount,
        }),
      }
    ),
    {
      name: 'notifications-store',
    }
  )
);
```

### 2. Create Hook

Create `src/shared/hooks/use-notifications.ts`:

```typescript
import { useNotificationsStore } from '@/shared/store/notifications.store';

export function useNotifications() {
  const {
    notifications,
    unreadCount,
    isLoading,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    getUnreadNotifications,
  } = useNotificationsStore();

  return {
    notifications,
    unreadCount,
    isLoading,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    getUnreadNotifications,
  };
}
```

### 3. Write Tests

Create `src/shared/store/__tests__/notifications.store.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotificationsStore } from '../notifications.store';

describe('NotificationsStore', () => {
  beforeEach(() => {
    useNotificationsStore.setState({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
    });
  });

  it('should add notification', () => {
    const { result } = renderHook(() => useNotificationsStore());

    act(() => {
      result.current.addNotification({
        title: 'Test Notification',
        message: 'This is a test',
        type: 'info',
      });
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.notifications[0].title).toBe('Test Notification');
  });

  it('should mark notification as read', () => {
    const { result } = renderHook(() => useNotificationsStore());

    act(() => {
      result.current.addNotification({
        title: 'Test Notification',
        message: 'This is a test',
        type: 'info',
      });
    });

    const notificationId = result.current.notifications[0].id;

    act(() => {
      result.current.markAsRead(notificationId);
    });

    expect(result.current.notifications[0].read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });
});
```

---

## Quality Checklists

### 🔍 Code Review Checklist

**Before Submitting PR:**
- [ ] Code follows established patterns
- [ ] TypeScript types are properly defined
- [ ] All tests pass
- [ ] No linting errors
- [ ] Performance considerations addressed
- [ ] Error handling implemented
- [ ] Accessibility requirements met
- [ ] Documentation updated

**For Reviewers:**
- [ ] Code is readable and maintainable
- [ ] Proper separation of concerns
- [ ] Security considerations addressed
- [ ] Performance implications considered
- [ ] Test coverage is adequate
- [ ] API contracts are well-defined
- [ ] Error scenarios are handled

### 🧪 Testing Checklist

**Unit Tests:**
- [ ] Services tested with mocked dependencies
- [ ] Store actions and selectors tested
- [ ] Utility functions tested
- [ ] Edge cases covered

**Integration Tests:**
- [ ] Component + hook interactions tested
- [ ] API integration tested with MSW
- [ ] Store + service integration tested
- [ ] Error scenarios tested

**E2E Tests (for critical paths):**
- [ ] User authentication flow
- [ ] Core feature workflows
- [ ] Cross-browser compatibility

### 🚀 Performance Checklist

**Bundle Size:**
- [ ] New dependencies justified
- [ ] Code splitting implemented where appropriate
- [ ] Tree shaking optimized
- [ ] Bundle analyzer run

**Runtime Performance:**
- [ ] Expensive operations memoized
- [ ] Large lists virtualized
- [ ] Images optimized
- [ ] Core Web Vitals measured

### 🔐 Security Checklist

**Authentication:**
- [ ] Proper token handling
- [ ] Route protection implemented
- [ ] Permission checks in place
- [ ] Session management secure

**Data Validation:**
- [ ] Input validation on client and server
- [ ] Zod schemas for API boundaries
- [ ] XSS prevention measures
- [ ] CSRF protection where needed

### ♿ Accessibility Checklist

**Keyboard Navigation:**
- [ ] All interactive elements accessible via keyboard
- [ ] Focus management implemented
- [ ] Tab order logical
- [ ] Focus indicators visible

**Screen Reader Support:**
- [ ] Semantic HTML used
- [ ] ARIA labels provided where needed
- [ ] Heading structure logical
- [ ] Form labels associated

**Visual Design:**
- [ ] Color contrast ratios met
- [ ] Text scalable
- [ ] Motion respects user preferences
- [ ] Error messages descriptive

---

This playbook provides comprehensive guidance for extending the WellieMD Patient Portal. Each section includes practical examples and follows the established architectural patterns. Remember to always run the quality checklists before submitting code for review.
