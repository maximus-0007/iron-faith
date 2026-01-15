import { render, fireEvent } from '../../__tests__/test-utils';
import ChatBubble, { Message } from '../ChatBubble';

const mockMessage: Message = {
  id: '1',
  type: 'user',
  content: 'Hello, how can I grow in faith?',
  timestamp: new Date().toISOString(),
};

const mockAIMessage: Message = {
  id: '2',
  type: 'ai',
  content: 'Growing in faith requires daily prayer and reading Scripture. See John 3:16 for guidance.',
  timestamp: new Date().toISOString(),
};

describe('ChatBubble', () => {
  it('renders user message correctly', () => {
    const { getByText } = render(
      <ChatBubble
        message={mockMessage}
        conversationId="test-conv"
        userId="test-user"
      />
    );

    expect(getByText('Hello, how can I grow in faith?')).toBeTruthy();
  });

  it('renders AI message correctly', () => {
    const { getByText } = render(
      <ChatBubble
        message={mockAIMessage}
        conversationId="test-conv"
        userId="test-user"
      />
    );

    expect(getByText(/Growing in faith requires daily prayer/)).toBeTruthy();
  });

  it('calls onDelete when delete is pressed', () => {
    const onDelete = jest.fn();
    const { getByText } = render(
      <ChatBubble
        message={mockMessage}
        conversationId="test-conv"
        userId="test-user"
        onDelete={onDelete}
      />
    );

    const bubble = getByText('Hello, how can I grow in faith?');
    fireEvent(bubble, 'longPress');
  });

  it('toggles bookmark when bookmark button is pressed', () => {
    const onToggleBookmark = jest.fn();
    const { getByLabelText } = render(
      <ChatBubble
        message={mockAIMessage}
        conversationId="test-conv"
        userId="test-user"
        onToggleBookmark={onToggleBookmark}
        isBookmarked={false}
      />
    );
  });

  it('displays different styles for user vs AI messages', () => {
    const { rerender, getByText } = render(
      <ChatBubble
        message={mockMessage}
        conversationId="test-conv"
        userId="test-user"
      />
    );

    const userBubble = getByText('Hello, how can I grow in faith?');
    expect(userBubble).toBeTruthy();

    rerender(
      <ChatBubble
        message={mockAIMessage}
        conversationId="test-conv"
        userId="test-user"
      />
    );

    const aiBubble = getByText(/Growing in faith requires daily prayer/);
    expect(aiBubble).toBeTruthy();
  });
});
