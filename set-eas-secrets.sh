#!/bin/bash

# Script to set EAS environment variables for TestFlight builds
# Run this script to configure all required secrets

echo "🔐 Setting up EAS environment variables for TestFlight..."
echo ""

# Check if user is logged in to EAS
if ! eas whoami &> /dev/null; then
  echo "❌ Not logged in to EAS. Please run: eas login"
  exit 1
fi

echo "✅ Logged in to EAS"
echo ""

# Set Supabase credentials
echo "Setting EXPO_PUBLIC_SUPABASE_URL..."
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://wcehygjbyeqwchsydjlv.supabase.co" --scope project --type string --visibility public --force

echo "Setting EXPO_PUBLIC_SUPABASE_ANON_KEY..."
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "sb_publishable_ZqjfBxUDB8zrLZJ6pQcDNA_hoRLZF2F" --scope project --type string --visibility public --force

# Set Bible API credentials
echo "Setting EXPO_PUBLIC_BIBLE_API_KEY..."
eas env:create --name EXPO_PUBLIC_BIBLE_API_KEY --value "N_nfYZ4DLv2QJ1iNGCsJz" --scope project --type string --visibility public --force

echo "Setting EXPO_PUBLIC_BIBLE_API_URL..."
eas env:create --name EXPO_PUBLIC_BIBLE_API_URL --value "https://rest.api.bible/v1" --scope project --type string --visibility public --force

# Set RevenueCat credentials
echo "Setting EXPO_PUBLIC_REVENUECAT_IOS_API_KEY..."
eas env:create --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value "sk_ixiDcSWLMoTHTvVGJfaFHzfhnDAaG" --scope project --type string --visibility public --force

echo "Setting EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY..."
eas env:create --name EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY --value "sk_ixiDcSWLMoTHTvVGJfaFHzfhnDAaG" --scope project --type string --visibility public --force

echo ""
echo "✅ All environment variables set!"
echo ""
echo "You can verify by running: eas env:list"
echo ""
echo "Next steps:"
echo "1. Build for production: npx eas build --profile production --platform ios"
echo "2. Submit to TestFlight: npx eas submit --platform ios"
