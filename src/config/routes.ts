// Route constants and configuration
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/auth/signin',
  REGISTER: '/auth/signup',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  
  // Protected routes
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  
  // Patient routes
  APPOINTMENTS: '/appointments',
  APPOINTMENTS_NEW: '/appointments/new',
  APPOINTMENTS_DETAIL: '/appointments/:id',
  
  MEDICAL_RECORDS: '/medical-records',
  MEDICAL_RECORDS_DETAIL: '/medical-records/:id',
  
  PRESCRIPTIONS: '/prescriptions',
  PRESCRIPTIONS_DETAIL: '/prescriptions/:id',
  
  MESSAGES: '/messages',
  MESSAGES_CONVERSATION: '/messages/:conversationId',
  
  LAB_RESULTS: '/lab-results',
  LAB_RESULTS_DETAIL: '/lab-results/:id',
  
  // Provider routes (if user has provider role)
  PATIENTS: '/patients',
  PATIENTS_DETAIL: '/patients/:id',
  PATIENTS_NEW: '/patients/new',
  
  PROVIDER_APPOINTMENTS: '/provider/appointments',
  PROVIDER_SCHEDULE: '/provider/schedule',
  PROVIDER_ANALYTICS: '/provider/analytics',
  
  // Admin routes (if user has admin role)
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_PROVIDERS: '/admin/providers',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_LOGS: '/admin/logs',
  
  // Settings
  SETTINGS: '/settings',
  SETTINGS_ACCOUNT: '/settings/account',
  SETTINGS_SECURITY: '/settings/security',
  SETTINGS_NOTIFICATIONS: '/settings/notifications',
  SETTINGS_PRIVACY: '/settings/privacy',
  
  // Error pages
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/401',
  FORBIDDEN: '/403',
  SERVER_ERROR: '/500',
} as const;

export type Route = typeof ROUTES[keyof typeof ROUTES];

// Route metadata for navigation and permissions
export interface RouteConfig {
  path: string;
  title: string;
  description?: string;
  requiresAuth: boolean;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  allowedFeatures?: string[];
  showInNavigation?: boolean;
  icon?: string;
  parent?: string;
  order?: number;
}

// Route configurations
export const ROUTE_CONFIGS: Record<string, RouteConfig> = {
  [ROUTES.HOME]: {
    path: ROUTES.HOME,
    title: 'Home',
    requiresAuth: false,
    showInNavigation: false,
  },
  
  [ROUTES.LOGIN]: {
    path: ROUTES.LOGIN,
    title: 'Sign In',
    requiresAuth: false,
    showInNavigation: false,
  },
  
  [ROUTES.REGISTER]: {
    path: ROUTES.REGISTER,
    title: 'Sign Up',
    requiresAuth: false,
    showInNavigation: false,
  },
  
  [ROUTES.DASHBOARD]: {
    path: ROUTES.DASHBOARD,
    title: 'Dashboard',
    description: 'Overview of your health information',
    requiresAuth: true,
    showInNavigation: true,
    icon: 'LayoutDashboard',
    order: 1,
  },
  
  [ROUTES.APPOINTMENTS]: {
    path: ROUTES.APPOINTMENTS,
    title: 'Appointments',
    description: 'Manage your appointments',
    requiresAuth: true,
    requiredPermissions: ['patient:view:appointments'],
    showInNavigation: true,
    icon: 'Calendar',
    order: 2,
  },
  
  [ROUTES.MEDICAL_RECORDS]: {
    path: ROUTES.MEDICAL_RECORDS,
    title: 'Medical Records',
    description: 'View your medical history',
    requiresAuth: true,
    requiredPermissions: ['patient:view:medical_records'],
    showInNavigation: true,
    icon: 'FileText',
    order: 3,
  },
  
  [ROUTES.PRESCRIPTIONS]: {
    path: ROUTES.PRESCRIPTIONS,
    title: 'Prescriptions',
    description: 'View your prescriptions',
    requiresAuth: true,
    requiredPermissions: ['patient:view:prescriptions'],
    showInNavigation: true,
    icon: 'Pill',
    order: 4,
  },
  
  [ROUTES.MESSAGES]: {
    path: ROUTES.MESSAGES,
    title: 'Messages',
    description: 'Communicate with your healthcare team',
    requiresAuth: true,
    requiredPermissions: ['patient:send:messages'],
    showInNavigation: true,
    icon: 'MessageSquare',
    order: 5,
  },
  
  [ROUTES.LAB_RESULTS]: {
    path: ROUTES.LAB_RESULTS,
    title: 'Lab Results',
    description: 'View your laboratory test results',
    requiresAuth: true,
    requiredPermissions: ['patient:view:medical_records'],
    showInNavigation: true,
    icon: 'TestTube',
    order: 6,
  },
  
  [ROUTES.PATIENTS]: {
    path: ROUTES.PATIENTS,
    title: 'Patients',
    description: 'Manage patient records',
    requiresAuth: true,
    requiredPermissions: ['provider:view:patients'],
    requiredRoles: ['provider', 'admin'],
    showInNavigation: true,
    icon: 'Users',
    order: 10,
  },
  
  [ROUTES.PROVIDER_APPOINTMENTS]: {
    path: ROUTES.PROVIDER_APPOINTMENTS,
    title: 'Provider Appointments',
    description: 'Manage patient appointments',
    requiresAuth: true,
    requiredPermissions: ['provider:manage:appointments'],
    requiredRoles: ['provider', 'admin'],
    showInNavigation: true,
    icon: 'CalendarCheck',
    order: 11,
  },
  
  [ROUTES.PROVIDER_SCHEDULE]: {
    path: ROUTES.PROVIDER_SCHEDULE,
    title: 'Schedule',
    description: 'Manage your schedule',
    requiresAuth: true,
    requiredPermissions: ['provider:manage:appointments'],
    requiredRoles: ['provider', 'admin'],
    showInNavigation: true,
    icon: 'Clock',
    order: 12,
  },
  
  [ROUTES.PROVIDER_ANALYTICS]: {
    path: ROUTES.PROVIDER_ANALYTICS,
    title: 'Analytics',
    description: 'View practice analytics',
    requiresAuth: true,
    requiredPermissions: ['provider:view:analytics'],
    requiredRoles: ['provider', 'admin'],
    showInNavigation: true,
    icon: 'BarChart3',
    order: 13,
  },
  
  [ROUTES.ADMIN]: {
    path: ROUTES.ADMIN,
    title: 'Administration',
    description: 'System administration',
    requiresAuth: true,
    requiredRoles: ['admin'],
    showInNavigation: true,
    icon: 'Settings2',
    order: 20,
  },
  
  [ROUTES.ADMIN_USERS]: {
    path: ROUTES.ADMIN_USERS,
    title: 'Users',
    description: 'Manage users',
    requiresAuth: true,
    requiredPermissions: ['admin:manage:users'],
    requiredRoles: ['admin'],
    showInNavigation: true,
    icon: 'UserCog',
    parent: ROUTES.ADMIN,
    order: 21,
  },
  
  [ROUTES.ADMIN_PROVIDERS]: {
    path: ROUTES.ADMIN_PROVIDERS,
    title: 'Providers',
    description: 'Manage healthcare providers',
    requiresAuth: true,
    requiredPermissions: ['admin:manage:providers'],
    requiredRoles: ['admin'],
    showInNavigation: true,
    icon: 'Stethoscope',
    parent: ROUTES.ADMIN,
    order: 22,
  },
  
  [ROUTES.PROFILE]: {
    path: ROUTES.PROFILE,
    title: 'Profile',
    description: 'Manage your profile',
    requiresAuth: true,
    showInNavigation: false,
  },
  
  [ROUTES.SETTINGS]: {
    path: ROUTES.SETTINGS,
    title: 'Settings',
    description: 'Account settings',
    requiresAuth: true,
    showInNavigation: true,
    icon: 'Settings',
    order: 100,
  },
};

// Helper functions for route utilities
export const getRouteConfig = (path: string): RouteConfig | undefined => {
  return ROUTE_CONFIGS[path];
};

export const getNavigationRoutes = (): RouteConfig[] => {
  return Object.values(ROUTE_CONFIGS)
    .filter(config => config.showInNavigation)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

export const isProtectedRoute = (path: string): boolean => {
  const config = getRouteConfig(path);
  return config?.requiresAuth ?? false;
};

export const getRoutePermissions = (path: string): string[] => {
  const config = getRouteConfig(path);
  return config?.requiredPermissions ?? [];
};

export const getRouteRoles = (path: string): string[] => {
  const config = getRouteConfig(path);
  return config?.requiredRoles ?? [];
};

// Dynamic route helpers
export const buildRoute = (template: string, params: Record<string, string>): string => {
  let route = template;
  Object.entries(params).forEach(([key, value]) => {
    route = route.replace(`:${key}`, value);
  });
  return route;
};

// Examples:
// buildRoute(ROUTES.APPOINTMENTS_DETAIL, { id: '123' }) => '/appointments/123'
// buildRoute(ROUTES.PATIENTS_DETAIL, { id: 'patient-456' }) => '/patients/patient-456'

