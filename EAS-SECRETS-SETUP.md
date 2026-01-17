# EAS Secrets Setup for TestFlight

## ✅ Successfully Created

The following environment variables have been set in EAS for production builds:

1. ✅ `EXPO_PUBLIC_BIBLE_API_KEY`
2. ✅ `EXPO_PUBLIC_BIBLE_API_URL`
3. ✅ `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
4. ✅ `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`

## ⚠️ Need Manual Update

The following variables exist but need to be updated with the correct values:

1. `EXPO_PUBLIC_SUPABASE_URL` - Currently: `https://fijyrjvgaztarqxabbud.supabase.co`
   - **Should be**: `https://wcehygjbyeqwchsydjlv.supabase.co`

2. `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Currently: JWT format (old)
   - **Should be**: `sb_publishable_ZqjfBxUDB8zrLZJ6pQcDNA_hoRLZF2F`

## How to Update the Supabase Variables

Run these commands interactively (they will prompt you):

```bash
# Update Supabase URL
eas env:update --environment production

# When prompted, select: EXPO_PUBLIC_SUPABASE_URL
# When prompted for new value, enter: https://wcehygjbyeqwchsydjlv.supabase.co

# Update Supabase Anon Key
eas env:update --environment production

# When prompted, select: EXPO_PUBLIC_SUPABASE_ANON_KEY
# When prompted for new value, enter: sb_publishable_ZqjfBxUDB8zrLZJ6pQcDNA_hoRLZF2F
```

## Verify All Variables

After updating, verify all variables are set correctly:

```bash
eas env:list --environment production
```

## Next Steps

Once all variables are set:

1. **Build for production:**
   ```bash
   npx eas build --profile production --platform ios
   ```

2. **Submit to TestFlight:**
   ```bash
   npx eas submit --platform ios
   ```

## Alternative: Delete and Recreate

If updating is problematic, you can delete and recreate:

```bash
# Delete existing (will prompt for confirmation)
eas env:delete --environment production

# Then recreate with correct values
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://wcehygjbyeqwchsydjlv.supabase.co" --scope project --type string --visibility plaintext --environment production
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "sb_publishable_ZqjfBxUDB8zrLZJ6pQcDNA_hoRLZF2F" --scope project --type string --visibility plaintext --environment production
```
