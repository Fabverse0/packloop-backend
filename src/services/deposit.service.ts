import { supabase } from '../config/supabase.js';
import { WasteType } from '../types/database.types.js';

export interface CreateDepositInput {
  userId: string;
  stationId: string;
  compartmentId: string;
  wasteType: WasteType;
  weightOrCount: number;
}

export class DepositService {
  static async createDeposit(input: CreateDepositInput) {
    const { userId, stationId, compartmentId, wasteType, weightOrCount } = input;

    // 1. Ambil aturan poin & karbon dari waste_type_configs
    const { data: config, error: configError } = await supabase
      .from('waste_type_configs')
      .select('*')
      .eq('waste_type', wasteType)
      .single();

    if (configError || !config) {
      throw new Error(`Konfigurasi untuk jenis kemasan ${wasteType} tidak ditemukan`);
    }

    // 2. Hitung Poin Reward & Carbon Saved (Berdasarkan Konfigurasi Master)
    const rewardPoints = Math.round(weightOrCount * config.reward_points_per_unit);
    const carbonSaved = Number((weightOrCount * config.carbon_saved_per_unit_kg).toFixed(2));

    // 3. Generate Kode Order Unik (misal: PL-20260721-893)
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(100 + Math.random() * 900);
    const orderCode = `PL-${dateStr}-${randomNum}`;

    // 4. Simpan Transaksi Setoran
    const { data: deposit, error: depositError } = await supabase
      .from('deposits')
      .insert([
        {
          order_code: orderCode,
          user_id: userId,
          station_id: stationId,
          compartment_id: compartmentId,
          waste_type: wasteType,
          weight_or_count: weightOrCount,
          reward_points_earned: rewardPoints,
          carbon_saved_kg: carbonSaved,
          status: 'DEPOSITED',
          recycled_percentage: 85.0,
          recycle_partner: 'Rekosistem / Paxel',
          recycle_notes: `Setoran ${weightOrCount} ${wasteType.toLowerCase()} diterima & terverifikasi.`,
        },
      ])
      .select(`
        *,
        stations (name, address)
      `)
      .single();

    if (depositError) throw new Error(depositError.message);

    // 5. Update Kapasitas Terisi di Kompartemen
    const { data: comp } = await supabase
      .from('compartments')
      .select('current_weight_kg, max_capacity_kg')
      .eq('id', compartmentId)
      .single();

    if (comp) {
      const added = wasteType === 'TOTE_BAG' ? weightOrCount * 0.2 : weightOrCount;
      const newWeight = Number((comp.current_weight_kg + added).toFixed(2));
      const maxCap = comp.max_capacity_kg || 150.00;
      const status = newWeight >= maxCap ? 'FULL' : newWeight >= (maxCap * 0.8) ? 'ALMOST_FULL' : 'AVAILABLE';

      await supabase
        .from('compartments')
        .update({ current_weight_kg: newWeight, status, updated_at: new Date().toISOString() })
        .eq('id', compartmentId);
    }

    // 6. Update Stats pada Profil User (Poin + Berat + Karbon)
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_points, total_weight_kg, total_carbon_saved_kg')
      .eq('id', userId)
      .single();

    if (profile) {
      const weightAdded = wasteType === 'TOTE_BAG' ? weightOrCount * 0.2 : weightOrCount;
      await supabase
        .from('profiles')
        .update({
          total_points: profile.total_points + rewardPoints,
          total_weight_kg: Number((profile.total_weight_kg + weightAdded).toFixed(2)),
          total_carbon_saved_kg: Number((profile.total_carbon_saved_kg + carbonSaved).toFixed(2)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }

    return deposit;
  }

  static async getUserDeposits(userId: string) {
    const { data, error } = await supabase
      .from('deposits')
      .select(`
        *,
        stations (name, address)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  static async getDepositById(depositId: string, userId: string) {
    const { data, error } = await supabase
      .from('deposits')
      .select(`
        *,
        stations (name, address),
        order_tracking_logs (*)
      `)
      .eq('id', depositId)
      .eq('user_id', userId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async deleteDeposit(depositId: string, userId: string) {
    // 1. Cek apakah deposit ada & milik user
    const { data: deposit, error: fetchError } = await supabase
      .from('deposits')
      .select('*')
      .eq('id', depositId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !deposit) {
      throw new Error('Transaksi setoran tidak ditemukan atau tidak memiliki akses');
    }

    if (deposit.status !== 'DEPOSITED') {
      throw new Error(`Setoran tidak dapat dibatalkan karena sudah dalam status ${deposit.status}`);
    }

    // 2. Hapus deposit
    const { error: deleteError } = await supabase
      .from('deposits')
      .delete()
      .eq('id', depositId);

    if (deleteError) throw new Error(deleteError.message);

    // 3. Penyesuaian poin pada profil user
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_points, total_weight_kg, total_carbon_saved_kg')
      .eq('id', userId)
      .single();

    if (profile) {
      const wt = deposit.waste_type === 'TOTE_BAG' ? deposit.weight_or_count * 0.2 : deposit.weight_or_count;
      await supabase
        .from('profiles')
        .update({
          total_points: Math.max(0, profile.total_points - deposit.reward_points_earned),
          total_weight_kg: Math.max(0, Number((profile.total_weight_kg - wt).toFixed(2))),
          total_carbon_saved_kg: Math.max(0, Number((profile.total_carbon_saved_kg - deposit.carbon_saved_kg).toFixed(2))),
        })
        .eq('id', userId);
    }

    return true;
  }
}
