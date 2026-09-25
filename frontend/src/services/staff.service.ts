// @ts-nocheck
import { supabase } from '@/lib/supabase';
import type { Reservation, StaffProfile, Item, QRReservationResult } from '@/types';

/**
 * Staff service — all data access is based on auth.uid() authorization.
 * No shopId is passed from the frontend; the backend/RLS enforces it.
 */

export const getCurrentStaffProfile = async (): Promise<StaffProfile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('staff_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw error;
  }
  
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    mobileNumber: data.mobile,
    staffType: data.staff_type,
    shopId: data.shop_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

/**
 * Gets all reservations for the currently authenticated staff member's shop.
 * RLS handles shop filtering automatically based on auth.uid().
 */
export const getShopReservations = async (): Promise<Reservation[]> => {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      student:profiles(*),
      items:reservation_items(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Reservation[];
};

export const getPendingReservationCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) throw error;
  return count || 0;
};

export const updateReservationStatus = async (reservationId: string, newStatus: string): Promise<void> => {
  const { error } = await supabase.rpc('update_reservation_status', {
    p_reservation_id: reservationId,
    p_new_status: newStatus
  });

  if (error) {
    throw new Error(error.message || 'Failed to update status');
  }
};

/**
 * Gets ALL items for the staff's assigned shop (including unavailable).
 * Uses the get_shop_items RPC which enforces staff authentication.
 */
export const getShopItems = async (): Promise<Item[]> => {
  const { data, error } = await (supabase as any).rpc('get_shop_items');

  if (error) {
    throw new Error(error.message || 'Failed to load shop items');
  }

  return (data as Item[]) || [];
};

/**
 * Toggles item availability for a shop item.
 * Uses the toggle_item_availability RPC which enforces staff authentication + shop ownership.
 */
export const toggleItemAvailability = async (itemId: string, isAvailable: boolean): Promise<void> => {
  const { error } = await (supabase as any).rpc('toggle_item_availability', {
    p_item_id: itemId,
    p_is_available: isAvailable
  });

  if (error) {
    throw new Error(error.message || 'Failed to update item availability');
  }
};

/**
 * Looks up a reservation by human-readable Order ID (CAMP-2026-XXXXXX).
 * Used as a fallback when camera QR scanning is unavailable.
 * The RPC enforces: authenticated canteen_staff + shop ownership + order_type=canteen.
 */
export const getReservationByCode = async (code: string): Promise<QRReservationResult> => {
  const { data, error } = await (supabase as any).rpc('get_reservation_by_code', {
    p_reservation_code: code
  });

  if (error) {
    throw new Error(error.message || 'Order not found.');
  }

  return data as QRReservationResult;
};
