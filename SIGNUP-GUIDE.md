# Signup and Authentication Guide

## Current Status

Your Supabase authentication is **working correctly**. The connection is established and users can sign up.

## Email Confirmation Requirement

Your Supabase instance currently has **email confirmation enabled**. This means:

1. When a user signs up, they receive a confirmation email
2. They must click the link in that email to activate their account
3. After confirmation, they can sign in with their credentials

## To Sign Up Successfully

1. Use a **real email address** (not test@example.com)
   - Valid examples: yourname@gmail.com, user@yahoo.com, etc.
   - Invalid: test@example.com, user@test.com

2. Create a strong password (at least 6 characters)

3. Check your email inbox for the confirmation email from Supabase

4. Click the confirmation link

5. Return to the app and sign in

## Option: Disable Email Confirmation (For Development)

If you want to allow instant signups without email confirmation during development:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/teyubwnuuxpaliqqogbf

2. Navigate to **Authentication** → **Providers** → **Email**

3. Find the setting **"Enable email confirmations"**

4. Toggle it **OFF**

5. Save the changes

⚠️ **Note**: Disabling email confirmation makes it easier to test but reduces security. It's recommended to keep it enabled for production apps.

## Common Issues and Solutions

### Issue: "Please enter a valid email address"
**Solution**: Use a real email domain like @gmail.com, @yahoo.com, etc. Avoid @example.com or @test.com

### Issue: "Network error" or "Failed to fetch"
**Solution**: Check your internet connection. The Supabase connection is working, so this is usually a temporary network issue.

### Issue: "Check your email to confirm your account"
**Solution**: This is expected behavior. Check your email inbox (and spam folder) for a confirmation email from Supabase.

### Issue: "An account with this email already exists"
**Solution**: Use a different email address, or sign in with the existing account.

## Testing the Signup

Try signing up with:
- Email: your_real_email@gmail.com
- Password: testpass123 (or any password 6+ characters)

You should see a message asking you to check your email for confirmation.
