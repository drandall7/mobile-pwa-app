-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number text NOT NULL UNIQUE,
    email text UNIQUE,
    name text NOT NULL,
    activity_preferences jsonb NOT NULL DEFAULT '[]'::jsonb,
    pace_range_min integer,
    pace_range_max integer,
    home_location_coords geography(Point, 4326),
    home_location_name text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT users_phone_number_format CHECK (phone_number ~ '^\+[1-9]\d{1,14}$'),
    CONSTRAINT users_email_format CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_pace_range_valid CHECK (
        pace_range_min IS NULL OR 
        pace_range_max IS NULL OR 
        pace_range_min <= pace_range_max
    ),
    CONSTRAINT users_activity_preferences_valid CHECK (
        jsonb_typeof(activity_preferences) = 'array' AND
        activity_preferences <@ '["run", "bike", "walk", "swim", "hike", "gym", "yoga", "pilates", "crossfit", "other"]'::jsonb
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON public.users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_home_location_coords ON public.users USING GIST(home_location_coords);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON public.users(updated_at);

-- Create index on activity_preferences for efficient filtering
CREATE INDEX IF NOT EXISTS idx_users_activity_preferences ON public.users USING GIN(activity_preferences);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at on row changes
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own data
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can delete their own data
CREATE POLICY "Users can delete own profile" ON public.users
    FOR DELETE USING (auth.uid() = id);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, phone_number, name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
        COALESCE(NEW.raw_user_meta_data->>'name', '')
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to get user by phone number
CREATE OR REPLACE FUNCTION public.get_user_by_phone(phone text)
RETURNS TABLE (
    id uuid,
    phone_number text,
    email text,
    name text,
    activity_preferences jsonb,
    pace_range_min integer,
    pace_range_max integer,
    home_location_coords geography(Point, 4326),
    home_location_name text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.phone_number,
        u.email,
        u.name,
        u.activity_preferences,
        u.pace_range_min,
        u.pace_range_max,
        u.home_location_coords,
        u.home_location_name,
        u.created_at,
        u.updated_at
    FROM public.users u
    WHERE u.phone_number = phone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to search users by location
CREATE OR REPLACE FUNCTION public.find_users_near_location(
    user_location geography(Point, 4326),
    radius_meters integer DEFAULT 10000
)
RETURNS TABLE (
    id uuid,
    phone_number text,
    name text,
    activity_preferences jsonb,
    pace_range_min integer,
    pace_range_max integer,
    home_location_name text,
    distance_meters double precision
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.phone_number,
        u.name,
        u.activity_preferences,
        u.pace_range_min,
        u.pace_range_max,
        u.home_location_name,
        ST_Distance(user_location, u.home_location_coords)::double precision as distance_meters
    FROM public.users u
    WHERE u.home_location_coords IS NOT NULL
    AND ST_DWithin(user_location, u.home_location_coords, radius_meters)
    ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to find users with matching activity preferences
CREATE OR REPLACE FUNCTION public.find_users_by_activities(
    activities jsonb
)
RETURNS TABLE (
    id uuid,
    phone_number text,
    name text,
    activity_preferences jsonb,
    pace_range_min integer,
    pace_range_max integer,
    home_location_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.phone_number,
        u.name,
        u.activity_preferences,
        u.pace_range_min,
        u.pace_range_max,
        u.home_location_name
    FROM public.users u
    WHERE u.activity_preferences ?| (SELECT array_agg(value::text) FROM jsonb_array_elements_text(activities))
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.users IS 'User profiles for WorkoutSync app';
COMMENT ON COLUMN public.users.phone_number IS 'Phone number in E.164 format (e.g., +19195551234)';
COMMENT ON COLUMN public.users.activity_preferences IS 'Array of activity types user is interested in';
COMMENT ON COLUMN public.users.pace_range_min IS 'Minimum pace in minutes per mile';
COMMENT ON COLUMN public.users.pace_range_max IS 'Maximum pace in minutes per mile';
COMMENT ON COLUMN public.users.home_location_coords IS 'Home location as PostGIS geography point';
COMMENT ON COLUMN public.users.home_location_name IS 'Human-readable location name';

-- Insert sample data for testing (optional)
INSERT INTO public.users (
    phone_number,
    email,
    name,
    activity_preferences,
    pace_range_min,
    pace_range_max,
    home_location_coords,
    home_location_name
) VALUES (
    '+19195551234',
    'john.doe@example.com',
    'John Doe',
    '["run", "bike"]'::jsonb,
    7,
    9,
    ST_GeogFromText('POINT(-78.8986 35.9940)'),
    'Durham, NC'
), (
    '+19195551235',
    'jane.smith@example.com',
    'Jane Smith',
    '["walk", "yoga"]'::jsonb,
    12,
    15,
    ST_GeogFromText('POINT(-78.8986 35.9940)'),
    'Durham, NC'
) ON CONFLICT (phone_number) DO NOTHING;
