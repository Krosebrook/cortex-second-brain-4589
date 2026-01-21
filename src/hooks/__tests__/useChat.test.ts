/**
 * Unit tests for useChat hook
 * Tests chat management, message sending, and offline handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChat } from '../useChat';
import { ChatService } from '@/services/chat.service';
import type { Chat } from '@/types/chat';

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id' },
  })),
}));

vi.mock('@/contexts/OfflineContext', () => ({
  useOffline: vi.fn(() => ({
    isOnline: true,
  })),
}));

vi.mock('@/components/feedback/ConfirmationProvider', () => ({
  useConfirmationDialog: vi.fn(() => ({
    confirm: vi.fn(({ onConfirm }) => onConfirm()),
  })),
}));

vi.mock('@/components/feedback/EnhancedToast', () => ({
  enhancedToast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/services/chat.service', () => ({
  ChatService: {
    loadChats: vi.fn(),
    createChat: vi.fn(),
    updateChatTitle: vi.fn(),
    softDeleteChat: vi.fn(),
    restoreChat: vi.fn(),
    bulkSoftDelete: vi.fn(),
    bulkRestore: vi.fn(),
    updateChat: vi.fn(),
    sendMessageToAPI: vi.fn(),
  },
}));

const mockChats: Chat[] = [
  {
    id: 'chat-1',
    title: 'Test Chat 1',
    messages: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: 'chat-2',
    title: 'Test Chat 2',
    messages: [{ id: 'msg-1', type: 'user', content: 'Hello', timestamp: new Date() }],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ChatService.loadChats).mockResolvedValue(mockChats);
  });

  describe('Initialization', () => {
    it('should load chats on mount', async () => {
      const { result } = renderHook(() => useChat());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(ChatService.loadChats).toHaveBeenCalledWith('test-user-id');
      expect(result.current.chats).toHaveLength(2);
    });

    it('should set first chat as active by default', async () => {
      const { result } = renderHook(() => useChat());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.activeChat).not.toBeNull();
    });

    it('should handle empty chat list', async () => {
      vi.mocked(ChatService.loadChats).mockResolvedValue([]);

      const { result } = renderHook(() => useChat());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.chats).toHaveLength(0);
      expect(result.current.activeChat).toBeNull();
    });
  });

  describe('setActiveChat', () => {
    it('should update active chat', async () => {
      const { result } = renderHook(() => useChat());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setActiveChat(mockChats[1]);
      });

      expect(result.current.activeChat?.id).toBe('chat-2');
    });

    it('should allow setting active chat to null', async () => {
      const { result } = renderHook(() => useChat());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setActiveChat(null);
      });

      expect(result.current.activeChat).toBeNull();
    });
  });

  describe('createNewChat', () => {
    it('should create a new chat', async () => {
      const newChat: Chat = {
        id: 'new-chat',
        title: 'New Conversation',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(ChatService.createChat).mockResolvedValue(newChat);

      const { result } = renderHook(() => useChat());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdChat: Chat | null = null;
      await act(async () => {
        createdChat = await result.current.createNewChat();
      });

      expect(createdChat).toEqual(newChat);
      expect(result.current.activeChat?.id).toBe('new-chat');
      expect(result.current.chats).toContainEqual(newChat);
    });

    it('should not create chat when offline', async () => {
      const { useOffline } = await import('@/contexts/OfflineContext');
      vi.mocked(useOffline).mockReturnValue({ isOnline: false } as ReturnType<typeof useOffline>);

      const { result } = renderHook(() => useChat());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdChat: Chat | null = null;
      await act(async () => {
        createdChat = await result.current.createNewChat();
      });

      expect(createdChat).toBeNull();
      expect(ChatService.createChat).not.toHaveBeenCalled();

      // Reset mock
      vi.mocked(useOffline).mockReturnValue({ isOnline: true } as ReturnType<typeof useOffline>);
    });
  });

  describe('softDeleteChat', () => {
    it('should soft delete a chat', async () => {
      vi.mocked(ChatService.softDeleteChat).mockResolvedValue(undefined);
      vi.mocked(ChatService.loadChats).mockResolvedValue([mockChats[1]]);

      const { result } = renderHook(() => useChat());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.softDeleteChat('chat-1');
      });

      expect(ChatService.softDeleteChat).toHaveBeenCalledWith('chat-1', 'test-user-id');
    });
  });

  describe('updateChatTitle', () => {
    it('should update chat title', async () => {
      vi.mocked(ChatService.updateChatTitle).mockResolvedValue(undefined);

      const { result } = renderHook(() => useChat());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateChatTitle('chat-1', 'Updated Title');
      });

      expect(ChatService.updateChatTitle).toHaveBeenCalledWith('chat-1', 'test-user-id', 'Updated Title');
      expect(result.current.chats.find(c => c.id === 'chat-1')?.title).toBe('Updated Title');
    });

    it('should not update title when offline', async () => {
      const { useOffline } = await import('@/contexts/OfflineContext');
      vi.mocked(useOffline).mockReturnValue({ isOnline: false } as ReturnType<typeof useOffline>);

      const { result } = renderHook(() => useChat());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateChatTitle('chat-1', 'Updated Title');
      });

      expect(ChatService.updateChatTitle).not.toHaveBeenCalled();

      vi.mocked(useOffline).mockReturnValue({ isOnline: true } as ReturnType<typeof useOffline>);
    });
  });

  describe('sendMessage', () => {
    it('should send a message and receive AI response', async () => {
      vi.mocked(ChatService.sendMessageToAPI).mockResolvedValue('AI response');

      const { result } = renderHook(() => useChat());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Set active chat
      act(() => {
        result.current.setActiveChat(mockChats[0]);
      });

      await act(async () => {
        await result.current.sendMessage('Hello AI');
      });

      expect(ChatService.sendMessageToAPI).toHaveBeenCalledWith('Hello AI', 'chat-1');
      expect(result.current.activeChat?.messages).toHaveLength(2);
      expect(result.current.activeChat?.messages[0].type).toBe('user');
      expect(result.current.activeChat?.messages[1].type).toBe('assistant');
    });

    it('should not send empty messages', async () => {
      const { result } = renderHook(() => useChat());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setActiveChat(mockChats[0]);
      });

      await act(async () => {
        await result.current.sendMessage('   ');
      });

      expect(ChatService.sendMessageToAPI).not.toHaveBeenCalled();
    });

    it('should not send when no active chat', async () => {
      const { result } = renderHook(() => useChat());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setActiveChat(null);
      });

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(ChatService.sendMessageToAPI).not.toHaveBeenCalled();
    });

    it('should not send when offline', async () => {
      const { useOffline } = await import('@/contexts/OfflineContext');
      vi.mocked(useOffline).mockReturnValue({ isOnline: false } as ReturnType<typeof useOffline>);

      const { result } = renderHook(() => useChat());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setActiveChat(mockChats[0]);
      });

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(ChatService.sendMessageToAPI).not.toHaveBeenCalled();

      vi.mocked(useOffline).mockReturnValue({ isOnline: true } as ReturnType<typeof useOffline>);
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(ChatService.sendMessageToAPI).mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => useChat());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setActiveChat(mockChats[0]);
      });

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      // Should have added user message but not AI response
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('Bulk Operations', () => {
    it('should soft delete multiple chats', async () => {
      vi.mocked(ChatService.bulkSoftDelete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useChat());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.softDeleteBulkChats(['chat-1', 'chat-2']);
      });

      expect(ChatService.bulkSoftDelete).toHaveBeenCalledWith(['chat-1', 'chat-2'], 'test-user-id');
    });

    it('should restore multiple chats', async () => {
      vi.mocked(ChatService.bulkRestore).mockResolvedValue(undefined);

      const { result } = renderHook(() => useChat());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.restoreBulkChats(['chat-1', 'chat-2']);
      });

      expect(ChatService.bulkRestore).toHaveBeenCalledWith(['chat-1', 'chat-2'], 'test-user-id');
    });
  });

  describe('updateChatOrder', () => {
    it('should update chat order', async () => {
      vi.mocked(ChatService.updateChat).mockResolvedValue(undefined);

      const { result } = renderHook(() => useChat());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateChatOrder([
          { id: 'chat-2', order_index: 0 },
          { id: 'chat-1', order_index: 1 },
        ]);
      });

      expect(ChatService.updateChat).toHaveBeenCalledTimes(2);
    });
  });

  describe('No User', () => {
    it('should clear chats when user is null', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: null } as ReturnType<typeof useAuth>);

      const { result } = renderHook(() => useChat());

      expect(result.current.chats).toHaveLength(0);
      expect(result.current.activeChat).toBeNull();

      vi.mocked(useAuth).mockReturnValue({ user: { id: 'test-user-id' } } as ReturnType<typeof useAuth>);
    });
  });
});
