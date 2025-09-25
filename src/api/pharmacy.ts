import api from './axiosInstance'

export interface Pharmacy {
    id: string
    name: string
    display_name: string
    abbreviation: string
    provider_type: string
    provider_type_display: string
    environment: string
    environment_display: string
    is_active: boolean
    onboarding_status: string
    onboarding_status_display: string
    onboarding_progress: number
    health_status: string
    is_ready_for_orders: boolean
    primary_contact_name: string
    primary_contact_email: string
    city: string
    state: string
    country: string
    product_count: number
    active_product_count: number
    max_daily_orders: number | null
    sla_shipping_days: number
    has_baa: boolean
    is_billable: boolean
    sync_to_tenants: boolean
    created_at: string
    updated_at: string
}

export interface CreatePharmacyData {
    name: string
    display_name?: string
    abbreviation: string
    provider_type: string
    environment: string
    primary_contact_name: string
    primary_contact_email: string
    primary_contact_phone: string
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    zip_code: string
    country: string
    api_url?: string
    api_version?: string
    practice_id?: string
    client_abbreviation?: string
    is_active?: boolean
    is_billable?: boolean
    auto_charge_fees?: boolean
    sync_to_tenants?: boolean
    custom_packaging?: boolean
    custom_labeling?: boolean
    business_days_only?: boolean
    service_states?: string[]
    excluded_states?: string[]
    max_daily_orders?: number
    sla_response_time_hours?: number
    sla_shipping_days?: number
    api_key?: string
    api_secret?: string
}

interface PharmacyListResponse {
    count: number
    next: string | null
    previous: string | null
    results: Pharmacy[]
}

export interface PharmacyFilters {
    search?: string
    provider_type?: string
    environment?: string
    onboarding_status?: string
    is_active?: boolean
    is_billable?: boolean
    serves_state?: string
    treatment_category?: string
    billable_only?: boolean
    active_only?: boolean
    ready_only?: boolean
}

// Get all pharmacies with optional filters
export const getPharmacies = async (filters: PharmacyFilters = {}): Promise<Pharmacy[]> => {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value))
        }
    })

    const queryString = params.toString()
    const url = queryString ? `/pharmacy/?${queryString}` : '/pharmacy/'

    const response = await api.get<PharmacyListResponse>(url)
    return response.data.results || response.data as any
}

// Get single pharmacy by ID
export const getPharmacy = async (id: string): Promise<Pharmacy> => {
    const response = await api.get<Pharmacy>(`/pharmacy/${id}/`)
    return response.data
}

// Create new pharmacy
export const createPharmacy = async (data: CreatePharmacyData): Promise<Pharmacy> => {
    const response = await api.post<Pharmacy>('/pharmacy/', data)
    return response.data
}

// Update existing pharmacy
export const updatePharmacy = async (id: string, data: Partial<CreatePharmacyData>): Promise<Pharmacy> => {
    const response = await api.patch<Pharmacy>(`/pharmacy/${id}/`, data)
    return response.data
}

// Delete pharmacy
export const deletePharmacy = async (id: string): Promise<void> => {
    await api.delete(`/pharmacy/${id}/`)
}

// Test pharmacy API connection
export const testPharmacyConnection = async (id: string): Promise<{
    success: boolean
    message: string
    pharmacy_status?: string
    response_time_ms?: number
    error_type?: string
}> => {
    const response = await api.post(`/pharmacy/${id}/test_connection/`)
    return response.data
}

// Get pharmacy statistics
export const getPharmacyStats = async (): Promise<{
    overview: {
        total_pharmacies: number
        active_pharmacies: number
        live_pharmacies: number
        activation_rate: number
    }
    provider_breakdown: Array<{ provider_type: string; count: number }>
    status_breakdown: Array<{ onboarding_status: string; count: number }>
    generated_at: string
}> => {
    const response = await api.get('/pharmacy/stats/')
    return response.data
}

// Get pharmacy products
export const getPharmacyProducts = async (filters: {
    pharmacy?: string
    search?: string
    treatment_category?: string
    active_only?: boolean
    available_only?: boolean
} = {}): Promise<any[]> => {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value))
        }
    })

    const queryString = params.toString()
    const url = queryString ? `/pharmacy/products/?${queryString}` : '/pharmacy/products/'

    const response = await api.get(url)
    return response.data.results || response.data
}

// Get product statistics
export const getProductStats = async (): Promise<{
    overview: {
        total_products: number
        active_products: number
        in_stock_products: number
        availability_rate: number
    }
    category_breakdown: Array<{ treatment_category: string; count: number }>
    generated_at: string
}> => {
    const response = await api.get('/pharmacy/products/stats/')
    return response.data
}
