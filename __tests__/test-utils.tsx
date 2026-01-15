import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { SettingsProvider } from '../utils/settings';
import { AuthProvider } from '../utils/AuthContext';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <SettingsProvider>
        {children}
      </SettingsProvider>
    </AuthProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react-native';
export { customRender as render };

export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00.000Z',
};

export const mockMessage = {
  id: '1',
  type: 'user' as const,
  content: 'Test message',
  timestamp: new Date().toISOString(),
};

export const mockConversation = {
  id: 'conv-1',
  user_id: 'test-user-id',
  title: 'Test Conversation',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));
