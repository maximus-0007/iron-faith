import { Settings } from './settings';
import { supabase } from './supabase';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  answer: string;
  timestamp: string;
}

interface IntakeProfile {
  relationship_status: string | null;
  has_children: boolean | null;
  career_stage: string | null;
  spiritual_struggles: string[] | null;
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      if (error.status === 429 || error.code === 'MESSAGE_LIMIT_REACHED') {
        throw error;
      }

      if (error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

export async function sendChatMessage(
  question: string,
  conversationHistory?: ChatMessage[],
  settings?: Settings,
  onChunk?: (chunk: string) => void,
  intakeProfile?: IntakeProfile | null,
  conversationId?: string
): Promise<ChatResponse> {
  return retryWithBackoff(async () => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      const error: any = new Error('Unable to connect. Please try again later.');
      error.status = 500;
      throw error;
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      const error: any = new Error('Your session has expired. Please sign in again.');
      error.status = 401;
      throw error;
    }

    const apiUrl = `${supabaseUrl}/functions/v1/bibleChat`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        conversationHistory,
        preferences: settings ? {
          responseLength: settings.responseLength,
          includeScriptureReferences: settings.includeScriptureReferences,
          askClarifyingQuestions: settings.askClarifyingQuestions,
        } : undefined,
        userProfile: settings && (settings.name || settings.about) ? {
          name: settings.name,
          about: settings.about,
        } : undefined,
        intakeProfile: intakeProfile || undefined,
        conversationId: conversationId || undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unable to process your request' }));

      let userMessage = 'Unable to send your message. Please try again.';

      if (response.status === 429) {
        userMessage = 'You have reached your message limit. Please upgrade to continue.';
      } else if (response.status === 401 || response.status === 403) {
        userMessage = 'Your session has expired. Please sign in again.';
      } else if (response.status >= 500) {
        userMessage = 'Our servers are experiencing issues. Please try again in a moment.';
      } else if (error.error === 'MESSAGE_LIMIT_REACHED') {
        userMessage = 'You have reached your daily message limit. Upgrade to Premium for unlimited messages.';
      }

      const err: any = new Error(userMessage);
      err.code = error.error;
      err.status = response.status;
      throw err;
    }

    if (onChunk && response.body) {
      let fullAnswer = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine === '' || !trimmedLine.startsWith('data: ')) continue;

            try {
              const jsonStr = trimmedLine.substring(6);
              const data = JSON.parse(jsonStr);

              if (data.content) {
                fullAnswer += data.content;
                onChunk(data.content);
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      } catch (error) {
        console.error('Stream reading error:', error);
        throw error;
      }

      return {
        answer: fullAnswer,
        timestamp: new Date().toISOString(),
      };
    }

    return response.json();
  });
}
