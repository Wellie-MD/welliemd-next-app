import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Toast types
export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Modal types
export interface Modal {
  id: string;
  component: React.ComponentType<any>;
  props?: Record<string, unknown>;
  options?: {
    closable?: boolean;
    overlay?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  };
}

// Sidebar state
export interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  activeSection: string;
}

// UI store state interface
interface UIState {
  // Toast state
  toasts: Toast[];
  
  // Modal state
  modals: Modal[];
  
  // Sidebar state
  sidebar: SidebarState;
  
  // Loading states
  globalLoading: boolean;
  loadingStates: Record<string, boolean>;
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // Actions
  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Modal actions
  openModal: (modal: Omit<Modal, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  
  // Sidebar actions
  setSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (isCollapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setActiveSection: (section: string) => void;
  
  // Loading actions
  setGlobalLoading: (loading: boolean) => void;
  setLoading: (key: string, loading: boolean) => void;
  getLoading: (key: string) => boolean;
  
  // Theme actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Utility actions
  showSuccessToast: (title: string, description?: string) => void;
  showErrorToast: (title: string, description?: string) => void;
  showWarningToast: (title: string, description?: string) => void;
  showInfoToast: (title: string, description?: string) => void;
}

// Generate unique ID for toasts and modals
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Create UI store
export const useUIStore = create<UIState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        toasts: [],
        modals: [],
        sidebar: {
          isOpen: true,
          isCollapsed: false,
          activeSection: 'dashboard',
        },
        globalLoading: false,
        loadingStates: {},
        theme: 'system',

        // Toast actions
        addToast: (toast: Omit<Toast, 'id'>) => {
          const id = generateId();
          const newToast: Toast = {
            id,
            duration: 5000, // Default 5 seconds
            ...toast,
          };

          set((state) => {
            state.toasts.push(newToast);
          });

          // Auto-remove toast after duration
          if (newToast.duration && newToast.duration > 0) {
            setTimeout(() => {
              get().removeToast(id);
            }, newToast.duration);
          }

          return id;
        },

        removeToast: (id: string) => {
          set((state) => {
            state.toasts = state.toasts.filter((toast) => toast.id !== id);
          });
        },

        clearToasts: () => {
          set((state) => {
            state.toasts = [];
          });
        },

        // Modal actions
        openModal: (modal: Omit<Modal, 'id'>) => {
          const id = generateId();
          const newModal: Modal = {
            id,
            options: {
              closable: true,
              overlay: true,
              size: 'md',
              ...modal.options,
            },
            ...modal,
          };

          set((state) => {
            state.modals.push(newModal);
          });

          return id;
        },

        closeModal: (id: string) => {
          set((state) => {
            state.modals = state.modals.filter((modal) => modal.id !== id);
          });
        },

        closeAllModals: () => {
          set((state) => {
            state.modals = [];
          });
        },

        // Sidebar actions
        setSidebarOpen: (isOpen: boolean) => {
          set((state) => {
            state.sidebar.isOpen = isOpen;
          });
        },

        toggleSidebar: () => {
          set((state) => {
            state.sidebar.isOpen = !state.sidebar.isOpen;
          });
        },

        setSidebarCollapsed: (isCollapsed: boolean) => {
          set((state) => {
            state.sidebar.isCollapsed = isCollapsed;
          });
        },

        toggleSidebarCollapsed: () => {
          set((state) => {
            state.sidebar.isCollapsed = !state.sidebar.isCollapsed;
          });
        },

        setActiveSection: (section: string) => {
          set((state) => {
            state.sidebar.activeSection = section;
          });
        },

        // Loading actions
        setGlobalLoading: (loading: boolean) => {
          set((state) => {
            state.globalLoading = loading;
          });
        },

        setLoading: (key: string, loading: boolean) => {
          set((state) => {
            if (loading) {
              state.loadingStates[key] = true;
            } else {
              delete state.loadingStates[key];
            }
          });
        },

        getLoading: (key: string) => {
          return get().loadingStates[key] ?? false;
        },

        // Theme actions
        setTheme: (theme: 'light' | 'dark' | 'system') => {
          set((state) => {
            state.theme = theme;
          });
        },

        // Utility toast methods
        showSuccessToast: (title: string, description?: string) => {
          get().addToast({ title, description, type: 'success' });
        },

        showErrorToast: (title: string, description?: string) => {
          get().addToast({ title, description, type: 'error', duration: 7000 });
        },

        showWarningToast: (title: string, description?: string) => {
          get().addToast({ title, description, type: 'warning', duration: 6000 });
        },

        showInfoToast: (title: string, description?: string) => {
          get().addToast({ title, description, type: 'info' });
        },
      }))
    ),
    {
      name: 'ui-store',
    }
  )
);

// UI store selectors
export const uiSelectors = {
  toasts: () => useUIStore((state) => state.toasts),
  modals: () => useUIStore((state) => state.modals),
  sidebar: () => useUIStore((state) => state.sidebar),
  globalLoading: () => useUIStore((state) => state.globalLoading),
  theme: () => useUIStore((state) => state.theme),
  getLoading: (key: string) => useUIStore((state) => state.getLoading(key)),
};

