# WorkoutSync Setup Guide

## 🔧 Environment Configuration

The "Failed to create account" error is likely due to missing Supabase environment variables.

### Step 1: Create Environment File

Create a `.env.local` file in the root directory with your Supabase credentials:

```bash
# Copy this template and replace with your actual values
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 2: Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon public** key
5. Paste them into your `.env.local` file

### Step 3: Run Database Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/001_create_users_table.sql`
4. Click **Run** to create the users table

### Step 4: Configure Vercel Environment Variables

If deploying to Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the same variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Redeploy your project

## 🚀 Testing the Setup

After configuration:

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test account creation:**
   - Go to `/register`
   - Fill out the form
   - Try creating an account

3. **Check the console:**
   - Open browser developer tools
   - Look for any error messages in the console
   - Check the Network tab for API request failures

## 🔍 Troubleshooting

### Common Issues:

**"Server configuration error"**
- Missing or incorrect environment variables
- Check `.env.local` file exists and has correct values

**"Database connection failed"**
- Supabase URL or key is incorrect
- Database migration hasn't been run

**"Authentication failed"**
- Supabase project settings
- Check if Auth is enabled in Supabase

**"Profile update failed"**
- Database table doesn't exist
- Run the migration from `supabase/migrations/001_create_users_table.sql`

### Debug Steps:

1. **Check environment variables are loaded:**
   ```bash
   # In your terminal, verify the file exists:
   ls -la .env.local
   
   # Check the contents (don't share publicly):
   cat .env.local
   ```

2. **Test Supabase connection:**
   ```bash
   # Try a simple API call to test connectivity
   curl -H "apikey: YOUR_ANON_KEY" https://your-project-id.supabase.co/rest/v1/
   ```

3. **Check browser console:**
   - Look for network errors
   - Check for JavaScript errors
   - Verify API calls are being made

## 📞 Getting Help

If you're still having issues:

1. Check the browser developer console for error messages
2. Verify your Supabase project is active and accessible
3. Ensure the database migration has been run successfully
4. Double-check your environment variables match your Supabase project

The error should be resolved once the environment variables are properly configured! 🎯
