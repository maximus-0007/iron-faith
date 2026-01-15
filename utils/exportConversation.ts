import { Message } from '../components/ChatBubble';
import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export function formatConversationAsText(messages: Message[], title?: string): string {
  const header = title ? `${title}\n${'='.repeat(title.length)}\n\n` : 'Conversation Export\n==================\n\n';

  const formattedMessages = messages.map((message) => {
    const timestamp = new Date(message.timestamp).toLocaleString();
    const speaker = message.type === 'user' ? 'You' : 'Iron Faith AI';
    const separator = '-'.repeat(50);

    return `${separator}\n${speaker} (${timestamp})\n${separator}\n${message.content}\n\n`;
  }).join('');

  const footer = `\n${'='.repeat(50)}\nExported from Iron Faith\n${new Date().toLocaleString()}`;

  return header + formattedMessages + footer;
}

export function formatConversationAsMarkdown(messages: Message[], title?: string): string {
  const header = title ? `# ${title}\n\n` : '# Conversation Export\n\n';

  const formattedMessages = messages.map((message) => {
    const timestamp = new Date(message.timestamp).toLocaleString();
    const speaker = message.type === 'user' ? '**You**' : '**Iron Faith AI**';

    return `### ${speaker}\n*${timestamp}*\n\n${message.content}\n\n---\n\n`;
  }).join('');

  const footer = `\n*Exported from Iron Faith on ${new Date().toLocaleString()}*`;

  return header + formattedMessages + footer;
}

export async function exportConversation(
  messages: Message[],
  format: 'text' | 'markdown',
  title?: string
): Promise<void> {
  const content = format === 'markdown'
    ? formatConversationAsMarkdown(messages, title)
    : formatConversationAsText(messages, title);

  try {
    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(content);
      alert('Conversation copied to clipboard!');
    } else {
      await Share.share({
        message: content,
        title: title || 'Iron Faith Conversation',
      });
    }
  } catch (error) {
    console.error('Error exporting conversation:', error);
    throw error;
  }
}
