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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agenda_items: {
        Row: {
          categoria: string
          created_at: string
          datos: Json
          descripcion: string | null
          estado: string
          fecha: string
          grupo: string | null
          hora: string | null
          id: string
          prioridad: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria?: string
          created_at?: string
          datos?: Json
          descripcion?: string | null
          estado?: string
          fecha?: string
          grupo?: string | null
          hora?: string | null
          id?: string
          prioridad?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string
          created_at?: string
          datos?: Json
          descripcion?: string | null
          estado?: string
          fecha?: string
          grupo?: string | null
          hora?: string | null
          id?: string
          prioridad?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      base_conocimiento: {
        Row: {
          campo_formativo: string | null
          created_at: string
          disciplina: string | null
          etapas: Json
          evaluaciones: Json
          fuente: string | null
          grado: number | null
          id: string
          instrumentos: Json
          pda: string[]
          ppa: string | null
          productos: string[]
          proyecto_academico: string | null
          recursos: Json
          saberes: string[]
          tomo: number | null
          trimestre: number | null
          updated_at: string
        }
        Insert: {
          campo_formativo?: string | null
          created_at?: string
          disciplina?: string | null
          etapas?: Json
          evaluaciones?: Json
          fuente?: string | null
          grado?: number | null
          id?: string
          instrumentos?: Json
          pda?: string[]
          ppa?: string | null
          productos?: string[]
          proyecto_academico?: string | null
          recursos?: Json
          saberes?: string[]
          tomo?: number | null
          trimestre?: number | null
          updated_at?: string
        }
        Update: {
          campo_formativo?: string | null
          created_at?: string
          disciplina?: string | null
          etapas?: Json
          evaluaciones?: Json
          fuente?: string | null
          grado?: number | null
          id?: string
          instrumentos?: Json
          pda?: string[]
          ppa?: string | null
          productos?: string[]
          proyecto_academico?: string | null
          recursos?: Json
          saberes?: string[]
          tomo?: number | null
          trimestre?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      biblioteca_recursos: {
        Row: {
          campo_formativo: string | null
          categoria: string | null
          created_at: string
          descripcion: string | null
          disciplina: string | null
          grado: number | null
          id: string
          publico: boolean
          storage_path: string | null
          tipo: string
          titulo: string
          updated_at: string
          url: string | null
          user_id: string | null
        }
        Insert: {
          campo_formativo?: string | null
          categoria?: string | null
          created_at?: string
          descripcion?: string | null
          disciplina?: string | null
          grado?: number | null
          id?: string
          publico?: boolean
          storage_path?: string | null
          tipo?: string
          titulo: string
          updated_at?: string
          url?: string | null
          user_id?: string | null
        }
        Update: {
          campo_formativo?: string | null
          categoria?: string | null
          created_at?: string
          descripcion?: string | null
          disciplina?: string | null
          grado?: number | null
          id?: string
          publico?: boolean
          storage_path?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      calendario_escolar: {
        Row: {
          ciclo: string
          created_at: string
          descripcion: string | null
          fecha: string
          fecha_fin: string | null
          id: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          ciclo?: string
          created_at?: string
          descripcion?: string | null
          fecha: string
          fecha_fin?: string | null
          id?: string
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          ciclo?: string
          created_at?: string
          descripcion?: string | null
          fecha?: string
          fecha_fin?: string | null
          id?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      campos_formativos: {
        Row: {
          color: string | null
          created_at: string
          id: string
          nombre: string
          orden: number
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          nombre: string
          orden?: number
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          nombre?: string
          orden?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      disciplinas: {
        Row: {
          campo_formativo_id: string
          created_at: string
          id: string
          nombre: string
          orden: number
          updated_at: string
        }
        Insert: {
          campo_formativo_id: string
          created_at?: string
          id?: string
          nombre: string
          orden?: number
          updated_at?: string
        }
        Update: {
          campo_formativo_id?: string
          created_at?: string
          id?: string
          nombre?: string
          orden?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplinas_campo_formativo_id_fkey"
            columns: ["campo_formativo_id"]
            isOneToOne: false
            referencedRelation: "campos_formativos"
            referencedColumns: ["id"]
          },
        ]
      }
      examenes: {
        Row: {
          campo_formativo: string | null
          clave_respuestas: Json
          created_at: string
          dificultad: string
          disciplina: string | null
          generado_por_ia: boolean
          grado: number | null
          id: string
          instrucciones: string | null
          num_reactivos: number
          pda: string | null
          reactivos: Json
          titulo: string
          trimestre: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campo_formativo?: string | null
          clave_respuestas?: Json
          created_at?: string
          dificultad?: string
          disciplina?: string | null
          generado_por_ia?: boolean
          grado?: number | null
          id?: string
          instrucciones?: string | null
          num_reactivos?: number
          pda?: string | null
          reactivos?: Json
          titulo: string
          trimestre?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campo_formativo?: string | null
          clave_respuestas?: Json
          created_at?: string
          dificultad?: string
          disciplina?: string | null
          generado_por_ia?: boolean
          grado?: number | null
          id?: string
          instrucciones?: string | null
          num_reactivos?: number
          pda?: string | null
          reactivos?: Json
          titulo?: string
          trimestre?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      landing_config: {
        Row: {
          activo: boolean
          contenido: Json
          created_at: string
          id: string
          orden: number
          seccion: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          contenido?: Json
          created_at?: string
          id?: string
          orden?: number
          seccion: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          contenido?: Json
          created_at?: string
          id?: string
          orden?: number
          seccion?: string
          updated_at?: string
        }
        Relationships: []
      }
      planeaciones: {
        Row: {
          adecuaciones: string | null
          campo_formativo: string | null
          cierre: string | null
          created_at: string
          desarrollo: string | null
          disciplina: string | null
          etapas: Json
          evaluacion: Json
          generada_por_ia: boolean
          grado: number | null
          id: string
          inclusion: string | null
          inicio: string | null
          listas_cotejo: Json
          materiales: string[]
          metodologia: string | null
          productos: string[]
          proposito: string | null
          proyecto_id: string | null
          rubricas: Json
          titulo: string
          tomo: number | null
          transversalidad: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          adecuaciones?: string | null
          campo_formativo?: string | null
          cierre?: string | null
          created_at?: string
          desarrollo?: string | null
          disciplina?: string | null
          etapas?: Json
          evaluacion?: Json
          generada_por_ia?: boolean
          grado?: number | null
          id?: string
          inclusion?: string | null
          inicio?: string | null
          listas_cotejo?: Json
          materiales?: string[]
          metodologia?: string | null
          productos?: string[]
          proposito?: string | null
          proyecto_id?: string | null
          rubricas?: Json
          titulo: string
          tomo?: number | null
          transversalidad?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          adecuaciones?: string | null
          campo_formativo?: string | null
          cierre?: string | null
          created_at?: string
          desarrollo?: string | null
          disciplina?: string | null
          etapas?: Json
          evaluacion?: Json
          generada_por_ia?: boolean
          grado?: number | null
          id?: string
          inclusion?: string | null
          inicio?: string | null
          listas_cotejo?: Json
          materiales?: string[]
          metodologia?: string | null
          productos?: string[]
          proposito?: string | null
          proyecto_id?: string | null
          rubricas?: Json
          titulo?: string
          tomo?: number | null
          transversalidad?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planeaciones_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos_aula"
            referencedColumns: ["id"]
          },
        ]
      }
      planes: {
        Row: {
          activo: boolean
          beneficios: string[]
          created_at: string
          id: string
          nombre: string
          orden: number
          periodo: string
          precio: number
          precio_promocion: number | null
          promocion_activa: boolean
          updated_at: string
        }
        Insert: {
          activo?: boolean
          beneficios?: string[]
          created_at?: string
          id?: string
          nombre: string
          orden?: number
          periodo: string
          precio?: number
          precio_promocion?: number | null
          promocion_activa?: boolean
          updated_at?: string
        }
        Update: {
          activo?: boolean
          beneficios?: string[]
          created_at?: string
          id?: string
          nombre?: string
          orden?: number
          periodo?: string
          precio?: number
          precio_promocion?: number | null
          promocion_activa?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cct: string | null
          created_at: string
          email: string | null
          escuela: string | null
          estado: Database["public"]["Enums"]["account_status"]
          grado: string | null
          id: string
          nombre_completo: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cct?: string | null
          created_at?: string
          email?: string | null
          escuela?: string | null
          estado?: Database["public"]["Enums"]["account_status"]
          grado?: string | null
          id: string
          nombre_completo?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cct?: string | null
          created_at?: string
          email?: string | null
          escuela?: string | null
          estado?: Database["public"]["Enums"]["account_status"]
          grado?: string | null
          id?: string
          nombre_completo?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      proyectos_aula: {
        Row: {
          campo_formativo: string
          created_at: string
          disciplina: string | null
          estado: string
          grado: number
          id: string
          notas: string | null
          pda: string[]
          ppa: string
          producto_integrador: string | null
          proyecto_academico: string | null
          saberes: string[]
          tomo: number
          trimestre: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campo_formativo: string
          created_at?: string
          disciplina?: string | null
          estado?: string
          grado: number
          id?: string
          notas?: string | null
          pda?: string[]
          ppa: string
          producto_integrador?: string | null
          proyecto_academico?: string | null
          saberes?: string[]
          tomo: number
          trimestre?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campo_formativo?: string
          created_at?: string
          disciplina?: string | null
          estado?: string
          grado?: number
          id?: string
          notas?: string | null
          pda?: string[]
          ppa?: string
          producto_integrador?: string | null
          proyecto_academico?: string | null
          saberes?: string[]
          tomo?: number
          trimestre?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sesiones: {
        Row: {
          cierre: string | null
          created_at: string
          desarrollo: string | null
          evaluacion: string | null
          id: string
          inicio: string | null
          instrumentos: string[]
          materiales: string[]
          numero: number
          planeacion_id: string | null
          tiempo: string | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cierre?: string | null
          created_at?: string
          desarrollo?: string | null
          evaluacion?: string | null
          id?: string
          inicio?: string | null
          instrumentos?: string[]
          materiales?: string[]
          numero: number
          planeacion_id?: string | null
          tiempo?: string | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cierre?: string | null
          created_at?: string
          desarrollo?: string | null
          evaluacion?: string | null
          id?: string
          inicio?: string | null
          instrumentos?: string[]
          materiales?: string[]
          numero?: number
          planeacion_id?: string | null
          tiempo?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sesiones_planeacion_id_fkey"
            columns: ["planeacion_id"]
            isOneToOne: false
            referencedRelation: "planeaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      suscripciones: {
        Row: {
          created_at: string
          estado: string
          id: string
          inicia_en: string
          metodo_pago: string | null
          monto: number | null
          plan_id: string | null
          termina_en: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          inicia_en?: string
          metodo_pago?: string | null
          monto?: number | null
          plan_id?: string | null
          termina_en?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          inicia_en?: string
          metodo_pago?: string | null
          monto?: number | null
          plan_id?: string | null
          termina_en?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suscripciones_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_status: "activo" | "inactivo" | "suspendido"
      app_role: "administrador" | "docente" | "suscriptor"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      account_status: ["activo", "inactivo", "suspendido"],
      app_role: ["administrador", "docente", "suscriptor"],
    },
  },
} as const
