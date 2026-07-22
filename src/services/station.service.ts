import { supabase } from '../config/supabase.js';

export class StationService {
  static async getAllStations() {
    const { data: stations, error } = await supabase
      .from('stations')
      .select(`
        *,
        compartments (*)
      `)
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return stations;
  }

  static async getStationById(stationId: string) {
    const { data, error } = await supabase
      .from('stations')
      .select(`
        *,
        compartments (*)
      `)
      .eq('id', stationId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async getCompartmentsByStation(stationId: string) {
    const { data, error } = await supabase
      .from('compartments')
      .select('*')
      .eq('station_id', stationId);

    if (error) throw new Error(error.message);
    return data;
  }
}
