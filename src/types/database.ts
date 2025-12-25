/**
 * Database Type Definitions
 * Best practice: Define strict types for all database entities
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      diagnosis_history: {
        Row: {
          id: string
          diagnosis_text: string
          frequency: number
          last_used: string
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['diagnosis_history']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['diagnosis_history']['Insert']>
      }
      diagnoses: {
        Row: {
          id: string
          visit_id: string
          diagnosis_text: string
          is_primary: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['diagnoses']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['diagnoses']['Insert']>
      }
      clinical_notes: {
        Row: {
          id: string
          visit_id: string
          anamnesis: string | null
          therapy: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['clinical_notes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['clinical_notes']['Insert']>
      }
      vitals: {
        Row: {
          id: string
          visit_id: string
          systolic: number | null
          diastolic: number | null
          heart_rate: number | null
          temperature: number | null
          resp_rate: number | null
          spo2: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['vitals']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['vitals']['Insert']>
      }
      patients: {
        Row: {
          id: string
          nik_hash: string
          nik_hash_lookup: string
          nik_salt: string
          name: string
          dob: string
          sex: 'male' | 'female' | 'unknown'
          phone: string | null
          address_enc: string | null
          created_at: string
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['patients']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['patients']['Insert']>
      }
      visits: {
        Row: {
          id: string
          patient_id: string
          status: 'registered' | 'seen_by_doctor' | 'sent_to_pharmacy' | 'completed' | 'expired'
          queue_date: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['visits']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['visits']['Insert']>
      }
      staff: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['staff']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['staff']['Insert']>
      }
      staff_roles: {
        Row: {
          id: string
          staff_id: string
          role: 'admin' | 'doctor' | 'pharmacist' | 'kiosk'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['staff_roles']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['staff_roles']['Insert']>
      }
      devices: {
        Row: {
          id: string
          device_id: string
          name: string
          role_type: 'admin' | 'doctor' | 'pharmacy' | 'kiosk'
          status: 'approved' | 'blocked'
          assigned_user_id: string | null
          last_heartbeat_at: string | null
          registered_at: string
        }
        Insert: Omit<Database['public']['Tables']['devices']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['devices']['Insert']>
      }
      medicines: {
        Row: {
          id: string
          name: string
          unit: string | null
          price: number | null
          low_stock_threshold: number
          active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['medicines']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['medicines']['Insert']>
      }
      medicine_batches: {
        Row: {
          id: string
          medicine_id: string
          batch_no: string
          expiry_date: string
          quantity: number
          cost: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['medicine_batches']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['medicine_batches']['Insert']>
      }
      prescriptions: {
        Row: {
          id: string
          visit_id: string
          doctor_notes: string | null
          prescription_type: 'non_racik' | 'racik'
          sediaan: string | null
          additional_info: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['prescriptions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['prescriptions']['Insert']>
      }
      prescription_lines: {
        Row: {
          id: string
          prescription_id: string
          parent_prescription_line_id: string | null
          medicine_id: string | null
          drug_name: string
          dosage: string | null
          frequency: string | null
          duration: string | null
          instructions: string | null
          unit: string | null
          is_racik_ingredient: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['prescription_lines']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['prescription_lines']['Insert']>
      }
      doctor_queue: {
        Row: {
          id: string
          visit_id: string
          queue_date: string
          number: number | null
          status: 'waiting' | 'called' | 'completed' | 'expired'
          expires_at: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['doctor_queue']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['doctor_queue']['Insert']>
      }
      pharmacy_queue: {
        Row: {
          id: string
          visit_id: string
          queue_date: string
          number: number | null
          status: 'waiting' | 'processing' | 'completed'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['pharmacy_queue']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['pharmacy_queue']['Insert']>
      }
      staff_activity: {
        Row: {
          id: string
          user_id: string | null
          role: string | null
          device_id: string | null
          action: string | null
          target_table: string | null
          target_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['staff_activity']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['staff_activity']['Insert']>
      }
      payments: {
        Row: {
          id: string
          visit_id: string
          amount: number
          method: 'cash' | 'transfer' | 'card'
          reference: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      emr_kiosk_register_patient: {
        Args: {
          p_nik_hash_lookup: string
          p_nik_hash: string
          p_nik_salt: string
          p_name: string
          p_dob: string
          p_sex: 'male' | 'female' | 'unknown'
          p_phone?: string
          p_address_b64?: string
          p_device_id: string
        }
        Returns: { queue_number: number }
      }
      emr_doctor_finalize_visit: {
        Args: {
          p_visit_id: string
          p_device_id: string
          p_clinical_payload: Json
          p_prescriptions: Json[]
          p_send_to_pharmacy: boolean
          p_pharmacy_note?: string
        }
        Returns: void
      }
      emr_pharmacy_dispense: {
        Args: {
          p_visit_id: string
          p_items: Json[]
          p_device_id: string
        }
        Returns: void
      }
      emr_pharmacy_payment: {
        Args: {
          p_visit_id: string
          p_amount: number
          p_device_id: string
        }
        Returns: void
      }
      emr_admin_clear_expired: {
        Args: {
          p_device_id: string
        }
        Returns: { doctor_cleared: number; pharmacy_cleared: number }
      }
      emr_admin_close_day: {
        Args: {
          p_target_date: string
          p_device_id: string
        }
        Returns: Json
      }
      emr_device_heartbeat: {
        Args: {
          p_device_id: string
          p_meta?: Json
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for better type safety
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
export type Functions<T extends keyof Database['public']['Functions']> = Database['public']['Functions'][T]

// Commonly used types
export type Patient = Tables<'patients'>
export type Visit = Tables<'visits'>
export type Staff = Tables<'staff'>
export type StaffRole = Tables<'staff_roles'>
export type Device = Tables<'devices'>
export type Medicine = Tables<'medicines'>
export type MedicineBatch = Tables<'medicine_batches'>
export type DoctorQueue = Tables<'doctor_queue'>
export type PharmacyQueue = Tables<'pharmacy_queue'>
export type StaffActivity = Tables<'staff_activity'>
export type Payment = Tables<'payments'>
