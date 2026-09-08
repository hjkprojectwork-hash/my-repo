import { supabase } from '@/lib/supabase';
import type { Item, Canteen } from '@/types';

export const getActiveCanteens = async (): Promise<Canteen[]> => {
  const { data, error } = await (supabase as any)
    .from('canteens')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data as Canteen[];
};

export const getAvailableItems = async (): Promise<Item[]> => {
  const { data, error } = await (supabase as any)
    .from('items')
    .select('*, canteen:canteens(*)')
    .eq('is_available', true)
    .gt('available_quantity', 0)
    .order('category')
    .order('name');
  if (error) throw error;
  return data as Item[];
};

export const getItemsByCanteen = async (canteenId: string): Promise<Item[]> => {
  const { data, error } = await (supabase as any)
    .from('items')
    .select('*, canteen:canteens(*)')
    .eq('is_available', true)
    .gt('available_quantity', 0)
    .eq('canteen_id', canteenId)
    .order('category')
    .order('name');
  if (error) throw error;
  return data as Item[];
};

export const getItemsByCategory = async (category: string): Promise<Item[]> => {
  const { data, error } = await (supabase as any)
    .from('items')
    .select('*, canteen:canteens(*)')
    .eq('is_available', true)
    .gt('available_quantity', 0)
    .eq('category', category)
    .order('name');
  if (error) throw error;
  return data as Item[];
};

export const searchItems = async (searchTerm: string): Promise<Item[]> => {
  const { data, error } = await supabase
    .from('items')
    .select('*, canteen:canteens(*)')
    .eq('is_available', true)
    .gt('available_quantity', 0)
    .ilike('name', `%${searchTerm}%`)
    .order('name');
  if (error) throw error;
  return data as Item[];
};

export const getItemById = async (itemId: string): Promise<Item | null> => {
  const { data, error } = await supabase
    .from('items')
    .select('*, canteen:canteens(*)')
    .eq('id', itemId)
    .single();
  if (error) throw error;
  return data as Item;
};
