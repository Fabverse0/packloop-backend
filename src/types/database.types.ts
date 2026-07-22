export type WasteType = 'CARDBOARD' | 'BUBBLE_WRAP' | 'TOTE_BAG';
export type StationStatus = 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE';
export type CompartmentStatus = 'AVAILABLE' | 'ALMOST_FULL' | 'FULL';
export type DepositStatus = 'DEPOSITED' | 'SORTED' | 'PICKED_UP' | 'IN_TRANSIT' | 'RECYCLED';
export type EWalletProvider = 'GOPAY' | 'OVO' | 'DANA' | 'LINKAJA';
export type RedemptionStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
export type NotificationType = 'DEPOSIT_SUCCESS' | 'STATION_ALERT' | 'RECYCLE_UPDATE' | 'REDEMPTION';

export interface Profile {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  total_points: number;
  total_weight_kg: number;
  total_carbon_saved_kg: number;
  created_at?: string;
  updated_at?: string;
}

export interface Station {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: StationStatus;
  created_at?: string;
}

export interface Compartment {
  id: string;
  station_id: string;
  waste_type: WasteType;
  current_weight_kg: number;
  max_capacity_kg: number;
  status: CompartmentStatus;
  updated_at?: string;
}

export interface WasteTypeConfig {
  waste_type: WasteType;
  name: string;
  unit: 'GRAM' | 'ITEM';
  reward_points_per_unit: number;
  carbon_saved_per_unit_kg: number;
}

export interface Deposit {
  id: string;
  order_code: string;
  user_id: string;
  station_id: string;
  compartment_id: string;
  waste_type: WasteType;
  weight_or_count: number;
  reward_points_earned: number;
  carbon_saved_kg: number;
  status: DepositStatus;
  recycled_percentage: number;
  recycle_partner: string;
  recycle_notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrderTrackingLog {
  id: string;
  deposit_id: string;
  status: DepositStatus;
  description: string;
  created_at?: string;
}

export interface RewardRedemption {
  id: string;
  user_id: string;
  e_wallet_provider: EWalletProvider;
  account_number: string;
  points_redeemed: number;
  amount_idr: number;
  status: RedemptionStatus;
  created_at?: string;
  processed_at?: string;
}

export interface Pickup {
  id: string;
  station_id: string;
  scheduled_pickup_at: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  created_at?: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at?: string;
}
