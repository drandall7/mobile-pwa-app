-- Add password_hash field to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash text;

-- Add comment for documentation
COMMENT ON COLUMN public.users.password_hash IS 'Stored password hash for authentication (demo purposes)';
