# Supabase Database Migrations

This directory contains SQL migration files for the WorkoutSync database.

## Migration Files

### 001_create_users_table.sql

Creates the main `users` table with all required fields and functionality:

**Table Structure:**
- `id`: UUID primary key (auto-generated)
- `phone_number`: E.164 format phone number (unique, required)
- `email`: Optional email address (unique)
- `name`: User's display name (required)
- `activity_preferences`: JSONB array of activities (e.g., ["run", "bike", "walk"])
- `pace_range_min/max`: Running pace range in minutes per mile
- `home_location_coords`: PostGIS geography point for location
- `home_location_name`: Human-readable location name
- `created_at/updated_at`: Timestamps with auto-update trigger

**Features Included:**
- ✅ **Extensions**: uuid-ossp, postgis
- ✅ **Indexes**: phone_number, email, location (spatial), activity_preferences (GIN)
- ✅ **Constraints**: Phone format validation, email validation, pace range validation
- ✅ **Triggers**: Auto-update `updated_at` timestamp
- ✅ **RLS Policies**: Users can only access their own data
- ✅ **Helper Functions**: User lookup, location search, activity matching
- ✅ **Sample Data**: Two test users for development

## How to Run Migrations

### Option 1: Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in your project
supabase init

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### Option 2: Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `001_create_users_table.sql`
4. Click **Run** to execute the migration

### Option 3: Direct SQL Execution

If you have direct database access, you can run the SQL file directly against your PostgreSQL database.

## Verification

After running the migration, verify it worked by checking:

```sql
-- Check if table exists
SELECT * FROM information_schema.tables WHERE table_name = 'users';

-- Check table structure
\d users;

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'users';

-- Check sample data
SELECT * FROM users LIMIT 5;
```

## Helper Functions

The migration creates several useful functions:

- `get_user_by_phone(phone)`: Find user by phone number
- `find_users_near_location(location, radius)`: Find users within radius
- `find_users_by_activities(activities)`: Find users with matching activities

Example usage:
```sql
-- Find user by phone
SELECT * FROM get_user_by_phone('+19195551234');

-- Find nearby users
SELECT * FROM find_users_near_location(
    ST_GeogFromText('POINT(-78.8986 35.9940)'),
    5000
);

-- Find users who like running
SELECT * FROM find_users_by_activities('["run"]'::jsonb);
```

## Troubleshooting

If you encounter issues:

1. **PostGIS Extension**: Ensure PostGIS is enabled in your Supabase project
2. **Permissions**: Make sure you have proper database permissions
3. **Constraints**: Check that phone numbers are in E.164 format (+1XXXXXXXXXX)
4. **RLS**: Verify Row Level Security policies are working correctly

## Next Steps

After running this migration:

1. Update your `.env.local` with Supabase credentials
2. Test the API endpoints with the sample data
3. Create additional migrations for new features as needed
