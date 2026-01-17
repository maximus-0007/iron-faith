#!/usr/bin/env node

/**
 * Quick script to verify Supabase configuration
 * Run: node verify-supabase.js
 * 
 * Note: This reads from .env file directly (Expo style)
 */

const fs = require('fs');
const path = require('path');

// Read .env file manually (Expo doesn't use dotenv)
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return envVars;
}

const env = loadEnv();

const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.EXPO_PUBLIC_SUPABASE_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY;

console.log('\n🔍 Checking Supabase Configuration...\n');

// Check if variables exist
if (!supabaseUrl) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_URL is missing');
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_KEY is missing');
  process.exit(1);
}

console.log('✅ Environment variables found');

// Check URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.warn('⚠️  Warning: Supabase URL format looks unusual');
  console.warn('   Expected: https://xxxxx.supabase.co');
  console.warn('   Got:', supabaseUrl);
} else {
  console.log('✅ Supabase URL format looks correct');
}

// Check key format
if (!supabaseAnonKey.startsWith('eyJ') && !supabaseAnonKey.startsWith('sb_publishable_')) {
  console.warn('⚠️  Warning: Supabase key format looks unusual');
  console.warn('   Expected: JWT token starting with "eyJ..." or "sb_publishable_..."');
  console.warn('   Got:', supabaseAnonKey.substring(0, 30) + '...');
} else {
  console.log('✅ Supabase key format looks correct');
}

// Try to create a test client
try {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase client created successfully');
  
  // Try a simple health check
  supabase.auth.getSession()
    .then(() => {
      console.log('✅ Supabase connection test passed\n');
      console.log('🎉 Your Supabase configuration is correct!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Supabase connection test failed:');
      console.error('   Error:', error.message);
      console.error('\n   This might mean:');
      console.error('   - The API key is invalid or expired');
      console.error('   - The Supabase project is paused');
      console.error('   - Network connectivity issues\n');
      process.exit(1);
    });
} catch (error) {
  console.error('❌ Failed to create Supabase client:');
  console.error('   Error:', error.message);
  console.error('\n   Make sure @supabase/supabase-js is installed:');
  console.error('   npm install @supabase/supabase-js\n');
  process.exit(1);
}
