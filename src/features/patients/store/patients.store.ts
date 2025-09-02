import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { debugLog } from '@/config/env';

// Example domain store for patients feature
// This demonstrates the pattern for feature-specific stores

// Patient types
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
  medicalHistory: string[];
  allergies: string[];
  medications: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  type: 'consultation' | 'follow-up' | 'procedure' | 'emergency';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  scheduledAt: string;
  duration: number; // in minutes
  reason: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Pagination and filtering
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PatientFilters {
  search?: string;
  gender?: Patient['gender'];
  ageRange?: {
    min: number;
    max: number;
  };
  hasInsurance?: boolean;
}

// Patients store state interface
interface PatientsState {
  // State
  patients: Patient[];
  selectedPatient: Patient | null;
  appointments: Appointment[];
  pagination: PaginationState;
  filters: PatientFilters;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchPatients: (page?: number, filters?: PatientFilters) => Promise<void>;
  fetchPatient: (id: string) => Promise<void>;
  createPatient: (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Patient>;
  updatePatient: (id: string, patientData: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  
  // Appointment actions
  fetchPatientAppointments: (patientId: string) => Promise<void>;
  scheduleAppointment: (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Appointment>;
  updateAppointment: (id: string, appointmentData: Partial<Appointment>) => Promise<void>;
  cancelAppointment: (id: string) => Promise<void>;
  
  // UI actions
  setSelectedPatient: (patient: Patient | null) => void;
  setFilters: (filters: PatientFilters) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  clearError: () => void;
  
  // Selectors
  getPatientById: (id: string) => Patient | undefined;
  getPatientAppointments: (patientId: string) => Appointment[];
  getUpcomingAppointments: (patientId: string) => Appointment[];
  searchPatients: (query: string) => Patient[];
}

// Mock API functions (replace with actual API calls)
const mockPatientsAPI = {
  fetchPatients: async (page = 1, limit = 10, filters: PatientFilters = {}) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response
    return {
      patients: [] as Patient[],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  },
  
  fetchPatient: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return null as Patient | null;
  },
  
  createPatient: async (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      ...patientData,
      id: `patient-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Patient;
  },
  
  updatePatient: async (id: string, patientData: Partial<Patient>) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      id,
      ...patientData,
      updatedAt: new Date().toISOString(),
    } as Patient;
  },
  
  deletePatient: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
  },
  
  fetchAppointments: async (patientId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [] as Appointment[];
  },
  
  createAppointment: async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      ...appointmentData,
      id: `appointment-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Appointment;
  },
  
  updateAppointment: async (id: string, appointmentData: Partial<Appointment>) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      id,
      ...appointmentData,
      updatedAt: new Date().toISOString(),
    } as Appointment;
  },
  
  cancelAppointment: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
  },
};

// Create patients store
export const usePatientsStore = create<PatientsState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        patients: [],
        selectedPatient: null,
        appointments: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
        filters: {},
        isLoading: false,
        error: null,

        // Actions
        fetchPatients: async (page = 1, filters: PatientFilters = {}) => {
          debugLog('PatientsStore.fetchPatients:', { page, filters });
          
          set((state) => {
            state.isLoading = true;
            state.error = null;
            state.filters = filters;
          });

          try {
            const response = await mockPatientsAPI.fetchPatients(page, get().pagination.limit, filters);
            
            set((state) => {
              state.patients = response.patients;
              state.pagination = response.pagination;
              state.isLoading = false;
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch patients';
            
            set((state) => {
              state.isLoading = false;
              state.error = errorMessage;
            });

            throw error;
          }
        },

        fetchPatient: async (id: string) => {
          debugLog('PatientsStore.fetchPatient:', { id });
          
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const patient = await mockPatientsAPI.fetchPatient(id);
            
            set((state) => {
              state.selectedPatient = patient;
              state.isLoading = false;
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch patient';
            
            set((state) => {
              state.isLoading = false;
              state.error = errorMessage;
            });

            throw error;
          }
        },

        createPatient: async (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
          debugLog('PatientsStore.createPatient:', patientData);
          
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const newPatient = await mockPatientsAPI.createPatient(patientData);
            
            set((state) => {
              state.patients.unshift(newPatient);
              state.pagination.total += 1;
              state.isLoading = false;
            });

            return newPatient;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create patient';
            
            set((state) => {
              state.isLoading = false;
              state.error = errorMessage;
            });

            throw error;
          }
        },

        updatePatient: async (id: string, patientData: Partial<Patient>) => {
          debugLog('PatientsStore.updatePatient:', { id, patientData });
          
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const updatedPatient = await mockPatientsAPI.updatePatient(id, patientData);
            
            set((state) => {
              const index = state.patients.findIndex(p => p.id === id);
              if (index !== -1) {
                state.patients[index] = { ...state.patients[index], ...updatedPatient };
              }
              
              if (state.selectedPatient?.id === id) {
                state.selectedPatient = { ...state.selectedPatient, ...updatedPatient };
              }
              
              state.isLoading = false;
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update patient';
            
            set((state) => {
              state.isLoading = false;
              state.error = errorMessage;
            });

            throw error;
          }
        },

        deletePatient: async (id: string) => {
          debugLog('PatientsStore.deletePatient:', { id });
          
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            await mockPatientsAPI.deletePatient(id);
            
            set((state) => {
              state.patients = state.patients.filter(p => p.id !== id);
              state.pagination.total = Math.max(0, state.pagination.total - 1);
              
              if (state.selectedPatient?.id === id) {
                state.selectedPatient = null;
              }
              
              state.isLoading = false;
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete patient';
            
            set((state) => {
              state.isLoading = false;
              state.error = errorMessage;
            });

            throw error;
          }
        },

        // Appointment actions
        fetchPatientAppointments: async (patientId: string) => {
          debugLog('PatientsStore.fetchPatientAppointments:', { patientId });

          try {
            const appointments = await mockPatientsAPI.fetchAppointments(patientId);
            
            set((state) => {
              state.appointments = appointments;
            });
          } catch (error) {
            debugLog('Failed to fetch patient appointments:', error);
            throw error;
          }
        },

        scheduleAppointment: async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
          debugLog('PatientsStore.scheduleAppointment:', appointmentData);

          try {
            const newAppointment = await mockPatientsAPI.createAppointment(appointmentData);
            
            set((state) => {
              state.appointments.push(newAppointment);
            });

            return newAppointment;
          } catch (error) {
            debugLog('Failed to schedule appointment:', error);
            throw error;
          }
        },

        updateAppointment: async (id: string, appointmentData: Partial<Appointment>) => {
          debugLog('PatientsStore.updateAppointment:', { id, appointmentData });

          try {
            const updatedAppointment = await mockPatientsAPI.updateAppointment(id, appointmentData);
            
            set((state) => {
              const index = state.appointments.findIndex(a => a.id === id);
              if (index !== -1) {
                state.appointments[index] = { ...state.appointments[index], ...updatedAppointment };
              }
            });
          } catch (error) {
            debugLog('Failed to update appointment:', error);
            throw error;
          }
        },

        cancelAppointment: async (id: string) => {
          debugLog('PatientsStore.cancelAppointment:', { id });

          try {
            await mockPatientsAPI.cancelAppointment(id);
            
            set((state) => {
              const index = state.appointments.findIndex(a => a.id === id);
              if (index !== -1) {
                state.appointments[index].status = 'cancelled';
              }
            });
          } catch (error) {
            debugLog('Failed to cancel appointment:', error);
            throw error;
          }
        },

        // UI actions
        setSelectedPatient: (patient: Patient | null) => {
          set((state) => {
            state.selectedPatient = patient;
          });
        },

        setFilters: (filters: PatientFilters) => {
          set((state) => {
            state.filters = { ...state.filters, ...filters };
          });
        },

        clearFilters: () => {
          set((state) => {
            state.filters = {};
          });
        },

        setPage: (page: number) => {
          set((state) => {
            state.pagination.page = page;
          });
        },

        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },

        // Selectors
        getPatientById: (id: string) => {
          return get().patients.find(patient => patient.id === id);
        },

        getPatientAppointments: (patientId: string) => {
          return get().appointments.filter(appointment => appointment.patientId === patientId);
        },

        getUpcomingAppointments: (patientId: string) => {
          const now = new Date();
          return get().appointments.filter(appointment => 
            appointment.patientId === patientId &&
            new Date(appointment.scheduledAt) > now &&
            appointment.status !== 'cancelled'
          );
        },

        searchPatients: (query: string) => {
          const lowerQuery = query.toLowerCase();
          return get().patients.filter(patient =>
            patient.firstName.toLowerCase().includes(lowerQuery) ||
            patient.lastName.toLowerCase().includes(lowerQuery) ||
            patient.email.toLowerCase().includes(lowerQuery)
          );
        },
      }))
    ),
    {
      name: 'patients-store',
    }
  )
);

// Patients store selectors
export const patientsSelectors = {
  patients: () => usePatientsStore((state) => state.patients),
  selectedPatient: () => usePatientsStore((state) => state.selectedPatient),
  appointments: () => usePatientsStore((state) => state.appointments),
  pagination: () => usePatientsStore((state) => state.pagination),
  filters: () => usePatientsStore((state) => state.filters),
  isLoading: () => usePatientsStore((state) => state.isLoading),
  error: () => usePatientsStore((state) => state.error),
  getPatientById: (id: string) => usePatientsStore((state) => state.getPatientById(id)),
  getPatientAppointments: (patientId: string) => usePatientsStore((state) => state.getPatientAppointments(patientId)),
};

