/**
 * Minimal Supabase database type stub for Phase 1.
 * This will be expanded in later phases as tables are created.
 *
 * Generated types should ultimately come from:
 *   npx supabase gen types typescript --project-id <your-project-id>
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          roll_number: string;
          mobile: string;
          class_section: string;
          year: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          roll_number: string;
          mobile: string;
          class_section: string;
          year: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      staff_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          mobile_number: string;
          staff_type: 'canteen' | 'bookstore';
          shop_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['staff_profiles']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['staff_profiles']['Insert']>;
      };
      products: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          stock_quantity: number;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      reservations: {
        Row: {
          id: string;
          reservation_code: string;
          student_id: string;
          shop_id: string;
          status: 'PENDING' | 'READY' | 'COLLECTED' | 'CANCELLED';
          total_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reservations']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reservations']['Insert']>;
      };
      reservation_items: {
        Row: {
          id: string;
          reservation_id: string;
          product_id: string;
          quantity: number;
          price_at_reservation: number;
        };
        Insert: Omit<Database['public']['Tables']['reservation_items']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['reservation_items']['Insert']>;
      };
      staff_shops: {
        Row: {
          id: string;
          name: string;
          type: 'canteen' | 'bookstore';
          whatsapp_number: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['staff_shops']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['staff_shops']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      reservation_status: 'PENDING' | 'READY' | 'COLLECTED' | 'CANCELLED';
      staff_type: 'canteen' | 'bookstore';
    };
  };
}
