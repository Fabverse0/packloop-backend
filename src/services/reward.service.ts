import { supabase } from '../config/supabase.js';
import { EWalletProvider } from '../types/database.types.js';
import { MidtransService } from './midtrans.service.js';

export interface RedeemInput {
  userId: string;
  eWalletProvider: EWalletProvider;
  accountNumber: string;
  pointsRedeemed: number;
}

export class RewardService {
  static async getRewardRules() {
    const { data, error } = await supabase
      .from('waste_type_configs')
      .select('*');

    if (error) throw new Error(error.message);
    return data;
  }

  static async redeemPoints(input: RedeemInput) {
    const { userId, eWalletProvider, accountNumber, pointsRedeemed } = input;

    // 1. Validasi nomor akun E-Wallet
    if (!accountNumber || !accountNumber.trim()) {
      throw new Error('Nomor akun E-Wallet wajib diisi.');
    }

    // 2. Syarat minimal 10 poin
    if (pointsRedeemed < 10) {
      throw new Error('Penukaran poin minimal 10 poin (= Rp1)');
    }

    // 2. Cek saldo poin pengguna saat ini
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('total_points, full_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('Profil pengguna tidak ditemukan');
    }

    if (profile.total_points < pointsRedeemed) {
      throw new Error(`Saldo poin Anda tidak cukup (${profile.total_points} poin) untuk menukar ${pointsRedeemed} poin`);
    }

    // 3. Konversi Poin ke IDR: 100 poin = Rp10 -> 1 poin = Rp 0.10
    const amountIdr = Number((pointsRedeemed * 0.10).toFixed(2));

    // 4. Generate Order ID unik untuk Midtrans
    const midtransOrderId = `PKL-REDEEM-${userId.substring(0, 8)}-${Date.now()}`;

    // 5. Catat Penukaran ke Supabase DB
    const { data: redemption, error: redeemError } = await supabase
      .from('reward_redemptions')
      .insert([
        {
          user_id: userId,
          e_wallet_provider: eWalletProvider,
          account_number: accountNumber,
          points_redeemed: pointsRedeemed,
          amount_idr: amountIdr,
          status: 'PENDING',
          midtrans_order_id: midtransOrderId,
        },
      ])
      .select()
      .single();

    if (redeemError) throw new Error(redeemError.message);

    // 6. Proses Pencairan Saldo via Midtrans Iris Payout API
    //    Saldo Rupiah dikirim langsung ke nomor E-Wallet pengguna secara otomatis.
    let payoutResult: { order_id: string; status: string; message: string } = {
      order_id: midtransOrderId,
      status: 'skipped',
      message: 'Midtrans Iris Payout tidak dieksekusi (server key tidak dikonfigurasi).',
    };

    try {
      const irisResult = await MidtransService.createPayout({
        referenceNo: midtransOrderId,
        beneficiaryName: profile.full_name ?? 'PackLoop User',
        beneficiaryAccount: accountNumber,
        eWalletProvider: eWalletProvider,
        amountIdr: amountIdr,
      });

      payoutResult = {
        order_id: midtransOrderId,
        status: irisResult.status,
        message: irisResult.message,
      };

      // Jika payout completed/queued/processed, di Sandbox mode otomatis di-set ke SUCCESS untuk kemudahan demo
      if (irisResult.status === 'completed' || irisResult.status === 'queued' || irisResult.status === 'processed') {
        const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
        const finalStatus = (!isProduction || irisResult.status === 'completed') ? 'SUCCESS' : 'PENDING';
        
        await supabase
          .from('reward_redemptions')
          .update({ status: finalStatus })
          .eq('midtrans_order_id', midtransOrderId);

        redemption.status = finalStatus;
      }
    } catch (payoutError) {
      console.warn('⚠️ Iris Payout notice:', (payoutError as Error).message);
      payoutResult.message = (payoutError as Error).message;
    }

    return {
      ...redemption,
      payout: payoutResult,
    };
  }

  static async getUserRedemptions(userId: string) {
    const { data, error } = await supabase
      .from('reward_redemptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  static async cancelRedemption(redemptionId: string, userId: string) {
    const { data: redemption, error: fetchError } = await supabase
      .from('reward_redemptions')
      .select('*')
      .eq('id', redemptionId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !redemption) {
      throw new Error('Data penukaran poin tidak ditemukan');
    }

    if (redemption.status !== 'PENDING') {
      throw new Error(`Penukaran tidak dapat dibatalkan karena berstatus ${redemption.status}`);
    }

    // 1. Hapus redemption
    const { error: deleteError } = await supabase
      .from('reward_redemptions')
      .delete()
      .eq('id', redemptionId);

    if (deleteError) throw new Error(deleteError.message);

    // 2. Kembalikan poin user
    const { data: profile } = await supabase.from('profiles').select('total_points').eq('id', userId).single();
    if (profile) {
      await supabase
        .from('profiles')
        .update({ total_points: profile.total_points + redemption.points_redeemed })
        .eq('id', userId);
    }

    return true;
  }
}
