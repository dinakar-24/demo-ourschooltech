export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_current: boolean | null
          name: string
          school_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean | null
          name: string
          school_id: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean | null
          name?: string
          school_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          school_id: string
          target_classes: string[] | null
          target_roles: Database["public"]["Enums"]["app_role"][] | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          school_id: string
          target_classes?: string[] | null
          target_roles?: Database["public"]["Enums"]["app_role"][] | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          school_id?: string
          target_classes?: string[] | null
          target_roles?: Database["public"]["Enums"]["app_role"][] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          marked_by: string | null
          notes: string | null
          school_id: string
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          school_id: string
          status: string
          student_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          school_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      classes: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          class_name: string
          created_at: string
          exam_date: string
          id: string
          max_marks: number
          name: string
          school_id: string
          subject: string
        }
        Insert: {
          class_name: string
          created_at?: string
          exam_date: string
          id?: string
          max_marks?: number
          name: string
          school_id: string
          subject: string
        }
        Update: {
          class_name?: string
          created_at?: string
          exam_date?: string
          id?: string
          max_marks?: number
          name?: string
          school_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_invoice_components: {
        Row: {
          amount: number
          created_at: string
          fee_type: string
          id: string
          invoice_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          fee_type: string
          id?: string
          invoice_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          fee_type?: string
          id?: string
          invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_invoice_components_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "fee_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_invoices: {
        Row: {
          balance: number
          created_at: string
          due_date: string
          id: string
          paid_amount: number
          school_id: string
          status: string
          student_id: string
          term_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          due_date: string
          id?: string
          paid_amount?: number
          school_id: string
          status?: string
          student_id: string
          term_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          due_date?: string
          id?: string
          paid_amount?: number
          school_id?: string
          status?: string
          student_id?: string
          term_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_invoices_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_invoices_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "fee_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_payments: {
        Row: {
          amount: number
          bank_name: string | null
          cheque_date: string | null
          cheque_number: string | null
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: string
          receipt_number: string
          received_by: string | null
          school_id: string
          student_id: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          bank_name?: string | null
          cheque_date?: string | null
          cheque_number?: string | null
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method: string
          receipt_number: string
          received_by?: string | null
          school_id: string
          student_id: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          bank_name?: string | null
          cheque_date?: string | null
          cheque_number?: string | null
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          receipt_number?: string
          received_by?: string | null
          school_id?: string
          student_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "fee_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          academic_year_id: string
          base_amount: number
          class_id: string
          created_at: string
          fee_type: string
          frequency: string
          id: string
          school_id: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          base_amount: number
          class_id: string
          created_at?: string
          fee_type: string
          frequency?: string
          id?: string
          school_id: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          base_amount?: number
          class_id?: string
          created_at?: string
          fee_type?: string
          frequency?: string
          id?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_terms: {
        Row: {
          academic_year_id: string
          created_at: string
          display_order: number
          due_date: string
          id: string
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          display_order?: number
          due_date: string
          id?: string
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          display_order?: number
          due_date?: string
          id?: string
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_terms_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_terms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fees: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          fee_type: string
          id: string
          paid_date: string | null
          payment_method: string | null
          receipt_number: string | null
          school_id: string
          status: string
          student_id: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          fee_type: string
          id?: string
          paid_date?: string | null
          payment_method?: string | null
          receipt_number?: string | null
          school_id: string
          status?: string
          student_id: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          fee_type?: string
          id?: string
          paid_date?: string | null
          payment_method?: string | null
          receipt_number?: string | null
          school_id?: string
          status?: string
          student_id?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fees_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          assigned_by: string | null
          attachments: string[] | null
          class_id: string
          created_at: string
          description: string | null
          due_date: string
          id: string
          school_id: string
          section_id: string | null
          subject: string
          title: string
        }
        Insert: {
          assigned_by?: string | null
          attachments?: string[] | null
          class_id: string
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          school_id: string
          section_id?: string | null
          subject: string
          title: string
        }
        Update: {
          assigned_by?: string | null
          attachments?: string[] | null
          class_id?: string
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          school_id?: string
          section_id?: string | null
          subject?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          reference_id: string | null
          school_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          reference_id?: string | null
          school_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          reference_id?: string | null
          school_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_otp: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_code: string
          used: boolean | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          otp_code: string
          used?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          used?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          class_name: string | null
          created_at: string
          email: string
          employee_id: string | null
          full_name: string
          id: string
          parent_id: string | null
          phone: string | null
          school_id: string | null
          section: string | null
          subjects: string[] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          class_name?: string | null
          created_at?: string
          email: string
          employee_id?: string | null
          full_name: string
          id: string
          parent_id?: string | null
          phone?: string | null
          school_id?: string | null
          section?: string | null
          subjects?: string[] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          class_name?: string | null
          created_at?: string
          email?: string
          employee_id?: string | null
          full_name?: string
          id?: string
          parent_id?: string | null
          phone?: string | null
          school_id?: string | null
          section?: string | null
          subjects?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          device_info: string | null
          endpoint: string
          id: string
          p256dh: string
          school_id: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          device_info?: string | null
          endpoint: string
          id?: string
          p256dh: string
          school_id?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          device_info?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          school_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          created_at: string
          exam_id: string
          grade: string | null
          id: string
          marks_obtained: number
          remarks: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          grade?: string | null
          id?: string
          marks_obtained: number
          remarks?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          grade?: string | null
          id?: string
          marks_obtained?: number
          remarks?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      school_receipt_counters: {
        Row: {
          id: string
          last_receipt_number: number
          prefix: string
          school_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          last_receipt_number?: number
          prefix?: string
          school_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          last_receipt_number?: number
          prefix?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_receipt_counters_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          accent_color: string | null
          address: string
          app_display_name: string | null
          app_short_name: string | null
          background_color: string | null
          city: string
          code: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          logo: string | null
          name: string
          phone: string | null
          primary_color: string | null
          razorpay_account_id: string | null
          secondary_color: string | null
          splash_screen_image_url: string | null
          student_limit: number | null
          subdomain: string
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          address: string
          app_display_name?: string | null
          app_short_name?: string | null
          background_color?: string | null
          city: string
          code: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo?: string | null
          name: string
          phone?: string | null
          primary_color?: string | null
          razorpay_account_id?: string | null
          secondary_color?: string | null
          splash_screen_image_url?: string | null
          student_limit?: number | null
          subdomain: string
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          address?: string
          app_display_name?: string | null
          app_short_name?: string | null
          background_color?: string | null
          city?: string
          code?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo?: string | null
          name?: string
          phone?: string | null
          primary_color?: string | null
          razorpay_account_id?: string | null
          secondary_color?: string | null
          splash_screen_image_url?: string | null
          student_limit?: number | null
          subdomain?: string
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          class_id: string
          class_teacher_id: string | null
          created_at: string
          id: string
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          class_teacher_id?: string | null
          created_at?: string
          id?: string
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          class_teacher_id?: string | null
          created_at?: string
          id?: string
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_class_teacher_id_fkey"
            columns: ["class_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      student_fee_overrides: {
        Row: {
          approved_by: string | null
          created_at: string
          fee_structure_id: string
          id: string
          notes: string | null
          override_amount: number
          reason: string
          student_id: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          fee_structure_id: string
          id?: string
          notes?: string | null
          override_amount: number
          reason: string
          student_id: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          fee_structure_id?: string
          id?: string
          notes?: string | null
          override_amount?: number
          reason?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_fee_overrides_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_overrides_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_promotions: {
        Row: {
          action: string
          created_at: string
          from_academic_year_id: string | null
          from_class_id: string | null
          from_section: string | null
          id: string
          notes: string | null
          promoted_by: string | null
          student_id: string
          to_academic_year_id: string | null
          to_class_id: string | null
          to_section: string | null
        }
        Insert: {
          action: string
          created_at?: string
          from_academic_year_id?: string | null
          from_class_id?: string | null
          from_section?: string | null
          id?: string
          notes?: string | null
          promoted_by?: string | null
          student_id: string
          to_academic_year_id?: string | null
          to_class_id?: string | null
          to_section?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          from_academic_year_id?: string | null
          from_class_id?: string | null
          from_section?: string | null
          id?: string
          notes?: string | null
          promoted_by?: string | null
          student_id?: string
          to_academic_year_id?: string | null
          to_class_id?: string | null
          to_section?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_promotions_from_academic_year_id_fkey"
            columns: ["from_academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_promotions_from_class_id_fkey"
            columns: ["from_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_promotions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_promotions_to_academic_year_id_fkey"
            columns: ["to_academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_promotions_to_class_id_fkey"
            columns: ["to_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          academic_year_id: string | null
          address: string | null
          admission_number: string
          alternate_phone: string | null
          avatar_url: string | null
          blood_group: string | null
          class_name: string
          created_at: string
          date_of_birth: string | null
          full_name: string
          gender: string | null
          id: string
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          roll_number: number | null
          school_id: string
          section: string
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          academic_year_id?: string | null
          address?: string | null
          admission_number: string
          alternate_phone?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          class_name: string
          created_at?: string
          date_of_birth?: string | null
          full_name: string
          gender?: string | null
          id?: string
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          roll_number?: number | null
          school_id: string
          section: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          academic_year_id?: string | null
          address?: string | null
          admission_number?: string
          alternate_phone?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          class_name?: string
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          roll_number?: number | null
          school_id?: string
          section?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          paid_at: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          school_id: string
          status: string
          subscription_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          paid_at?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          school_id: string
          status?: string
          subscription_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          school_id?: string
          status?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          plan_type: string
          price_per_student: number
          razorpay_account_id: string | null
          school_id: string
          start_date: string | null
          status: string
          student_count: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          plan_type?: string
          price_per_student?: number
          razorpay_account_id?: string | null
          school_id: string
          start_date?: string | null
          status?: string
          student_count?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          plan_type?: string
          price_per_student?: number
          razorpay_account_id?: string | null
          school_id?: string
          start_date?: string | null
          status?: string
          student_count?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_otp: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_code: string
          used: boolean | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          otp_code: string
          used?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          used?: boolean | null
        }
        Relationships: []
      }
      system_announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          priority: string
          target_roles: Database["public"]["Enums"]["app_role"][] | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          priority?: string
          target_roles?: Database["public"]["Enums"]["app_role"][] | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          priority?: string
          target_roles?: Database["public"]["Enums"]["app_role"][] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      teachers: {
        Row: {
          avatar_url: string | null
          classes: string[] | null
          created_at: string
          email: string | null
          employee_id: string
          full_name: string
          id: string
          joining_date: string | null
          phone: string | null
          qualification: string | null
          school_id: string
          subjects: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          classes?: string[] | null
          created_at?: string
          email?: string | null
          employee_id: string
          full_name: string
          id?: string
          joining_date?: string | null
          phone?: string | null
          qualification?: string | null
          school_id: string
          subjects?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          classes?: string[] | null
          created_at?: string
          email?: string | null
          employee_id?: string
          full_name?: string
          id?: string
          joining_date?: string | null
          phone?: string | null
          qualification?: string | null
          school_id?: string
          subjects?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_images: {
        Row: {
          class_name: string
          created_at: string
          id: string
          image_url: string
          school_id: string
          section: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          class_name: string
          created_at?: string
          id?: string
          image_url: string
          school_id: string
          section?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          class_name?: string
          created_at?: string
          id?: string
          image_url?: string
          school_id?: string
          section?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetable_images_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_receipt_number: { Args: { _school_id: string }; Returns: string }
      get_admin_attendance_by_class: {
        Args: { _date: string; _school_id: string }
        Returns: Json
      }
      get_admin_dashboard_stats: { Args: { _school_id: string }; Returns: Json }
      get_attendance_summary: {
        Args: { _date: string; _school_id: string }
        Returns: Json
      }
      get_distinct_cities: { Args: never; Returns: string[] }
      get_fee_stats: { Args: { _school_id: string }; Returns: Json }
      get_pending_fee_student_count: {
        Args: { _school_id: string }
        Returns: number
      }
      get_role_counts: { Args: never; Returns: Json }
      get_school_by_code: { Args: { _code: string }; Returns: Json }
      get_student_counts_by_class: {
        Args: { p_school_id: string }
        Returns: {
          class_name: string
          count: number
          section: string
        }[]
      }
      get_super_admin_stats: { Args: never; Returns: Json }
      get_teacher_dashboard_stats: {
        Args: { _school_id: string; _teacher_user_id: string }
        Returns: Json
      }
      get_teacher_stats: { Args: { _school_id: string }; Returns: Json }
      get_user_auth_data: { Args: { _user_id: string }; Returns: Json }
      get_user_school_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_user_by_email: { Args: { _email: string }; Returns: Json }
      record_fee_payment: {
        Args: {
          _amount: number
          _bank_name?: string
          _cheque_date?: string
          _cheque_number?: string
          _invoice_id: string
          _notes?: string
          _payment_date?: string
          _payment_method: string
          _received_by?: string
          _school_id: string
          _student_id: string
          _transaction_id?: string
        }
        Returns: Json
      }
      search_schools_public: {
        Args: { _query: string }
        Returns: {
          city: string
          code: string
          id: string
          logo: string
          name: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "school_admin"
        | "teacher"
        | "parent"
        | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "school_admin", "teacher", "parent", "student"],
    },
  },
} as const
