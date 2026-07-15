export interface LabPanelDetails {
  id: string;
  slug: string;
  cat: string;
  name: string;
  collection: 'home' | 'clinic';
  lab: string;
  sample: string;
  fasting: string;
  turnaround: string;
  biomarkers: string[];
  price: number;
  discount?: number;
}

export interface CheckoutPayload {
  panelId: string;
  total: number;
}

const mockPanels: Record<string, LabPanelDetails> = {
  'cmp': {
    id: 'kinmeds-LAB-0042',
    slug: 'cmp',
    cat: 'Metabolic & Health',
    name: 'Comprehensive Metabolic Panel',
    collection: 'clinic',
    lab: 'Quest Diagnostics',
    sample: 'Blood (Venipuncture)',
    fasting: '12 hours required',
    turnaround: '1-2 business days',
    biomarkers: ['Glucose', 'BUN', 'Creatinine', 'Sodium', 'Potassium', 'Chloride', 'CO2', 'Calcium', 'Protein', 'Albumin', 'Globulin', 'Bilirubin', 'ALP', 'AST', 'ALT'],
    price: 45.00
  },
  'lipid': {
    id: 'kinmeds-LAB-0039',
    slug: 'lipid',
    cat: 'Cardiovascular',
    name: 'Lipid Panel',
    collection: 'clinic',
    lab: 'LabCorp',
    sample: 'Blood (Venipuncture)',
    fasting: '9-12 hours required',
    turnaround: '1-2 business days',
    biomarkers: ['Total Cholesterol', 'HDL', 'LDL', 'Triglycerides'],
    price: 39.00
  },
  'thyroid': {
    id: 'kinmeds-LAB-0051',
    slug: 'thyroid',
    cat: 'Hormones',
    name: 'Thyroid Panel (TSH, Free T4)',
    collection: 'home',
    lab: 'Quest Diagnostics',
    sample: 'Blood (Fingerprick)',
    fasting: 'Not required',
    turnaround: '2-4 business days',
    biomarkers: ['TSH', 'Free T4'],
    price: 65.00
  }
};

export async function getLabPanelBySlug(slug: string): Promise<LabPanelDetails> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const panel = mockPanels[slug.toLowerCase()];
      if (panel) {
        resolve(panel);
      } else {
        reject(new Error('Panel not found'));
      }
    }, 600);
  });
}

export async function validateCoupon(code: string): Promise<{ valid: boolean; discountAmount: number; message?: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (code.toUpperCase() === 'WELCOME10') {
        resolve({ valid: true, discountAmount: 10 });
      } else if (code.toUpperCase() === 'WELLIEMD50') {
        resolve({ valid: true, discountAmount: 50 });
      } else {
        resolve({ valid: false, discountAmount: 0, message: 'Invalid or expired promo code' });
      }
    }, 500);
  });
}

export async function submitCheckout(payload: any): Promise<{ success: boolean; orderId: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, orderId: `ord-${Math.floor(Math.random() * 100000)}` });
    }, 1500);
  });
}
