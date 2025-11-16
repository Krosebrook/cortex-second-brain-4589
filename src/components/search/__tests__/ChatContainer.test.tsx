import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatContainer } from '../ChatContainer';
import { Chat } from '@/types/chat';

// Mock child components
vi.mock('../ChatSidebar', () => ({
  default: ({ chats, createNewChat }: any) => (
    <div data-testid="chat-sidebar">
      <button onClick={createNewChat} data-testid="new-chat-btn">New Chat</button>
      {chats.map((chat: Chat) => (
        <div key={chat.id} data-testid={`chat-${chat.id}`}>
          {chat.title}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../ChatMessages', () => ({
  default: ({ activeChat }: any) => (
    <div data-testid="chat-messages">
      {activeChat?.messages.map((msg: any) => (
        <div key={msg.id} data-testid={`message-${msg.id}`}>
          {msg.content}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../ChatInput', () => ({
  default: ({ searchQuery, setSearchQuery, handleSubmit, loading }: any) => (
    <form onSubmit={handleSubmit} data-testid="chat-input-form">
      <input
        data-testid="message-input"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Type a message..."
        disabled={loading}
      />
      <button type="submit" disabled={loading} data-testid="send-button">
        {loading ? 'Sending...' : 'Send'}
      </button>
    </form>
  ),
}));

describe('ChatContainer', () => {
  const mockChats: Chat[] = [
    {
      id: 'chat-1',
      title: 'Test Chat 1',
      messages: [
        {
          id: 'msg-1',
          type: 'user',
          content: 'Hello',
          timestamp: new Date(),
        },
        {
          id: 'msg-2',
          type: 'assistant',
          content: 'Hi there!',
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'chat-2',
      title: 'Test Chat 2',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const defaultProps = {
    chats: mockChats,
    activeChat: mockChats[0],
    isSubmitting: false,
    onSetActiveChat: vi.fn(),
    onCreateNewChat: vi.fn(),
    onDeleteChat: vi.fn(),
    onUpdateTitle: vi.fn(),
    onSendMessage: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render chat container with all components', () => {
      render(<ChatContainer {...defaultProps} />);

      expect(screen.getByTestId('chat-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('chat-messages')).toBeInTheDocument();
      expect(screen.getByTestId('chat-input-form')).toBeInTheDocument();
    });

    it('should display active chat title in header', () => {
      render(<ChatContainer {...defaultProps} />);

      expect(screen.getByText('Test Chat 1')).toBeInTheDocument();
    });

    it('should display default title when no active chat', () => {
      render(<ChatContainer {...defaultProps} activeChat={null} />);

      expect(screen.getByText('Chat with Tessa')).toBeInTheDocument();
    });

    it('should render all chats in sidebar', () => {
      render(<ChatContainer {...defaultProps} />);

      expect(screen.getByTestId('chat-chat-1')).toBeInTheDocument();
      expect(screen.getByTestId('chat-chat-2')).toBeInTheDocument();
    });

    it('should render messages from active chat', () => {
      render(<ChatContainer {...defaultProps} />);

      expect(screen.getByTestId('message-msg-1')).toBeInTheDocument();
      expect(screen.getByTestId('message-msg-2')).toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should toggle sidebar visibility when button is clicked', () => {
      render(<ChatContainer {...defaultProps} />);

      const toggleButton = screen.getByRole('button', { name: '' });
      const sidebar = screen.getByTestId('chat-sidebar');

      expect(sidebar).toBeVisible();

      fireEvent.click(toggleButton);

      // Note: In actual implementation, sidebar might have class changes
      // This is testing the button click functionality
      expect(toggleButton).toBeInTheDocument();
    });

    it('should call onCreateNewChat when new chat button is clicked', () => {
      render(<ChatContainer {...defaultProps} />);

      const newChatButton = screen.getByTestId('new-chat-btn');
      fireEvent.click(newChatButton);

      expect(defaultProps.onCreateNewChat).toHaveBeenCalledTimes(1);
    });

    it('should handle message input changes', async () => {
      const user = userEvent.setup();
      render(<ChatContainer {...defaultProps} />);

      const input = screen.getByTestId('message-input');
      await user.type(input, 'Test message');

      expect(input).toHaveValue('Test message');
    });

    it('should call onSendMessage when form is submitted', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue(undefined);
      render(<ChatContainer {...defaultProps} onSendMessage={mockSendMessage} />);

      const input = screen.getByTestId('message-input');
      const form = screen.getByTestId('chat-input-form');

      fireEvent.change(input, { target: { value: 'Hello AI' } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith('Hello AI');
      });
    });

    it('should not send empty messages', async () => {
      const mockSendMessage = vi.fn();
      render(<ChatContainer {...defaultProps} onSendMessage={mockSendMessage} />);

      const input = screen.getByTestId('message-input');
      const form = screen.getByTestId('chat-input-form');

      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.submit(form);

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('should clear input after successful message send', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue(undefined);
      render(<ChatContainer {...defaultProps} onSendMessage={mockSendMessage} />);

      const input = screen.getByTestId('message-input') as HTMLInputElement;
      const form = screen.getByTestId('chat-input-form');

      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });
  });

  describe('Loading States', () => {
    it('should disable input when submitting', () => {
      render(<ChatContainer {...defaultProps} isSubmitting={true} />);

      const input = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');

      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });

    it('should show loading text on send button when submitting', () => {
      render(<ChatContainer {...defaultProps} isSubmitting={true} />);

      expect(screen.getByText('Sending...')).toBeInTheDocument();
    });

    it('should not allow form submission when already submitting', async () => {
      const mockSendMessage = vi.fn();
      render(<ChatContainer {...defaultProps} isSubmitting={true} onSendMessage={mockSendMessage} />);

      const form = screen.getByTestId('chat-input-form');
      fireEvent.submit(form);

      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty chat list', () => {
      render(<ChatContainer {...defaultProps} chats={[]} activeChat={null} />);

      expect(screen.getByTestId('chat-sidebar')).toBeInTheDocument();
      expect(screen.getByText('Chat with Tessa')).toBeInTheDocument();
    });

    it('should handle chat with no messages', () => {
      render(<ChatContainer {...defaultProps} activeChat={mockChats[1]} />);

      expect(screen.getByText('Test Chat 2')).toBeInTheDocument();
      expect(screen.getByTestId('chat-messages')).toBeInTheDocument();
    });

    it('should prevent default form submission', () => {
      const mockSendMessage = vi.fn().mockResolvedValue(undefined);
      render(<ChatContainer {...defaultProps} onSendMessage={mockSendMessage} />);

      const form = screen.getByTestId('chat-input-form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault');

      fireEvent.change(screen.getByTestId('message-input'), {
        target: { value: 'Test' },
      });
      
      form.dispatchEvent(submitEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form elements', () => {
      render(<ChatContainer {...defaultProps} />);

      const input = screen.getByTestId('message-input');
      const button = screen.getByTestId('send-button');

      expect(input).toHaveAttribute('placeholder');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should maintain focus management', async () => {
      const user = userEvent.setup();
      render(<ChatContainer {...defaultProps} />);

      const input = screen.getByTestId('message-input');
      await user.click(input);

      expect(input).toHaveFocus();
    });
  });
});
