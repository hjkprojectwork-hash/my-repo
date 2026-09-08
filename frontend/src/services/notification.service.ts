// @ts-nocheck
import { supabase } from '@/lib/supabase';
import type { AppNotification } from '@/types';

export const getUserNotifications = async (): Promise<AppNotification[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(d => ({
    id: d.id,
    userId: d.user_id,
    reservationId: d.reservation_id,
    type: d.type,
    title: d.title,
    message: d.message,
    isRead: d.is_read,
    createdAt: d.created_at
  }));
};

export const getUnreadCount = async (): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) {
    console.error('Failed to get unread count:', error);
    return 0;
  }
  return count || 0;
};

export const markAsRead = async (notificationId: string): Promise<void> => {
  const { error } = await supabase.rpc('mark_notification_as_read', {
    p_notification_id: notificationId
  });

  if (error) throw new Error(error.message || 'Failed to mark as read');
};

export const markAllAsRead = async (): Promise<void> => {
  const { error } = await supabase.rpc('mark_all_notifications_as_read');
  
  if (error) throw new Error(error.message || 'Failed to mark all as read');
};
