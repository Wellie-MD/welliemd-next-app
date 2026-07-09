/**
 * Store Settings Types
 * 
 * TypeScript interfaces for the Store Settings API
 * Backend: welliemd/apps/clients/models.py - StoreSettings model
 * API Docs: welliemd/apps/clients/API_DOCUMENTATION.md
 */

export type BusinessStructure = 
  | 'single-member-llc' 
  | 'multi-member-llc' 
  | 'corporation' 
  | 'partnership';

export type BankAccountType = 
  | 'us-checking' 
  | 'us-savings' 
  | 'canadian-checking';

export interface StoreSettings {
  id: string;
  client: string;
  
  // General Information
  visitor_message?: string;
  store_name: string;
  legal_business_name?: string;
  business_structure: BusinessStructure;
  
  // Order Configuration
  order_prefix?: string;
  order_suffix?: string;
  timezone: string;
  
  // Password Protection
  password_enabled: boolean;
  password?: string; // Write-only, not returned in responses
  
  // Personal Information
  legal_first_name?: string;
  legal_last_name?: string;
  date_of_birth?: string; // ISO date string (YYYY-MM-DD)
  email?: string;
  phone?: string;
  
  // Business Address
  business_address_line1?: string;
  business_address_line2?: string;
  business_country?: string;
  business_city?: string;
  business_state?: string;
  business_zip?: string;
  ein?: string;
  doing_business_as?: string;
  
  // Payment Information (for reference only)
  bank_account_type?: BankAccountType;
  routing_number?: string;
  account_number?: string; // Write-only, not returned in responses
  statement_descriptor?: string;
  shortened_descriptor?: string;
  
  // Customer Support Details
  support_address_line1?: string;
  support_address_line2?: string;
  support_country?: string;
  support_city?: string;
  support_state?: string;
  support_zip?: string;
  support_phone?: string;
  support_email?: string;
  support_website?: string;
  
  // Timestamps
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

export interface StoreSettingsResponse {
  success: boolean;
  store_settings: StoreSettings;
  client_id: string;
  client_name: string;
  created: boolean;
}

export interface StoreSettingsUpdateResponse {
  success: boolean;
  message: string;
  store_settings: StoreSettings;
}

export interface StoreSettingsListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: StoreSettings[];
}

export interface StoreSettingsError {
  error: string;
  detail: string;
}

// Partial type for updates (all fields optional except those required by backend)
export type StoreSettingsUpdate = Partial<Omit<StoreSettings, 'id' | 'client' | 'created_at' | 'updated_at'>>;

// Type for creating new store settings
export type StoreSettingsCreate = Omit<StoreSettings, 'id' | 'created_at' | 'updated_at'> & {
  client?: string; // Optional, can be resolved from middleware
};
