// @ts-nocheck
import { supabase } from '@/lib/supabase';
import type { Reservation, StaffProfile } from '@/types';

/**
 * Staff service fetching data purely based on auth.uid() authorization.
 * No shopId is passed from frontend components to backend for authorization.
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
 * Gets reservations for the currently authenticated staff member's assigned shop.
 * RLS handles the filtering automatically based on auth.uid().
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
