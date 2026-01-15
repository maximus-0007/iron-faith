# Onboarding Flow Documentation

This document describes the comprehensive onboarding system for first-time Iron Faith users.

## Overview

The onboarding flow introduces new users to Iron Faith's philosophy and helps them get started with meaningful conversations. It consists of:

1. **Iron Sharpens Iron Philosophy Screen** - Explains the app's approach and values
2. **Sample Questions** - Provides curated questions to start conversations
3. **Empty State Guidance** - Helpful prompts even after onboarding

## User Journey

### First-Time User Flow

```
User Signs Up
    ↓
Philosophy Intro Screen
    ↓ (User clicks "I'm Ready")
Sample Questions Screen
    ↓ (User selects a question)
Conversation Begins
    ↓
Onboarding Marked Complete
```

### Key Decision Points

**Show Onboarding If:**
- User has not completed onboarding (`onboarding_completed = false`)
- User has never sent a message (`first_message_sent_at = null`)

**Skip Onboarding If:**
- User has completed onboarding
- User has sent at least one message

## Components

### 1. IronSharpenIronIntro

**Location:** `/components/IronSharpenIronIntro.tsx`

**Purpose:** Introduces the "Iron Sharpens Iron" philosophy and sets expectations.

**Features:**
- Animated entrance
- Proverbs 27:17 verse display
- Three core principles:
  - Truth Without Compromise
  - Challenge That Strengthens
  - Practical Application
- Warning section ("This Is Not For Everyone")
- "I'm Ready" button to continue

**Design Philosophy:**
- Bold and direct messaging
- No sugar-coating
- Clear expectations
- Masculine, serious tone

### 2. SampleQuestions

**Location:** `/components/SampleQuestions.tsx`

**Purpose:** Provides categorized sample questions to help users start conversations.

**Categories:**
1. **Leadership** - Family leadership, spiritual headship
2. **Purity** - Sexual integrity, guarding eyes and mind
3. **Work** - Career, ambition, purpose in work
4. **Relationships** - Friendships, dating, marriage, conflict
5. **Spiritual Growth** - Prayer, Bible study, spiritual disciplines

**Each Category Contains:**
- 3 specific, practical questions
- Icon and color coding
- Direct, masculine language

**Features:**
- Animated category entrance
- Tap any question to start conversation
- Scrollable list
- Visual hierarchy with icons
- Footer with encouragement to ask anything

### 3. Enhanced Empty State

**Location:** `/screens/ChatScreen.tsx`

**Shows:**
- App icon
- "Start a Conversation" title
- Helpful subtitle
- Lightbulb button to access sample questions

**Behavior:**
- Only visible when no messages exist
- Not shown during onboarding
- Always accessible after onboarding

## Database Schema

### Onboarding Fields in `user_profiles`

```sql
onboarding_completed boolean DEFAULT false
onboarding_completed_at timestamptz
first_message_sent_at timestamptz
completed_onboarding_steps text[] DEFAULT '{}'
has_seen_welcome_carousel boolean DEFAULT false
```

### Tracking Logic

**Onboarding Completion:**
```typescript
await supabase
  .from('user_profiles')
  .update({
    onboarding_completed: true,
    onboarding_completed_at: new Date().toISOString()
  })
  .eq('id', user.id);
```

**First Message Tracking:**
```typescript
// Already implemented in handleSendMessage
if (user?.id && userProfile && !userProfile.first_message_sent_at) {
  await supabase
    .from('user_profiles')
    .update({ first_message_sent_at: new Date().toISOString() })
    .eq('id', user.id);
}
```

## State Management

### ChatScreen State

```typescript
const [showPhilosophyIntro, setShowPhilosophyIntro] = useState(false);
const [showSampleQuestions, setShowSampleQuestions] = useState(false);
```

### Flow Control

**Initialize Onboarding:**
```typescript
const { data: profile } = await supabase
  .from('user_profiles')
  .select('onboarding_completed, first_message_sent_at')
  .eq('id', user.id)
  .single();

if (profile && !profile.onboarding_completed && !profile.first_message_sent_at) {
  setShowPhilosophyIntro(true);
}
```

**Philosophy Continue:**
```typescript
const handlePhilosophyContinue = () => {
  setShowPhilosophyIntro(false);
  setShowSampleQuestions(true);
};
```

**Select Sample Question:**
```typescript
const handleSelectSampleQuestion = async (question: string) => {
  setShowSampleQuestions(false);

  // Mark onboarding complete
  await supabase
    .from('user_profiles')
    .update({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString()
    })
    .eq('id', user.id);

  // Send the selected question
  await handleSendMessage(question);
};
```

**Skip Onboarding:**
```typescript
const handleSkipOnboarding = async () => {
  setShowPhilosophyIntro(false);
  setShowSampleQuestions(false);

  // Mark complete even if skipped
  await supabase
    .from('user_profiles')
    .update({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString()
    })
    .eq('id', user.id);
};
```

## UI Behavior

### Header Buttons

**During Onboarding:**
- Only Settings button visible
- No search, export, or sample questions button

**After Onboarding (Empty State):**
- Lightbulb button to show sample questions
- Settings button

**With Messages:**
- Search button
- Export button
- Settings button

### Chat Input

**Hidden During:**
- Philosophy intro screen
- Sample questions screen

**Visible During:**
- Normal chat
- Empty state (after onboarding)

### Conditional Rendering

```typescript
{showPhilosophyIntro ? (
  <IronSharpenIronIntro onContinue={handlePhilosophyContinue} />
) : showSampleQuestions ? (
  <SampleQuestions onSelectQuestion={handleSelectSampleQuestion} />
) : messages.length === 0 && !isLoading ? (
  <View style={styles.emptyState}>
    {/* Empty state content */}
  </View>
) : (
  <FlatList>
    {/* Messages */}
  </FlatList>
)}
```

## Sample Questions Content

### Leadership Category
- "How can I lead my family with biblical authority without being domineering?"
- "What does it mean to be the spiritual head of my household?"
- "How do I balance firmness and gentleness as a father?"

### Purity Category
- "How do I fight lust and pornography in a hypersexualized culture?"
- "What are practical steps to guard my eyes and mind?"
- "How can I rebuild trust after failing in sexual purity?"

### Work Category
- "How should a Christian man approach his career and ambition?"
- "What does the Bible say about working hard vs. being workaholic?"
- "How do I find purpose in mundane or difficult work?"

### Relationships Category
- "How do I build genuine friendships with other men?"
- "What does biblical masculinity look like in dating and marriage?"
- "How should I handle conflict with my wife or family?"

### Spiritual Growth Category
- "How do I develop a consistent prayer and Bible study habit?"
- "What does it mean to deny myself and take up my cross?"
- "How can I grow spiritually when I feel spiritually dry?"

## Messaging Principles

### Iron Sharpens Iron Philosophy

**Core Messages:**
1. **Truth Without Compromise** - No sugar-coating, no excuses, biblical truth with clarity
2. **Challenge That Strengthens** - Growth through friction, accountability not enablement
3. **Practical Application** - Transform daily life, specific guidance for real situations

**Tone:**
- Direct and masculine
- Serious but encouraging
- Challenging without being harsh
- Biblical and practical
- No worldly wisdom or feel-good affirmations

**Target Audience:**
- Men seeking biblical accountability
- Those tired of compromised Christianity
- Men ready for spiritual growth
- Leaders wanting to step up

## Testing Checklist

### New User Experience
- [ ] Sign up new account
- [ ] Verify philosophy screen appears automatically
- [ ] Click "I'm Ready" button
- [ ] Verify sample questions screen appears
- [ ] Select a sample question
- [ ] Verify conversation starts with selected question
- [ ] Check `onboarding_completed` = true in database
- [ ] Check `onboarding_completed_at` has timestamp
- [ ] Check `first_message_sent_at` has timestamp

### Returning User
- [ ] Log in with existing onboarded user
- [ ] Verify no philosophy or sample questions shown
- [ ] Start new conversation
- [ ] Click lightbulb button in empty state
- [ ] Verify sample questions appear
- [ ] Select question and verify it sends

### Skip Functionality
- [ ] Create new user
- [ ] See philosophy screen
- [ ] (Future: Add skip button and test)
- [ ] Verify onboarding marked complete
- [ ] Verify can use app normally

### Database Verification
- [ ] Check all onboarding fields populated correctly
- [ ] Verify timestamps are accurate
- [ ] Verify boolean flags are correct
- [ ] Test with multiple users

### Edge Cases
- [ ] User closes app during onboarding
- [ ] User refreshes page during onboarding
- [ ] Network error during question selection
- [ ] Multiple devices same account

## Accessibility

### Screen Reader Support
- All buttons have accessibility labels
- Screens have proper focus management
- Navigation is keyboard accessible

### Visual Accessibility
- High contrast text
- Large touch targets
- Clear visual hierarchy
- Readable font sizes

## Future Enhancements

### Potential Additions
- [ ] Skip button on philosophy screen
- [ ] Progress indicator showing "Step 1 of 2"
- [ ] Ability to revisit philosophy screen
- [ ] Custom question suggestions based on user profile
- [ ] Onboarding analytics dashboard
- [ ] A/B testing for different messaging
- [ ] Video introduction option
- [ ] Interactive tutorial after first message
- [ ] Gamification of first week experience

### Analytics to Track
- Onboarding completion rate
- Time spent on each screen
- Most selected sample questions
- Drop-off points
- Skip vs. complete ratio
- Correlation with user retention

## Troubleshooting

### Philosophy Screen Doesn't Appear
**Check:**
1. User profile exists in database
2. `onboarding_completed` is false
3. `first_message_sent_at` is null
4. No errors in browser console
5. Component is imported correctly

### Sample Questions Don't Send
**Check:**
1. `handleSelectSampleQuestion` called correctly
2. `handleSendMessage` is working
3. Network connectivity
4. Conversation ID exists
5. No rate limiting issues

### Onboarding Loops
**Check:**
1. Database update is successful
2. `onboarding_completed` actually updates
3. Profile refetch after update
4. State management correct
5. No conflicting conditions

### UI Elements Overlapping
**Check:**
1. Conditional rendering logic
2. Z-index issues
3. Absolute positioning
4. Modal states
5. Component visibility states

## Related Files

### Core Components
- `/components/IronSharpenIronIntro.tsx` - Philosophy screen
- `/components/SampleQuestions.tsx` - Question selection
- `/screens/ChatScreen.tsx` - Main integration
- `/components/WelcomeScreen.tsx` - Pre-login welcome

### Database
- `/supabase/migrations/20251208165639_add_onboarding_status_to_profiles.sql`
- `/supabase/migrations/20251224142109_add_user_intake_and_onboarding_tracking.sql`

### Utilities
- `/utils/database.ts` - Profile queries
- `/utils/settings.tsx` - Profile management

## Best Practices

### For Developers

1. **Always Check Onboarding State**
   ```typescript
   if (profile?.onboarding_completed) {
     // Show normal UI
   } else {
     // Show onboarding
   }
   ```

2. **Update Database Atomically**
   ```typescript
   // Update multiple fields at once
   await supabase
     .from('user_profiles')
     .update({
       onboarding_completed: true,
       onboarding_completed_at: new Date().toISOString(),
       completed_onboarding_steps: ['philosophy', 'questions']
     })
     .eq('id', user.id);
   ```

3. **Handle Errors Gracefully**
   ```typescript
   try {
     await completeOnboarding();
   } catch (error) {
     console.error('Onboarding error:', error);
     // Allow user to continue anyway
   }
   ```

4. **Maintain State Consistency**
   ```typescript
   // Close one before opening another
   setShowPhilosophyIntro(false);
   setShowSampleQuestions(true);
   ```

### For Content Writers

1. Keep questions **specific and practical**
2. Use **masculine, direct language**
3. No vague spiritual platitudes
4. Each question should lead to **actionable conversation**
5. Questions should reflect **real struggles men face**

## Conclusion

The onboarding flow is designed to:
1. Set clear expectations about Iron Faith's approach
2. Help users start meaningful conversations immediately
3. Establish the tone and culture of the app
4. Track user engagement from day one

The philosophy introduction is critical - it filters for the right users and prepares them for direct, biblical accountability.
