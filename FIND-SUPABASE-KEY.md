# How to Find Your Correct Supabase Anon Key

## 🎯 The Problem

The key `sb_publishable_6VTWOVTDsEh4AwftJFpIdQ_0sna9_LL` is **NOT** the correct Supabase anon key format.

Supabase anon keys are **JWT tokens** that look like this:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjZWh5Z2pieWVxd2Noc3lkamx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MzI4ODIsImV4cCI6MjA4NDAwODg4Mn0.gsTv4E1w0K0durbdZ5tx2UkxQ43xdTBxFWUXPhYUC7w
```

## 📍 Step-by-Step: Where to Find the Correct Key

### Step 1: Go to Supabase Dashboard
1. Visit: **https://supabase.com/dashboard**
2. Sign in to your account

### Step 2: Select Your Project
- Click on your project: **wcehygjbyeqwchsydjlv**

### Step 3: Navigate to API Settings
1. Look at the **left sidebar**
2. Click the **⚙️ Settings** icon (gear/cog)
3. Click **API** in the settings menu

### Step 4: Find the Anon Key
You'll see a section called **"Project API keys"** with several keys:

```
┌─────────────────────────────────────────────────┐
│ Project API keys                                 │
├─────────────────────────────────────────────────┤
│                                                  │
│  anon public                                     │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...        │
│  [👁️ Reveal] [📋 Copy]                          │
│                                                  │
│  service_role                                    │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...        │
│  [👁️ Reveal] [📋 Copy]                          │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Step 5: Copy the CORRECT Key
- ✅ **Click "Copy" next to "anon public"** (NOT service_role!)
- ✅ The key should start with `eyJ...`
- ✅ It will be a long JWT token

### Step 6: Update Your .env File
Replace the current key in your `.env` file:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://wcehygjbyeqwchsydjlv.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ... (paste the JWT token here)
```

## ❓ What is `sb_publishable_...`?

The `sb_publishable_...` format might be:
- A key from a different service (Stripe uses similar format)
- An old/experimental Supabase format
- A key from a different part of the dashboard

**It will NOT work** with the Supabase JavaScript client library.

## ✅ Verification

After updating your `.env` file:

1. **Restart your dev server:**
   ```bash
   expo start --clear
   ```

2. **Run the verification script:**
   ```bash
   node verify-supabase.js
   ```

3. **Test in the app:**
   - Try to sign up or log in
   - Should work without "invalid API key" errors

## 🔍 Still Can't Find It?

If you don't see an "anon public" key in Settings → API:

1. **Check if your project is active:**
   - Make sure the project isn't paused
   - Check project status in dashboard

2. **Try creating a new API key:**
   - Some Supabase projects allow regenerating keys
   - Look for "Regenerate" or "Create new key" options

3. **Contact Supabase Support:**
   - If the anon key is missing, contact support
   - They can help restore or regenerate it

## 🚨 Important Security Notes

- ✅ **anon public key**: Safe to use in client-side code (this is what you need)
- ❌ **service_role key**: NEVER use in client code - it's a secret!
- ✅ Your `.env` file is in `.gitignore` - your keys are safe
