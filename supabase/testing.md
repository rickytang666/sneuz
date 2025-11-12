# Supabase Testing Guide

Complete this checklist to verify your Phase 1 backend setup is working correctly.

## Prerequisites

- ✅ Migration has been run successfully
- ✅ Email/password authentication is enabled

---

## 1. Test Schema Creation

**Location:** `Table Editor`

Verify all tables exist:

- [ ] `profiles` table exists
- [ ] `sleep_sessions` table exists
- [ ] `user_settings` table exists

Check table structure for `sleep_sessions`:

- [ ] Has columns: `id`, `user_id`, `start_time`, `end_time`, `source`, `updated_at`
- [ ] `source` has default value of `'manual'`
- [ ] Constraint exists: `valid_end_time` (end_time >= start_time)
- [ ] Constraint exists: `valid_source` (source in manual/widget/shortcut)

---

## 2. Test User Creation & Auto-Triggers

**Location:** `Authentication` → `Users`

### Create a test user:

1. Click "Add user" → "Create new user"
2. Email: `test@example.com`
3. Password: `testpassword123`
4. Click "Create user"

### Verify auto-creation trigger worked:

**Check profiles table:**

- [ ] Go to `Table Editor` → `profiles`
- [ ] New row exists with the user's UUID
- [ ] `created_at` and `updated_at` are populated

**Check user_settings table:**

- [ ] Go to `Table Editor` → `user_settings`
- [ ] New row exists with the user's UUID
- [ ] `target_hours` = 8.0 (default)
- [ ] `timezone` = 'UTC' (default)
- [ ] `created_at` and `updated_at` are populated

---

## 3. Test CRUD Operations (as authenticated user)

**Location:** `SQL Editor`

### Setup: Get your test user's ID

```sql
SELECT id, email FROM auth.users WHERE email = 'test@example.com';
```

Copy the UUID - you'll need it below.

---

### Test INSERT (Create)

**Insert a sleep session:**

```sql
INSERT INTO public.sleep_sessions (user_id, start_time, end_time, source)
VALUES (
  'YOUR_USER_ID_HERE',
  '2024-11-11 22:00:00+00',
  '2024-11-12 06:00:00+00',
  'manual'
);
```

**Verify:**

- [ ] Query succeeds
- [ ] `id` was auto-generated (UUID)
- [ ] `updated_at` was auto-set to end_time

---

### Test SELECT (Read)

**Fetch the session:**

```sql
SELECT * FROM public.sleep_sessions
WHERE user_id = 'YOUR_USER_ID_HERE'
ORDER BY start_time DESC;
```

**Verify:**

- [ ] Returns the session you just created
- [ ] All fields are correct
- [ ] Timestamps are in UTC

---

### Test UPDATE

**Update the session:**

```sql
UPDATE public.sleep_sessions
SET end_time = '2024-11-12 07:00:00+00'
WHERE user_id = 'YOUR_USER_ID_HERE';
```

**Verify the auto-update trigger:**

```sql
SELECT id, end_time, updated_at
FROM public.sleep_sessions
WHERE user_id = 'YOUR_USER_ID_HERE';
```

- [ ] `end_time` changed to 07:00
- [ ] `updated_at` automatically updated to now()

---

### Test DELETE

**Delete the session:**

```sql
DELETE FROM public.sleep_sessions
WHERE user_id = 'YOUR_USER_ID_HERE';
```

**Verify:**

```sql
SELECT COUNT(*) FROM public.sleep_sessions
WHERE user_id = 'YOUR_USER_ID_HERE';
```

- [ ] Returns 0 (session was deleted)

---

## 4. Test Constraints

### Test: end_time must be >= start_time

**Try to insert invalid session:**

```sql
INSERT INTO public.sleep_sessions (user_id, start_time, end_time)
VALUES (
  'YOUR_USER_ID_HERE',
  '2024-11-12 08:00:00+00',
  '2024-11-12 06:00:00+00'  -- Earlier than start_time!
);
```

- [ ] Query FAILS with constraint violation error
- [ ] Error mentions `valid_end_time` constraint

---

### Test: source must be valid

**Try to insert invalid source:**

```sql
INSERT INTO public.sleep_sessions (user_id, start_time, end_time, source)
VALUES (
  'YOUR_USER_ID_HERE',
  '2024-11-11 22:00:00+00',
  '2024-11-12 06:00:00+00',
  'invalid_source'  -- Not in allowed values!
);
```

- [ ] Query FAILS with constraint violation error
- [ ] Error mentions `valid_source` constraint

---

### Test: target_hours must be valid

**Try to set invalid target_hours:**

```sql
UPDATE public.user_settings
SET target_hours = 25.0  -- More than 24 hours!
WHERE user_id = 'YOUR_USER_ID_HERE';
```

- [ ] Query FAILS with constraint violation error
- [ ] Error mentions `valid_target_hours` constraint

---

## 5. Test Row Level Security (RLS)

### Create a second test user:

1. Go to `Authentication` → `Users`
2. Create another user: `test2@example.com` / `testpassword123`
3. Get the new user's ID

### Test RLS isolation:

**Insert session for user 1:**

```sql
INSERT INTO public.sleep_sessions (user_id, start_time, end_time)
VALUES (
  'USER_1_ID_HERE',
  '2024-11-11 22:00:00+00',
  '2024-11-12 06:00:00+00'
);
```

**Insert session for user 2:**

```sql
INSERT INTO public.sleep_sessions (user_id, start_time, end_time)
VALUES (
  'USER_2_ID_HERE',
  '2024-11-11 23:00:00+00',
  '2024-11-12 07:00:00+00'
);
```

**Verify each user only sees their own data:**

```sql
-- This should return 1 session
SELECT COUNT(*) FROM public.sleep_sessions WHERE user_id = 'USER_1_ID_HERE';

-- This should return 1 session
SELECT COUNT(*) FROM public.sleep_sessions WHERE user_id = 'USER_2_ID_HERE';
```

- [ ] User 1 has 1 session
- [ ] User 2 has 1 session
- [ ] Total sessions in table = 2

**Note:** In SQL Editor, you're running as the service role (bypasses RLS). In your actual apps, RLS will automatically filter based on `auth.uid()`.

---

## 6. Test Cascade Deletes

**Delete user 1:**

```sql
DELETE FROM auth.users WHERE id = 'USER_1_ID_HERE';
```

**Verify cascade worked:**

```sql
-- Should return 0 (deleted)
SELECT COUNT(*) FROM public.profiles WHERE id = 'USER_1_ID_HERE';

-- Should return 0 (deleted)
SELECT COUNT(*) FROM public.sleep_sessions WHERE user_id = 'USER_1_ID_HERE';

-- Should return 0 (deleted)
SELECT COUNT(*) FROM public.user_settings WHERE user_id = 'USER_1_ID_HERE';
```

- [ ] Profile was deleted
- [ ] All sleep sessions were deleted
- [ ] User settings were deleted
- [ ] User 2's data is still intact

---

## 7. Test User Settings CRUD

**Update settings for user 2:**

```sql
UPDATE public.user_settings
SET
  target_hours = 7.5,
  timezone = 'America/New_York'
WHERE user_id = 'USER_2_ID_HERE';
```

**Verify:**

```sql
SELECT * FROM public.user_settings WHERE user_id = 'USER_2_ID_HERE';
```

- [ ] `target_hours` = 7.5
- [ ] `timezone` = 'America/New_York'
- [ ] `updated_at` was automatically updated

---

## 8. Test Multiple Sleep Sessions

**Insert multiple sessions for user 2:**

```sql
INSERT INTO public.sleep_sessions (user_id, start_time, end_time, source) VALUES
  ('USER_2_ID_HERE', '2024-11-10 22:00:00+00', '2024-11-11 06:00:00+00', 'manual'),
  ('USER_2_ID_HERE', '2024-11-11 23:00:00+00', '2024-11-12 07:00:00+00', 'widget'),
  ('USER_2_ID_HERE', '2024-11-12 22:30:00+00', '2024-11-13 06:30:00+00', 'shortcut');
```

**Verify ordering and filtering:**

```sql
SELECT start_time, end_time, source
FROM public.sleep_sessions
WHERE user_id = 'USER_2_ID_HERE'
ORDER BY start_time DESC;
```

- [ ] Returns 3 sessions
- [ ] Ordered by most recent first
- [ ] Different sources are preserved

---

## 9. Test Indexes (Performance Check)

**Check that indexes exist:**

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'sleep_sessions';
```

**Verify these indexes exist:**

- [ ] `sleep_sessions_user_id_idx` on `user_id`
- [ ] `sleep_sessions_start_time_idx` on `start_time DESC`
- [ ] `sleep_sessions_user_start_idx` on `(user_id, start_time DESC)`

---

## ✅ Phase 1 Complete!

If all tests pass, your backend is ready for Phase 2 (iOS development).

### Summary:

- ✅ Schema created successfully
- ✅ Auto-triggers work (profile + settings creation)
- ✅ CRUD operations work
- ✅ Constraints prevent invalid data
- ✅ RLS policies isolate user data
- ✅ Cascade deletes work
- ✅ Indexes exist for performance
- ✅ Email/password auth enabled

### Save your credentials:

Don't forget to save these to your `.env` file:

- `SUPABASE_URL` (from Project Settings → API)
- `SUPABASE_ANON_KEY` (from Project Settings → API)
