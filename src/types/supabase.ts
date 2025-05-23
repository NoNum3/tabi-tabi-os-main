export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bookmark_folders: {
        Row: {
          color: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_pinned: boolean | null
          name: string
          parent_id: string | null
          sort_order: number | null
          symbol: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_pinned?: boolean | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
          symbol?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_pinned?: boolean | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          symbol?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmark_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "bookmark_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          color: string | null
          created_at: string | null
          custom_metadata: Json | null
          deleted_at: string | null
          description: string | null
          favicon_url: string | null
          folder_id: string | null
          id: string
          is_favorite: boolean | null
          is_pinned: boolean | null
          last_visited_at: string | null
          sort_order: number | null
          symbol: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          url: string
          user_id: string
          visit_count: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          custom_metadata?: Json | null
          deleted_at?: string | null
          description?: string | null
          favicon_url?: string | null
          folder_id?: string | null
          id?: string
          is_favorite?: boolean | null
          is_pinned?: boolean | null
          last_visited_at?: string | null
          sort_order?: number | null
          symbol?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          url: string
          user_id: string
          visit_count?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          custom_metadata?: Json | null
          deleted_at?: string | null
          description?: string | null
          favicon_url?: string | null
          folder_id?: string | null
          id?: string
          is_favorite?: boolean | null
          is_pinned?: boolean | null
          last_visited_at?: string | null
          sort_order?: number | null
          symbol?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          url?: string
          user_id?: string
          visit_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "bookmark_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      calculator_history: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          device_id: string | null
          expression: string
          id: number
          memory_value: number | null
          notes: string | null
          result: string
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          device_id?: string | null
          expression: string
          id?: number
          memory_value?: number | null
          notes?: string | null
          result: string
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          device_id?: string | null
          expression?: string
          id?: number
          memory_value?: number | null
          notes?: string | null
          result?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          color: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          end_time: string
          id: string
          location: string | null
          recurrence: string | null
          recurrence_rule: Json | null
          start_time: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          recurrence?: string | null
          recurrence_rule?: Json | null
          start_time: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          recurrence?: string | null
          recurrence_rule?: Json | null
          start_time?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      music_songs: {
        Row: {
          created_at: string
          id: string
          seq_id: number
          title: string
          url: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          seq_id: number
          title: string
          url: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          seq_id?: number
          title?: string
          url?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      playlist_songs: {
        Row: {
          created_at: string
          id: string
          playlist_id: string
          seq_id: number
          song_id: string
          title: string | null
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          playlist_id: string
          seq_id: number
          song_id: string
          title?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          playlist_id?: string
          seq_id?: number
          song_id?: string
          title?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playlist_songs_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          last_password_change: string | null
          last_profile_update: string | null
          profile_picture: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          last_password_change?: string | null
          last_profile_update?: string | null
          profile_picture?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          last_password_change?: string | null
          last_profile_update?: string | null
          profile_picture?: string | null
          username?: string | null
        }
        Relationships: []
      }
      app_reports: {
        Row: {
          id: string;
          app_id: string;
          app_version: string;
          type: 'bug' | 'feedback';
          description: string;
          email: string | null;
          screenshot: string | null;
          created_at: string;
          user_id: string | null;
          status: 'new' | 'reviewed' | 'closed';
          ip_address: string | null;
          user_agent: string | null;
          website: string | null;
        };
        Insert: {
          id?: string;
          app_id: string;
          app_version: string;
          type: 'bug' | 'feedback';
          description: string;
          email?: string | null;
          screenshot?: string | null;
          created_at?: string;
          user_id?: string | null;
          status?: 'new' | 'reviewed' | 'closed';
          ip_address?: string | null;
          user_agent?: string | null;
          website?: string | null;
        };
        Update: {
          id?: string;
          app_id?: string;
          app_version?: string;
          type?: 'bug' | 'feedback';
          description?: string;
          email?: string | null;
          screenshot?: string | null;
          created_at?: string;
          user_id?: string | null;
          status?: 'new' | 'reviewed' | 'closed';
          ip_address?: string | null;
          user_agent?: string | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "app_reports_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
