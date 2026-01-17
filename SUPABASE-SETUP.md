# Supabase Setup & Verification Guide

## 🔧 Step 1: Get Your Correct Supabase Credentials

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Sign in to your account
   - Select your project: `wcehygjbyeqwchsydjlv`

2. **Navigate to API Settings:**
   - Click **Settings** (gear icon in left sidebar)
   - Click **API** in the settings menu

3. **Copy the Correct Keys:**
   - **Project URL**: Should be `https://wcehygjbyeqwchsydjlv.supabase.co`
   - **anon/public key**: Look for the key labeled "anon" or "public"
     - ✅ **Correct format**: Starts with `eyJ...` (JWT token)
     - ❌ **Wrong format**: `sb_publishable_...` (this is NOT the anon key)

4. **What to Look For:**
   ```
   Project URL: https://wcehygjbyeqwchsydjlv.supabase.co
   
   API Keys:
   - anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (USE THIS ONE)
   - service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (DO NOT USE - secret!)
   ```

## 📝 Step 2: Update Your .env File

1. **Open your `.env` file** in the project root

2. **Update with correct values:**
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://wcehygjbyeqwchsydjlv.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your actual anon key)
   ```

3. **Save the file**

## 🔄 Step 3: Restart Your Dev Server

**IMPORTANT:** Environment variables only load when the server starts!

1. **Stop your current dev server** (Ctrl+C or Cmd+C)

2. **Clear cache and restart:**
   ```bash
   expo start --clear
   ```
   
   Or if using npm:
   ```bash
   npm run dev
   ```

## ✅ Step 4: Verify It's Working

### Method 1: Check Console on App Start

When the app starts, check the console for:
- ✅ No "Supabase configuration missing" errors
- ✅ No "invalid API key" errors

### Method 2: Test Login

1. Open the app
2. Try to sign up or log in
3. If it works → ✅ Supabase is configured correctly!
4. If you get "invalid API key" → The key is still wrong

### Method 3: Check Network Tab (Web)

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to log in
4. Look for requests to `supabase.co`
5. Check if they return 200 OK or 401 Unauthorized

## 🐛 Troubleshooting

### Error: "Supabase configuration missing"
- **Cause**: Environment variables not loaded
- **Fix**: Restart dev server with `expo start --clear`

### Error: "Invalid API key" or "JWT expired"
- **Cause**: Wrong API key format or expired key
- **Fix**: 
  1. Go back to Supabase Dashboard
  2. Copy the **anon/public** key (starts with `eyJ...`)
  3. Update `.env` file
  4. Restart server

### Error: "User not found" on login
- **Cause**: This is normal if the user doesn't exist
- **Fix**: Try signing up first, then logging in

### App works in dev but not in production build
- **Cause**: Environment variables not included in build
- **Fix**: EAS Build automatically includes `.env` variables with `EXPO_PUBLIC_` prefix

## 🔐 Security Notes

- ✅ **anon/public key**: Safe to use in client-side code (this is what you need)
- ❌ **service_role key**: NEVER use in client code - it's a secret!
- ✅ Your `.env` file is in `.gitignore` - your keys are safe

## 📱 Testing Checklist

After fixing, verify:
- [ ] App starts without Supabase errors
- [ ] Can create a new account (sign up)
- [ ] Can log in with existing account
- [ ] Can log out
- [ ] Can reset password
- [ ] No console errors related to Supabase

## 🚀 Next Steps

Once Supabase is working:
1. Configure Edge Function secrets (OPENAI_API_KEY)
2. Test all features
3. Build native apps for testing
4. Submit to App Store
