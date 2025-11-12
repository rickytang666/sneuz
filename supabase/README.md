# Supabase Setup

## Running Migrations

### Option 1: Supabase Dashboard (Easiest for now)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `migrations/20241112000000_initial_schema.sql`
4. Click **Run** to execute the migration

### Option 2: Supabase CLI (For later)

If you want to use the CLI for local development:

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Initialize Supabase in your project (if not already done)
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Push migrations to remote
supabase db push
```

## Database Schema

### Tables

- **profiles** - Extends `auth.users` with app-specific data
- **sleep_sessions** - Core sleep tracking data
- **user_settings** - User preferences (target hours, timezone)

### Key Features

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Users can only access their own data
- ✅ Automatic `updated_at` timestamp updates
- ✅ Auto-creation of profile and settings on user signup
- ✅ Proper indexes for query performance
- ✅ Validation constraints (end_time >= start_time, etc.)

## Testing the Schema

After running the migration, test in the Supabase dashboard:

1. **Create a test user** (Authentication > Users > Add user)
2. **Verify auto-creation**: Check that profile and settings were created automatically
3. **Test RLS**: Try inserting/querying data as that user
4. **Test constraints**: Try inserting invalid data (end_time < start_time) - should fail

## Environment Variables

You'll need these for your iOS and web apps:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Find these in: Project Settings > API
