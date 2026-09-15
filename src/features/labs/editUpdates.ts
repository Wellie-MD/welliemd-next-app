export interface LabEditValues {
  patientPrice: string;
  discountedPatientPrice: string;
  shippingFee: string;
  isActive: boolean;
  serviceStates: string[];
}

export interface EditableLabSnapshot {
  is_combined: boolean;
  patient_price: number;
  discounted_patient_price: number | null;
  shipping_fee: number;
  is_active: boolean;
  service_states: string[];
}

function sameStates(left: string[], right: string[]) {
  return [...left].sort().join("\u0000") === [...right].sort().join("\u0000");
}

export function buildLabPanelUpdates(values: LabEditValues, initial: EditableLabSnapshot) {
  const updates: {
    patient_price?: number;
    discounted_patient_price?: number | null;
    shipping_fee?: number;
    is_active?: boolean;
    service_states?: string[];
  } = {};
  const patientPrice = Number.parseFloat(values.patientPrice) || 0;
  const shippingFee = Number.parseFloat(values.shippingFee) || 0;
  const discountedPatientPrice = values.discountedPatientPrice.trim()
    ? Number.parseFloat(values.discountedPatientPrice)
    : null;

  if (patientPrice !== initial.patient_price) updates.patient_price = patientPrice;
  if (!initial.is_combined && discountedPatientPrice !== initial.discounted_patient_price) {
    updates.discounted_patient_price = discountedPatientPrice;
  }
  if (initial.is_combined && shippingFee !== initial.shipping_fee) updates.shipping_fee = shippingFee;
  if (values.isActive !== initial.is_active) updates.is_active = values.isActive;
  if (!sameStates(values.serviceStates, initial.service_states)) updates.service_states = values.serviceStates;
  return updates;
}
