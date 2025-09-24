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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      career_profiles: {
        Row: {
          achievements: Json | null
          bsc_customers: Json | null
          bsc_financial: Json | null
          bsc_learning: Json | null
          bsc_processes: Json | null
          career_analysis: Json | null
          career_goals: Json | null
          career_paths: Json | null
          certifications: Json | null
          created_at: string
          current_company: string | null
          current_position: string | null
          current_salary: number | null
          education_level: string | null
          full_name: string | null
          hard_skills: Json | null
          id: string
          industry: string | null
          languages: Json | null
          learning_goals: Json | null
          location: string | null
          salary_goals: Json | null
          soft_skills: Json | null
          updated_at: string
          user_id: string
          work_history: Json | null
          years_experience: number | null
        }
        Insert: {
          achievements?: Json | null
          bsc_customers?: Json | null
          bsc_financial?: Json | null
          bsc_learning?: Json | null
          bsc_processes?: Json | null
          career_analysis?: Json | null
          career_goals?: Json | null
          career_paths?: Json | null
          certifications?: Json | null
          created_at?: string
          current_company?: string | null
          current_position?: string | null
          current_salary?: number | null
          education_level?: string | null
          full_name?: string | null
          hard_skills?: Json | null
          id?: string
          industry?: string | null
          languages?: Json | null
          learning_goals?: Json | null
          location?: string | null
          salary_goals?: Json | null
          soft_skills?: Json | null
          updated_at?: string
          user_id: string
          work_history?: Json | null
          years_experience?: number | null
        }
        Update: {
          achievements?: Json | null
          bsc_customers?: Json | null
          bsc_financial?: Json | null
          bsc_learning?: Json | null
          bsc_processes?: Json | null
          career_analysis?: Json | null
          career_goals?: Json | null
          career_paths?: Json | null
          certifications?: Json | null
          created_at?: string
          current_company?: string | null
          current_position?: string | null
          current_salary?: number | null
          education_level?: string | null
          full_name?: string | null
          hard_skills?: Json | null
          id?: string
          industry?: string | null
          languages?: Json | null
          learning_goals?: Json | null
          location?: string | null
          salary_goals?: Json | null
          soft_skills?: Json | null
          updated_at?: string
          user_id?: string
          work_history?: Json | null
          years_experience?: number | null
        }
        Relationships: []
      }
      communication_analysis: {
        Row: {
          ai_analysis: Json
          analysis_type: string
          created_at: string
          id: string
          input_text: string
          user_id: string
        }
        Insert: {
          ai_analysis: Json
          analysis_type: string
          created_at?: string
          id?: string
          input_text: string
          user_id: string
        }
        Update: {
          ai_analysis?: Json
          analysis_type?: string
          created_at?: string
          id?: string
          input_text?: string
          user_id?: string
        }
        Relationships: []
      }
      erp_progress: {
        Row: {
          completed: boolean | null
          created_at: string
          id: string
          score: number | null
          stage: string
          stage_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          id?: string
          score?: number | null
          stage: string
          stage_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          id?: string
          score?: number | null
          stage?: string
          stage_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_resumes: {
        Row: {
          created_at: string
          generated_resume: string
          id: string
          improvements_notes: Json | null
          job_description: string
          original_resume: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_resume: string
          id?: string
          improvements_notes?: Json | null
          job_description: string
          original_resume?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          generated_resume?: string
          id?: string
          improvements_notes?: Json | null
          job_description?: string
          original_resume?: string | null
          user_id?: string
        }
        Relationships: []
      }
      module_configurations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          module_name: string
          settings: Json | null
          system_prompt: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          module_name: string
          settings?: Json | null
          system_prompt: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          module_name?: string
          settings?: Json | null
          system_prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cpf_cnpj: string | null
          created_at: string
          free_sessions_limit: number | null
          free_sessions_used: number | null
          full_name: string
          hotmart_transaction_id: string | null
          hotmart_webhook_data: Json | null
          id: string
          is_admin: boolean | null
          last_hotmart_update: string | null
          subscription_end_date: string | null
          subscription_plan: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cpf_cnpj?: string | null
          created_at?: string
          free_sessions_limit?: number | null
          free_sessions_used?: number | null
          full_name: string
          hotmart_transaction_id?: string | null
          hotmart_webhook_data?: Json | null
          id?: string
          is_admin?: boolean | null
          last_hotmart_update?: string | null
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cpf_cnpj?: string | null
          created_at?: string
          free_sessions_limit?: number | null
          free_sessions_used?: number | null
          full_name?: string
          hotmart_transaction_id?: string | null
          hotmart_webhook_data?: Json | null
          id?: string
          is_admin?: boolean | null
          last_hotmart_update?: string | null
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      simulation_sessions: {
        Row: {
          ai_response: Json | null
          completed: boolean | null
          created_at: string
          duration_seconds: number | null
          feedback: string | null
          id: string
          input_data: Json | null
          module_id: string
          score: number | null
          session_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_response?: Json | null
          completed?: boolean | null
          created_at?: string
          duration_seconds?: number | null
          feedback?: string | null
          id?: string
          input_data?: Json | null
          module_id: string
          score?: number | null
          session_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_response?: Json | null
          completed?: boolean | null
          created_at?: string
          duration_seconds?: number | null
          feedback?: string | null
          id?: string
          input_data?: Json | null
          module_id?: string
          score?: number | null
          session_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_sessions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      training_modules: {
        Row: {
          created_at: string
          description: string
          difficulty_level: number | null
          estimated_time_minutes: number | null
          icon: string
          id: string
          is_active: boolean | null
          name: string
          order_index: number
          points_reward: number | null
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          difficulty_level?: number | null
          estimated_time_minutes?: number | null
          icon: string
          id?: string
          is_active?: boolean | null
          name: string
          order_index: number
          points_reward?: number | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          difficulty_level?: number | null
          estimated_time_minutes?: number | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number
          points_reward?: number | null
          title?: string
        }
        Relationships: []
      }
      user_api_usage: {
        Row: {
          cost_estimate: number | null
          created_at: string
          function_name: string
          id: string
          input_tokens: number | null
          ip_address: unknown | null
          module_name: string
          output_tokens: number | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          cost_estimate?: number | null
          created_at?: string
          function_name: string
          id?: string
          input_tokens?: number | null
          ip_address?: unknown | null
          module_name: string
          output_tokens?: number | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          cost_estimate?: number | null
          created_at?: string
          function_name?: string
          id?: string
          input_tokens?: number | null
          ip_address?: unknown | null
          module_name?: string
          output_tokens?: number | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_module_completions: {
        Row: {
          completed_at: string
          completion_data: Json | null
          created_at: string
          id: string
          module_id: string
          points_earned: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          completion_data?: Json | null
          created_at?: string
          id?: string
          module_id: string
          points_earned?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string
          completion_data?: Json | null
          created_at?: string
          id?: string
          module_id?: string
          points_earned?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_completions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          created_at: string
          id: string
          last_activity_at: string | null
          modules_completed: number | null
          proficiency_level: number | null
          simulations_completed: number | null
          total_points: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_activity_at?: string | null
          modules_completed?: number | null
          proficiency_level?: number | null
          simulations_completed?: number | null
          total_points?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_activity_at?: string | null
          modules_completed?: number | null
          proficiency_level?: number | null
          simulations_completed?: number | null
          total_points?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_backoff_delay: {
        Args: { attempt_number: number }
        Returns: unknown
      }
      check_rate_limit: {
        Args: {
          p_limit_per_hour?: number
          p_module_name: string
          p_user_id: string
        }
        Returns: boolean
      }
      check_trial_status: {
        Args: { user_id_param: string }
        Returns: string
      }
      check_trial_status_secure: {
        Args: { user_id_param: string }
        Returns: string
      }
      increment_free_session: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      log_api_usage: {
        Args: {
          p_cost_estimate?: number
          p_function_name: string
          p_input_tokens?: number
          p_module_name: string
          p_output_tokens?: number
          p_user_id: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          event_data_param?: Json
          event_type_param: string
          user_id_param?: string
        }
        Returns: undefined
      }
      start_user_trial: {
        Args: { user_id_param: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
