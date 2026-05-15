import api from "./axiosInstance"

export type PatientPaymentGateway = "stripe" | "nmi" | "authorize_net"

export interface PatientPaymentMethod {
  id: string
  user_id: string
  processor: string
  masked_card_number?: string
  card_brand?: string
  card_expiry_month?: string | number | null
  card_expiry_year?: string | number | null
  billing_postal_code?: string | null
  is_default?: boolean
  created_at?: string
  updated_at?: string
}

const endpointForGateway: Record<PatientPaymentGateway, string> = {
  stripe: "/stripe/payment-methods/",
  nmi: "/payments/payment-methods/",
  authorize_net: "/authorizenet/payment-methods/",
}

export const patientPaymentMethodsApi = {
  listPaymentMethods: async (
    gateway: PatientPaymentGateway,
    userId?: string
  ): Promise<PatientPaymentMethod[]> => {
    const { data } = await api.get<PatientPaymentMethod[]>(
      endpointForGateway[gateway],
      {
        params: userId ? { user_id: userId } : undefined,
      }
    )
    return data || []
  },
}

export default patientPaymentMethodsApi
