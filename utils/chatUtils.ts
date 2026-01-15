import { Message } from '../components/ChatBubble';

export type ListItem = Message | { type: 'date'; id: string; date: string };

export function isSameDay(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}

export function insertDateSeparators(messages: Message[]): ListItem[] {
  if (messages.length === 0) return [];

  const result: ListItem[] = [];
  let lastDate: string | null = null;

  messages.forEach((message) => {
    if (!lastDate || !isSameDay(lastDate, message.timestamp)) {
      result.push({
        type: 'date',
        id: `date-${message.timestamp}`,
        date: message.timestamp,
      });
      lastDate = message.timestamp;
    }
    result.push(message);
  });

  return result;
}
