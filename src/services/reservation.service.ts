import { supabase } from '@/lib/supabase';
import type { Reservation, CartItem } from '@/types';

export const createReservation = async (canteenId: string, items: CartItem[]): Promise<string> => {
  const p_items = items.map(ci => ({
    item_id: ci.item.id,
    quantity: ci.quantity
  }));

  const { data, error } = await (supabase as any).rpc('create_reservation', {
    p_canteen_id: canteenId,
    p_items: p_items
  });

  if (error) {
    throw new Error(error.message || 'Failed to create reservation');
  }

  return data as string; // returns reservation_id
};

export const getMyReservations = async (): Promise<Reservation[]> => {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      canteen:canteens(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Reservation[];
};

export const getReservationById = async (id: string): Promise<Reservation | null> => {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      canteen:canteens(*),
      items:reservation_items(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Reservation;
};

export const cancelReservation = async (id: string): Promise<void> => {
  const { error } = await (supabase as any)
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('status', 'pending'); // only pending reservations can be cancelled by student

  if (error) throw error;
};
