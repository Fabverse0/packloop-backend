import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RewardService } from '../src/services/reward.service.js';

describe('RewardService (Seam B - Penukaran Poin)', () => {
  it('1. Harus MENOLAK penukaran jika poin kurang dari 10', async () => {
    const input = {
      userId: '00000000-0000-0000-0000-000000000000',
      eWalletProvider: 'GOPAY' as const,
      accountNumber: '081234567890',
      pointsRedeemed: 5, // Kurang dari minimal 10 poin
    };

    await assert.rejects(
      async () => {
        await RewardService.redeemPoints(input);
      },
      (err: Error) => {
        assert.match(err.message, /minimal 10 poin/i);
        return true;
      },
      'Penukaran < 10 poin harus ditolak'
    );
  });

  it('2. Harus MENOLAK penukaran jika saldo poin pengguna tidak cukup / profil tidak ditemukan', async () => {
    const input = {
      userId: '00000000-0000-0000-0000-000000000000',
      eWalletProvider: 'DANA' as const,
      accountNumber: '081234567890',
      pointsRedeemed: 1000000, // Jumlah sangat besar
    };

    await assert.rejects(
      async () => {
        await RewardService.redeemPoints(input);
      },
      (err: Error) => {
        assert.match(err.message, /tidak cukup|tidak ditemukan/i);
        return true;
      },
      'Penukaran poin melebihi saldo harus ditolak'
    );
  });

  it('3. 🟢 (GREEN) Harus MENOLAK penukaran jika nomor E-Wallet kosong / hanya spasi', async () => {
    const input = {
      userId: '00000000-0000-0000-0000-000000000000',
      eWalletProvider: 'OVO' as const,
      accountNumber: '   ', // Kosong / spasi
      pointsRedeemed: 50,
    };

    await assert.rejects(
      async () => {
        await RewardService.redeemPoints(input);
      },
      (err: Error) => {
        assert.match(err.message, /nomor.*wajib diisi|tidak valid/i);
        return true;
      },
      'Nomor E-Wallet kosong harus ditolak'
    );
  });
});
