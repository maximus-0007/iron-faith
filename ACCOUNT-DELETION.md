# Account Deletion Flow

A comprehensive account deletion system has been implemented to comply with GDPR, App Store requirements, and best practices for user privacy.

## Features

### User Interface
- **Delete Account Button** in Settings modal
- **Confirmation Modal** with clear warnings
- **Type-to-Confirm** mechanism (user must type "DELETE")
- **Email Display** showing which account will be deleted
- **Clear Warning Messages** about data loss

### Data Deletion
All user data is permanently removed:
- Conversations and messages
- Bookmarks and folders
- User profile and preferences
- Translation preferences
- Subscription data
- Daily usage records
- Message feedback
- User memories
- Verse cache
- Todos
- Auth user account

### Security
- User can only delete their own account
- Authorization checked via `auth.uid()`
- Database function runs with elevated privileges
- Transaction-based deletion for data integrity
- Proper error handling and rollback

## Implementation

### Database Function

Location: `supabase/migrations/*_add_account_deletion_function.sql`

The `delete_user_account` function:
1. Verifies user authorization
2. Deletes data in proper order (respecting foreign keys)
3. Removes auth user as final step
4. Returns success/error status
5. All operations in a single transaction

```sql
delete_user_account(user_uuid uuid) -> jsonb
```

### Backend Integration

Location: `utils/AuthContext.tsx`

The `deleteAccount` function:
- Calls database RPC function
- Handles errors gracefully
- Returns standardized error format
- Part of AuthContext for easy access

```typescript
deleteAccount: () => Promise<{ error?: string }>
```

### UI Components

#### DeleteAccountModal
Location: `components/DeleteAccountModal.tsx`

Features:
- Warning icon and messages
- List of data to be deleted
- Email confirmation display
- Text input for "DELETE" confirmation
- Disabled state during deletion
- Error display
- Loading indicator

#### Settings Integration
Location: `components/SettingsModal.tsx`

Features:
- Delete Account button after Sign Out
- Opens confirmation modal
- Handles deletion completion
- Closes settings on success

## User Flow

1. **Open Settings** - User taps settings icon
2. **Scroll to Bottom** - Find "Delete Account" button
3. **Tap Delete Account** - Warning modal appears
4. **Read Warnings** - Clear list of what will be deleted
5. **Type DELETE** - Confirmation required
6. **Confirm Deletion** - Tap "Delete Forever"
7. **Account Deleted** - All data removed, user signed out

## Safety Features

### Confirmation Requirements
- User must explicitly tap "Delete Account"
- Confirmation modal with warnings
- Must type "DELETE" (case-insensitive)
- "Delete Forever" button only enabled when confirmed
- No accidental deletions possible

### Clear Communication
- Warning: "This action cannot be undone"
- Detailed list of what will be deleted
- Shows email of account to be deleted
- Red color scheme for danger
- Multiple confirmation steps

### Error Handling
- Database errors caught and displayed
- Network errors handled gracefully
- Transaction rollback on failure
- User receives clear error messages
- No partial deletions

## Compliance

### GDPR
- Right to be forgotten
- Complete data removal
- User-initiated deletion
- Immediate and permanent
- No data retention after deletion

### App Store Requirements
- Account deletion available in-app
- No external steps required
- Clear and accessible
- Complies with Apple guidelines
- No hidden limitations

### Best Practices
- Confirmation before deletion
- Clear communication
- Audit trail in logs
- Secure authorization
- Data integrity maintained

## Testing Checklist

Before releasing to production:

- [ ] User can access Delete Account in Settings
- [ ] Confirmation modal appears with correct email
- [ ] Typing "DELETE" enables confirmation button
- [ ] Account deletion removes all user data
- [ ] User is signed out after deletion
- [ ] Cannot access app without signing in again
- [ ] Previous data is completely removed
- [ ] Error handling works correctly
- [ ] UI displays loading states properly
- [ ] Works on iOS, Android, and Web

## Database Tables Affected

The following tables have user data deleted:

1. `user_memories` - User's stored memories
2. `message_feedback` - Feedback on messages
3. `verse_cache` - Cached Bible verses
4. `message_bookmarks` - Saved bookmarks
5. `conversation_folder_items` - Items in folders
6. `conversation_folders` - User's folders
7. `messages` - All messages (via conversations)
8. `conversations` - All conversations
9. `user_translation_preferences` - Translation settings
10. `daily_usage` - Usage tracking
11. `user_subscriptions` - Subscription info
12. `todos` - User's todos
13. `user_profiles` - Profile information
14. `auth.users` - Authentication record

## Rollback Plan

If issues arise with account deletion:

1. **Disable Feature**
   - Comment out Delete Account button
   - Deploy updated app
   - Investigate issues

2. **Database Rollback**
   - Database function remains safe
   - Can be disabled if needed
   - Does not affect other operations

3. **Emergency Fix**
   - Fix identified issues
   - Test thoroughly
   - Redeploy with corrections

## Support Scenarios

### User Regrets Deletion
- **Solution**: Cannot recover deleted accounts
- **Response**: Account and data are permanently deleted per GDPR
- **Prevention**: Clear warnings before deletion

### Accidental Deletion
- **Prevention**: Multiple confirmation steps
- **Solution**: User must create new account
- **Response**: Previous data cannot be recovered

### Deletion Fails
- **Check**: Database logs for errors
- **Solution**: Retry deletion
- **Escalation**: Manual database cleanup if needed

### Subscription Cancellation
- **Note**: Account deletion removes subscription
- **Warning**: Displayed in confirmation modal
- **Action**: User should cancel subscription first (optional)

## Maintenance

### Monitoring
- Track deletion success rate
- Monitor for errors
- Log deletion attempts
- Review user feedback

### Updates
- Keep deletion function current
- Update when new tables added
- Maintain foreign key relationships
- Test after schema changes

### Documentation
- Keep this doc updated
- Document schema changes
- Update support materials
- Train support staff

## Security Considerations

### Authorization
- Only authenticated users can delete accounts
- User can only delete their own account
- Database function checks `auth.uid()`
- No privilege escalation possible

### Data Integrity
- Foreign keys respected
- Deletion order prevents orphans
- Transaction ensures atomicity
- Rollback on any error

### Audit Trail
- Deletions logged in database
- Timestamp recorded
- Can review deletion history
- Helps with compliance

## Future Enhancements

Potential improvements:
- Export data before deletion
- Soft delete with recovery period
- Email confirmation before deletion
- Deletion reason survey
- Automated subscription cancellation
- Account deactivation option

## Related Documentation

- [Privacy Policy](./assets/legal/privacy-policy.md) - User rights and data handling
- [Terms of Service](./assets/legal/terms-of-service.md) - Account termination terms
- [GDPR Compliance](./DEPLOYMENT-READY-CHECKLIST.md) - Regulatory requirements

## Support Contact

For issues with account deletion:
1. Check error message
2. Verify internet connection
3. Try again after a few minutes
4. Contact support if problem persists

## Conclusion

The account deletion feature provides users with complete control over their data while maintaining security, compliance, and data integrity. It meets all requirements for GDPR compliance and App Store approval.
