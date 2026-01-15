import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { useSettings } from '../utils/settings';

const termsOfServiceContent = `# Terms of Service

**Effective Date:** December 8, 2024
**Last Updated:** December 8, 2024

## Agreement to Terms

By accessing or using Iron Faith ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.

## Description of Service

Iron Faith is a mobile application that provides:
• AI-powered Bible study assistance
• Conversation-based spiritual guidance
• Scripture references and explanations
• Personalized faith resources

The App uses artificial intelligence (OpenAI's GPT models) to generate responses to your questions about faith, Scripture, and Christian living.

## User Accounts

### Account Creation
• You must provide accurate and complete information
• You must be at least 13 years old to create an account
• You are responsible for maintaining account security
• You must not share your account credentials

### Account Responsibilities
• Keep your password secure and confidential
• Notify us immediately of any unauthorized access
• You are responsible for all activity under your account
• We reserve the right to suspend or terminate accounts that violate these terms

## Acceptable Use

### You Agree To:
• Use the App for lawful purposes only
• Respect the spiritual and educational nature of the service
• Provide honest questions and engage in good faith
• Treat the AI assistant and service with respect

### You Agree NOT To:
• Use the App for any illegal or harmful purposes
• Attempt to hack, reverse engineer, or compromise the App
• Spam, harass, or abuse the service
• Share explicit, offensive, or inappropriate content
• Attempt to manipulate or deceive the AI system
• Use the App to spread misinformation or harmful ideologies
• Violate any applicable laws or regulations

## AI-Generated Content

### Important Disclaimers

**Not Professional Advice**
• AI responses are for educational and informational purposes only
• Not a substitute for professional theological counseling
• Not official church doctrine or authoritative interpretation
• Should not be used for critical spiritual decisions without consultation

**Accuracy and Limitations**
• AI may occasionally provide inaccurate or incomplete information
• Responses reflect general Christian perspectives but may not align with all denominations
• Always verify important information with trusted religious leaders
• Use discernment and cross-reference with Scripture

**Your Responsibility**
• You are responsible for how you use and interpret AI responses
• Consult qualified religious leaders for important spiritual matters
• Verify scriptural references and theological claims
• Apply biblical principles with wisdom and context

## Intellectual Property

### Our Rights
• Iron Faith owns all rights to the App, design, and branding
• The App interface, features, and original content are protected by copyright
• Our trademarks and logos may not be used without permission

### Your Content
• You retain ownership of questions and inputs you provide
• By using the App, you grant us the right to process your queries to provide the service
• We do not claim ownership of your personal notes or conversation history

### Scripture and Religious Texts
• Biblical text and references are public domain or used under appropriate licenses
• Specific translations may have their own copyright protections

## Data and Privacy

Your use of Iron Faith is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand how we collect, use, and protect your data.

## Service Availability

### No Guarantee of Uptime
• We strive to provide reliable service but cannot guarantee 100% availability
• The App may be unavailable due to maintenance, updates, or technical issues
• We are not liable for service interruptions or data loss

### Modifications to Service
• We reserve the right to modify, suspend, or discontinue features
• We may change pricing or introduce subscription fees with notice
• Significant changes will be communicated to users

## Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW:

• Iron Faith is provided "AS IS" without warranties of any kind
• We are not liable for any damages arising from your use of the App
• We are not responsible for decisions made based on AI-generated content
• Our total liability is limited to the amount you paid for the service (if any)

## Indemnification

You agree to indemnify and hold harmless Iron Faith, its developers, and affiliates from any claims, damages, or expenses arising from:
• Your violation of these Terms
• Your misuse of the App
• Your violation of any laws or third-party rights

## Termination

### By You
• You may delete your account at any time through the App settings
• Account deletion will remove your personal data as described in our Privacy Policy

### By Us
• We may suspend or terminate your account for violations of these Terms
• We may terminate accounts that are inactive for extended periods
• We reserve the right to refuse service to anyone for any lawful reason

## Governing Law

These Terms are governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles.

## Dispute Resolution

Any disputes arising from these Terms or your use of Iron Faith will be resolved through:
1. Good faith negotiation
2. Mediation (if negotiation fails)
3. Binding arbitration (if mediation fails)

## Changes to Terms

We may update these Terms from time to time. Changes will be effective when:
• Posted in the App with an updated "Last Updated" date
• Notified to registered users for significant changes
• You continue to use the App after changes are posted

## Severability

If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full effect.

## Entire Agreement

These Terms, together with our Privacy Policy, constitute the entire agreement between you and Iron Faith regarding the use of the App.

## Contact Us

Questions about these Terms? Contact us:

**Email:** support@ironfaith.app
**App:** Use the "Contact Support" option in Settings

## Acknowledgment

By creating an account and using Iron Faith, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.`;

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const { theme } = useSettings();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.text, { color: theme.text }]}>{termsOfServiceContent}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
  },
});
