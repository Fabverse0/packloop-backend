import { Request, Response } from 'express';
import { StationService } from '../services/station.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class StationController {
  static async getAllStations(_req: Request, res: Response) {
    try {
      const stations = await StationService.getAllStations();
      return sendSuccess(res, 'Berhasil mengambil daftar stasiun', stations);
    } catch (error: any) {
      return sendError(res, error.message || 'Gagal mengambil daftar stasiun', null, 500);
    }
  }

  static async getStationById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const station = await StationService.getStationById(id);
      return sendSuccess(res, 'Berhasil mengambil detail stasiun', station);
    } catch (error: any) {
      return sendError(res, error.message || 'Gagal mengambil detail stasiun', null, 404);
    }
  }

  static async getCompartments(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const compartments = await StationService.getCompartmentsByStation(id);
      return sendSuccess(res, 'Berhasil mengambil daftar kompartemen', compartments);
    } catch (error: any) {
      return sendError(res, error.message || 'Gagal mengambil daftar kompartemen', null, 500);
    }
  }
}
