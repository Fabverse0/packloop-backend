import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DepositService } from '../src/services/deposit.service.js';

describe('DepositService (Seam A - Proteksi Setoran)', () => {
  it('1. Harus MENOLAK setoran jika status kompartemen FULL', async () => {
    // Skenario: Mengirim setoran ke stasiun dengan compartmentId dummy berstatus FULL
    const dummyInput = {
      userId: '00000000-0000-0000-0000-000000000000',
      stationId: '00000000-0000-0000-0000-000000000001',
      compartmentId: 'full-compartment-id',
      wasteType: 'PAPER_BAG' as const,
      weightOrCount: 2,
    };

    await assert.rejects(
      async () => {
        await DepositService.createDeposit(dummyInput);
      },
      (err: Error) => {
        assert.match(err.message, /sudah penuh|tidak ditemukan|tidak aktif/i);
        return true;
      },
      'Setoran ke kompartemen FULL harus melempar error'
    );
  });

  it('2. Harus MENOLAK setoran jika stasiun berstatus INACTIVE / MAINTENANCE', async () => {
    const dummyInput = {
      userId: '00000000-0000-0000-0000-000000000000',
      stationId: 'inactive-station-id',
      compartmentId: '00000000-0000-0000-0000-000000000002',
      wasteType: 'TOTE_BAG' as const,
      weightOrCount: 1,
    };

    await assert.rejects(
      async () => {
        await DepositService.createDeposit(dummyInput);
      },
      (err: Error) => {
        assert.match(err.message, /tidak aktif|perawatan|tidak ditemukan/i);
        return true;
      },
      'Setoran ke stasiun INACTIVE harus melempar error'
    );
  });

  it('3. 🟢 (GREEN) Harus MENOLAK setoran jika jumlah barang melebihi 10 unit', async () => {
    const dummyInput = {
      userId: '00000000-0000-0000-0000-000000000000',
      stationId: '00000000-0000-0000-0000-000000000001',
      compartmentId: '00000000-0000-0000-0000-000000000002',
      wasteType: 'PAPER_BAG' as const,
      weightOrCount: 15, // Melebihi batas 10 unit
    };

    await assert.rejects(
      async () => {
        await DepositService.createDeposit(dummyInput);
      },
      (err: Error) => {
        assert.match(err.message, /maksimal 10 unit|melebihi batas/i);
        return true;
      },
      'Setoran > 10 unit harus ditolak'
    );
  });
});
