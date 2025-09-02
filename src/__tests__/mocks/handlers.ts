import { http, HttpResponse } from 'msw';

import { createMockUser, createMockTokens, createMockApiResponse, createMockApiError } from '../utils';

const API_BASE_URL = 'http://localhost:3000/api';

export const handlers = [
  // Authentication endpoints
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as any;
    
    // Mock successful login
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json(
        createMockApiResponse({
          user: createMockUser({ email: body.email }),
          tokens: createMockTokens(),
          permissions: ['patient:read:own_data', 'patient:view:appointments'],
          features: { ENABLE_TELEMEDICINE: true },
        })
      );
    }
    
    // Mock failed login
    return HttpResponse.json(
      createMockApiError('Invalid credentials', 'AUTHENTICATION_ERROR'),
      { status: 401 }
    );
  }),

  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json() as any;
    
    // Mock successful registration
    return HttpResponse.json(
      createMockApiResponse({
        user: createMockUser({
          email: body.email,
          firstName: body.firstName,
          lastName: body.lastName,
        }),
        tokens: createMockTokens(),
        permissions: ['patient:read:own_data', 'patient:view:appointments'],
        features: {},
      }),
      { status: 201 }
    );
  }),

  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json(createMockApiResponse({}));
  }),

  http.get(`${API_BASE_URL}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        createMockApiError('Authentication required', 'AUTHENTICATION_ERROR'),
        { status: 401 }
      );
    }
    
    return HttpResponse.json(
      createMockApiResponse(createMockUser())
    );
  }),

  http.patch(`${API_BASE_URL}/auth/profile`, async ({ request }) => {
    const body = await request.json() as any;
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        createMockApiError('Authentication required', 'AUTHENTICATION_ERROR'),
        { status: 401 }
      );
    }
    
    return HttpResponse.json(
      createMockApiResponse(createMockUser(body))
    );
  }),

  http.post(`${API_BASE_URL}/auth/change-password`, async ({ request }) => {
    const body = await request.json() as any;
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        createMockApiError('Authentication required', 'AUTHENTICATION_ERROR'),
        { status: 401 }
      );
    }
    
    // Mock validation
    if (body.currentPassword !== 'oldpassword') {
      return HttpResponse.json(
        createMockApiError('Current password is incorrect', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }
    
    return HttpResponse.json(createMockApiResponse({}));
  }),

  http.post(`${API_BASE_URL}/auth/forgot-password`, () => {
    return HttpResponse.json(createMockApiResponse({}));
  }),

  http.post(`${API_BASE_URL}/auth/reset-password`, async ({ request }) => {
    const body = await request.json() as any;
    
    if (!body.token || body.token === 'invalid-token') {
      return HttpResponse.json(
        createMockApiError('Invalid or expired reset token', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }
    
    return HttpResponse.json(createMockApiResponse({}));
  }),

  http.post(`${API_BASE_URL}/auth/refresh`, async ({ request }) => {
    const body = await request.json() as any;
    
    if (!body.refreshToken || body.refreshToken === 'invalid-refresh-token') {
      return HttpResponse.json(
        createMockApiError('Invalid refresh token', 'AUTHENTICATION_ERROR'),
        { status: 401 }
      );
    }
    
    return HttpResponse.json(
      createMockApiResponse({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      })
    );
  }),

  // Feature flags endpoint
  http.get(`${API_BASE_URL}/feature-flags`, () => {
    return HttpResponse.json(
      createMockApiResponse({
        flags: {
          ENABLE_TELEMEDICINE: {
            key: 'ENABLE_TELEMEDICINE',
            name: 'Telemedicine',
            description: 'Enable telemedicine appointments',
            enabled: true,
          },
          ENABLE_PATIENT_MESSAGING: {
            key: 'ENABLE_PATIENT_MESSAGING',
            name: 'Patient Messaging',
            description: 'Enable patient-provider messaging',
            enabled: true,
          },
          ENABLE_NEW_DASHBOARD: {
            key: 'ENABLE_NEW_DASHBOARD',
            name: 'New Dashboard',
            description: 'Enable the redesigned dashboard interface',
            enabled: false,
          },
        },
        lastUpdated: new Date().toISOString(),
      })
    );
  }),

  // Patients endpoint (for provider/admin users)
  http.get(`${API_BASE_URL}/patients`, ({ request, params }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search');
    
    // Mock patients data
    const allPatients = Array.from({ length: 50 }, (_, i) => ({
      id: `patient-${i + 1}`,
      firstName: `Patient${i + 1}`,
      lastName: `LastName${i + 1}`,
      email: `patient${i + 1}@example.com`,
      phoneNumber: `+1 (555) ${String(i + 1).padStart(3, '0')}-${String(i + 1).padStart(4, '0')}`,
      dateOfBirth: new Date(1980 + (i % 40), i % 12, (i % 28) + 1).toISOString(),
      gender: ['male', 'female', 'other'][i % 3],
      createdAt: new Date(2024, 0, i + 1).toISOString(),
      updatedAt: new Date(2024, 0, i + 1).toISOString(),
    }));
    
    // Filter by search if provided
    let filteredPatients = allPatients;
    if (search) {
      filteredPatients = allPatients.filter(patient =>
        patient.firstName.toLowerCase().includes(search.toLowerCase()) ||
        patient.lastName.toLowerCase().includes(search.toLowerCase()) ||
        patient.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPatients = filteredPatients.slice(startIndex, endIndex);
    
    return HttpResponse.json(
      createMockApiResponse({
        items: paginatedPatients,
        pagination: {
          page,
          limit,
          total: filteredPatients.length,
          totalPages: Math.ceil(filteredPatients.length / limit),
        },
      })
    );
  }),

  http.get(`${API_BASE_URL}/patients/:id`, ({ params }) => {
    const { id } = params;
    
    if (id === 'not-found') {
      return HttpResponse.json(
        createMockApiError('Patient not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }
    
    return HttpResponse.json(
      createMockApiResponse({
        id: id as string,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+1 (555) 123-4567',
        dateOfBirth: '1990-01-01T00:00:00Z',
        gender: 'male',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'US',
        },
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phoneNumber: '+1 (555) 987-6543',
        },
        medicalHistory: ['Hypertension', 'Diabetes Type 2'],
        allergies: ['Penicillin'],
        medications: ['Metformin', 'Lisinopril'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      })
    );
  }),

  // Appointments endpoints
  http.get(`${API_BASE_URL}/appointments`, ({ request }) => {
    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId');
    
    const appointments = [
      {
        id: 'appointment-1',
        patientId: patientId || 'test-patient-id',
        providerId: 'test-provider-id',
        type: 'consultation',
        status: 'scheduled',
        scheduledAt: '2024-12-25T10:00:00Z',
        duration: 30,
        reason: 'Annual checkup',
        notes: 'Patient reports no issues',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'appointment-2',
        patientId: patientId || 'test-patient-id',
        providerId: 'test-provider-id',
        type: 'follow-up',
        status: 'confirmed',
        scheduledAt: '2024-12-30T14:00:00Z',
        duration: 15,
        reason: 'Follow-up on blood pressure',
        notes: '',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];
    
    return HttpResponse.json(
      createMockApiResponse({
        items: appointments,
        pagination: {
          page: 1,
          limit: 10,
          total: appointments.length,
          totalPages: 1,
        },
      })
    );
  }),

  http.post(`${API_BASE_URL}/appointments`, async ({ request }) => {
    const body = await request.json() as any;
    
    return HttpResponse.json(
      createMockApiResponse({
        id: 'new-appointment-id',
        ...body,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      { status: 201 }
    );
  }),

  // Error simulation endpoints for testing
  http.get(`${API_BASE_URL}/test/network-error`, () => {
    return HttpResponse.error();
  }),

  http.get(`${API_BASE_URL}/test/server-error`, () => {
    return HttpResponse.json(
      createMockApiError('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }),

  http.get(`${API_BASE_URL}/test/timeout`, () => {
    return new Promise(() => {
      // Never resolve to simulate timeout
    });
  }),

  // Catch-all handler for unhandled requests
  http.all('*', ({ request }) => {
    console.warn(`Unhandled ${request.method} request to ${request.url}`);
    return HttpResponse.json(
      createMockApiError('Not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }),
];

export { handlers };
