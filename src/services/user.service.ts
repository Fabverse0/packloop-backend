import { supabase, supabaseAdmin } from '../config/supabase.js';
import { Profile } from '../types/database.types.js';

export class UserService {
  static async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // Jika profil belum ada (umpamanya terlewat trigger), buatkan profil dasar
      if (error.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{ id: userId, full_name: 'User PackLoop' }])
          .select()
          .single();

        if (createError) throw new Error(createError.message);
        return newProfile as Profile;
      }
      throw new Error(error.message);
    }

    return data as Profile;
  }

  static async updateProfile(
    userId: string,
    updates: Partial<Pick<Profile, 'full_name' | 'phone_number' | 'avatar_url'>>
  ): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Profile;
  }

  static async deleteAccount(userId: string): Promise<boolean> {
    // 1. Hapus dari Supabase Auth (Admin)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    // 2. Hapus data profil (Cascade akan otomatis menghapus semua data setoran, notifikasi, & redeem)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (authError && profileError) {
      throw new Error(authError.message || profileError.message);
    }

    return true;
  }
}
