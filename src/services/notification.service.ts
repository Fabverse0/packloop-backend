import { supabase } from '../config/supabase.js';

export class NotificationService {
  static async getUserNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  static async markAsRead(notificationId: string, userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async deleteNotification(notificationId: string, userId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return true;
  }

  static async clearAllNotifications(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return true;
  }
}
