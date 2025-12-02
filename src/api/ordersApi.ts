import api from './axiosInstance'

export interface OrderPatientSummary {
  id: string
  full_name: string
}

export interface Order {
  id: string
  display_id?: string
  patient?: OrderPatientSummary | null
  amount?: string
  status?: string
  created_at?: string
  updated_at?: string
  name?: string
  email?: string
  phone?: string
  pharmacy_display?: string | null
  orderDate?: string | null
  datePrescribed?: string | null
  datePrintedShipped?: string | null
  paymentDate?: string | null
  mrn?: string | null
  paymentStatus?: string | null
  visitStatus?: string | null
  address?: string | null
  orderStatus?: string | null
  orderTotal?: string | null
}

export interface PaginatedOrdersResponse {
  count: number
  next: string | null
  previous: string | null
  results: Order[]
}

const ENDPOINT = '/orders/'

export const fetchOrders = async (params?: Record<string, unknown>): Promise<PaginatedOrdersResponse> => {
  try {
    const { data } = await api.get<PaginatedOrdersResponse>(ENDPOINT, { params })
    return data
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    throw error
  }
}

export const fetchOrder = async (id: string): Promise<Order> => {
  try {
    const { data } = await api.get<Order>(`${ENDPOINT}${id}/`)
    return data
  } catch (error) {
    console.error(`Failed to fetch order ${id}:`, error)
    throw error
  }
}

export const createOrder = async (payload: Partial<Order>): Promise<Order> => {
  try {
    const { data } = await api.post<Order>(ENDPOINT, payload)
    return data
  } catch (error) {
    console.error('Failed to create order:', error)
    throw error
  }
}

export const updateOrder = async (id: string, payload: Partial<Order>): Promise<Order> => {
  try {
    const { data } = await api.patch<Order>(`${ENDPOINT}${id}/`, payload)
    return data
  } catch (error) {
    console.error(`Failed to update order ${id}:`, error)
    throw error
  }
}

export const deleteOrder = async (id: string): Promise<void> => {
  try {
    await api.delete(`${ENDPOINT}${id}/`)
  } catch (error) {
    console.error(`Failed to delete order ${id}:`, error)
    throw error
  }
}

export const searchOrders = async (query: string): Promise<PaginatedOrdersResponse> => {
  try {
    const { data } = await api.get<PaginatedOrdersResponse>(ENDPOINT, { params: { search: query } })
    return data
  } catch (error) {
    console.error('Failed to search orders:', error)
    throw error
  }
}

export const ordersApi = {
  fetchOrders,
  fetchOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  searchOrders,
}
