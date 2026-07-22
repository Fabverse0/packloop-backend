-- Extension untuk UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    phone_number VARCHAR(50),
    avatar_url TEXT,
    total_points INT DEFAULT 0,
    total_weight_kg DECIMAL(10, 2) DEFAULT 0.00,
    total_carbon_saved_kg DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABEL WASTE_TYPE_CONFIGS (Dibuat lebih awal sebagai Master Reference)
CREATE TABLE IF NOT EXISTS public.waste_type_configs (
    waste_type VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- GRAM, ITEM
    reward_points_per_unit INT NOT NULL, -- e.g. 10 points per 100g, 50 per tote
    carbon_saved_per_unit_kg DECIMAL(10, 2) NOT NULL -- e.g. 1.5 CO2 per kg
);

-- Insert Default Waste Type Configs
INSERT INTO public.waste_type_configs (waste_type, name, unit, reward_points_per_unit, carbon_saved_per_unit_kg)
VALUES
    ('CARDBOARD', 'Kardus', 'GRAM', 10, 1.50), -- 10 poin per 100g (100 poin/kg), 1.5kg CO2 / kg
    ('BUBBLE_WRAP', 'Bubble Wrap', 'GRAM', 15, 2.00), -- 15 poin per 100g (150 poin/kg), 2.0kg CO2 / kg
    ('TOTE_BAG', 'Tote Bag', 'ITEM', 50, 0.50) -- 50 poin per 1 tote bag, 0.5kg CO2 / item
ON CONFLICT (waste_type) DO UPDATE SET
    name = EXCLUDED.name,
    unit = EXCLUDED.unit,
    reward_points_per_unit = EXCLUDED.reward_points_per_unit,
    carbon_saved_per_unit_kg = EXCLUDED.carbon_saved_per_unit_kg;

-- 3. TABEL STATIONS
CREATE TABLE IF NOT EXISTS public.stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, MAINTENANCE, OFFLINE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABEL COMPARTMENTS (Dengan Foreign Key ke waste_type_configs)
CREATE TABLE IF NOT EXISTS public.compartments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
    waste_type VARCHAR(50) NOT NULL REFERENCES public.waste_type_configs(waste_type) ON UPDATE CASCADE ON DELETE RESTRICT,
    current_weight_kg DECIMAL(10, 2) DEFAULT 0.00,
    max_capacity_kg DECIMAL(10, 2) DEFAULT 150.00,
    status VARCHAR(50) DEFAULT 'AVAILABLE', -- AVAILABLE, ALMOST_FULL, FULL
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABEL DEPOSITS (Dengan Foreign Key ke waste_type_configs)
CREATE TABLE IF NOT EXISTS public.deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_code VARCHAR(50) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
    compartment_id UUID NOT NULL REFERENCES public.compartments(id) ON DELETE CASCADE,
    waste_type VARCHAR(50) NOT NULL REFERENCES public.waste_type_configs(waste_type) ON UPDATE CASCADE ON DELETE RESTRICT,
    weight_or_count DECIMAL(10, 2) NOT NULL,
    reward_points_earned INT NOT NULL,
    carbon_saved_kg DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'DEPOSITED', -- DEPOSITED, SORTED, PICKED_UP, IN_TRANSIT, RECYCLED
    recycled_percentage DECIMAL(5, 2) DEFAULT 85.00,
    recycle_partner VARCHAR(255) DEFAULT 'Rekosistem / Paxel',
    recycle_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABEL ORDER_TRACKING_LOGS
CREATE TABLE IF NOT EXISTS public.order_tracking_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deposit_id UUID NOT NULL REFERENCES public.deposits(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABEL REWARD_REDEMPTIONS
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    e_wallet_provider VARCHAR(50) NOT NULL, -- GOPAY, OVO, DANA, LINKAJA
    account_number VARCHAR(50) NOT NULL,
    points_redeemed INT NOT NULL,
    amount_idr DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'SUCCESS', -- PENDING, SUCCESS, FAILED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABEL PICKUPS
CREATE TABLE IF NOT EXISTS public.pickups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
    scheduled_pickup_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'SCHEDULED', -- SCHEDULED, COMPLETED, CANCELLED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABEL NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL jika broadcast
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- DEPOSIT_SUCCESS, STATION_ALERT, RECYCLE_UPDATE
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- TRIGGERS & FUNCTIONS
-- =================================================================

-- 1. Trigger Otomatis Pembuatan Profil saat Auth User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone_number, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User PackLoop'),
        COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone_number', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number,
        avatar_url = EXCLUDED.avatar_url;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang trigger pada auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Trigger Update Rekap Stats Profil saat Deposit Dibuat
CREATE OR REPLACE FUNCTION public.update_profile_stats_on_deposit()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET 
        total_points = total_points + NEW.reward_points_earned,
        total_weight_kg = total_weight_kg + CASE WHEN NEW.waste_type = 'TOTE_BAG' THEN (NEW.weight_or_count * 0.2) ELSE NEW.weight_or_count END,
        total_carbon_saved_kg = total_carbon_saved_kg + NEW.carbon_saved_kg,
        updated_at = NOW()
    WHERE id = NEW.user_id;

    -- Tambah log tracking pertama
    INSERT INTO public.order_tracking_logs (deposit_id, status, description)
    VALUES (NEW.id, 'DEPOSITED', 'Setoran diterima di kompartemen stasiun');

    -- Kirim notifikasi sukses ke user
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
        NEW.user_id,
        'Setoran Berhasil!',
        'Setoran ' || NEW.weight_or_count || ' ' || (CASE WHEN NEW.waste_type = 'TOTE_BAG' THEN 'tote bag' ELSE 'kg ' || LOWER(NEW.waste_type) END) || ' berhasil. +' || NEW.reward_points_earned || ' poin reward.',
        'DEPOSIT_SUCCESS'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_deposit_created ON public.deposits;
CREATE TRIGGER on_deposit_created
    AFTER INSERT ON public.deposits
    FOR EACH ROW EXECUTE FUNCTION public.update_profile_stats_on_deposit();

-- 3. Trigger Kurangi Poin User saat Redeem Reward
CREATE OR REPLACE FUNCTION public.deduct_points_on_redemption()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET 
        total_points = total_points - NEW.points_redeemed,
        updated_at = NOW()
    WHERE id = NEW.user_id;

    -- Kirim notifikasi redeem
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
        NEW.user_id,
        'Penukaran Poin Berhasil',
        'Tukar ' || NEW.points_redeemed || ' poin ke ' || NEW.e_wallet_provider || ' (Rp' || NEW.amount_idr || ') berhasil diproses.',
        'REDEMPTION'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_redemption_created ON public.reward_redemptions;
CREATE TRIGGER on_redemption_created
    AFTER INSERT ON public.reward_redemptions
    FOR EACH ROW EXECUTE FUNCTION public.deduct_points_on_redemption();

-- Insert Sample Seed Data for Stations & Compartments (Halte CSW & Bundaran HI)
INSERT INTO public.stations (id, name, address, latitude, longitude, status)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Halte Transjakarta CSW', 'Jl. Trunojoyo, Kebayoran Baru, Jakarta Selatan', -6.2403, 106.7984, 'ACTIVE'),
    ('22222222-2222-2222-2222-222222222222', 'Stasiun MRT Bundaran HI', 'Jl. M.H. Thamrin, Menteng, Jakarta Pusat', -6.1932, 106.8230, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.compartments (id, station_id, waste_type, current_weight_kg, max_capacity_kg, status)
VALUES
    ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'CARDBOARD', 60.00, 150.00, 'AVAILABLE'),
    ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'BUBBLE_WRAP', 40.00, 150.00, 'AVAILABLE'),
    ('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'TOTE_BAG', 50.00, 150.00, 'AVAILABLE'),
    ('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'CARDBOARD', 125.00, 150.00, 'ALMOST_FULL'),
    ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'BUBBLE_WRAP', 20.00, 150.00, 'AVAILABLE'),
    ('b3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'TOTE_BAG', 15.00, 150.00, 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;
