import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from '../useChat';
import { ChatService } from '@/services/chat.service';
import { useAuth } from '@/contexts/AuthContext';
import { useOffline } from '@/contexts/OfflineContext';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
vi.mock('@/services/chat.service');
vi.mock('@/contexts/AuthContext');
vi.mock('@/contexts/OfflineContext');
vi.mock('@/hooks/use-toast');

describe('useChat', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockToast = vi.fn();

  const mockChats = [
    {
      id: 'chat-1',
      title: 'Test Chat 1',
      messages: [],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'chat-2',
      title: 'Test Chat 2',
      messages: [
        {
          id: 'msg-1',
          type: 'user' as const,
          content: 'Hello',
          timestamp: new Date('2024-01-01'),
        },
      ],
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
    vi.mocked(useOffline).mockReturnValue({ isOnline: true } as any);
    vi.mocked(useToast).mockReturnValue({ toast: mockToast } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Load', () => {
    it('should initialize with empty chats and loading state', () => {
      vi.mocked(ChatService.loadChats).mockImplementation(() => new Promise(() => {}));
      
      const { result } = renderHook(() => useChat());

      expect(result.current.chats).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.activeChat).toBeNull();
    });

    it('should load chats when user is authenticated', async () => {
      vi.mocked(ChatService.loadChats).mockResolvedValue(mockChats);

      const { result } = renderHook(() => useChat());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.chats).toHaveLength(2);
      expect(result.current.activeChat).toEqual(mockChats[0]);
      expect(ChatService.loadChats).toHaveBeenCalledWith(mockUser.id);
    });

    it('should not load chats when user is not authenticated', async () => {
      vi.mocked(useAuth).mockReturnValue({ user: null } as any);

      renderHook(() => useChat());

      await vi.waitFor(() => {
        expect(ChatService.loadChats).not.toHaveBeenCalled();
      });
    });

    it('should handle errors when loading chats', async () => {
      vi.mocked(ChatService.loadChats).mockRejectedValue(new Error('Load failed'));

      const { result } = renderHook(() => useChat());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          variant: 'destructive',
        })
      );
    });
  });

  describe('Create Chat', () => {
    it('should create a new chat when online', async () => {
      const newChat = {
        id: 'chat-new',
        title: 'New Chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(ChatService.loadChats).mockResolvedValue(mockChats);
      vi.mocked(ChatService.createChat).mockResolvedValue(newChat);

      const { result } = renderHook(() => useChat());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdChat;
      await act(async () => {
        createdChat = await result.current.createNewChat();
      });

      expect(createdChat).toEqual(newChat);
      expect(result.current.chats).toHaveLength(3);
      expect(result.current.chats[0]).toEqual(newChat);
      expect(result.current.activeChat).toEqual(newChat);
    });

    it('should not create chat when offline', async () => {
      vi.mocked(useOffline).mockReturnValue({ isOnline: false } as any);
      vi.mocked(ChatService.loadChats).mockResolvedValue(mockChats);

      const { result } = renderHook(() => useChat());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdChat;
      await act(async () => {
        createdChat = await result.current.createNewChat();
      });

      expect(createdChat).toBeNull();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Offline',
          description: 'Cannot create new chats while offline',
        })
      );
    });

    it('should handle errors when creating chat', async () => {
      vi.mocked(ChatService.loadChats).mockResolvedValue(mockChats);
      vi.mocked(ChatService.createChat).mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useChat());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdChat;
      await act(async () => {
        createdChat = await result.current.createNewChat();
      });

      expect(createdChat).toBeNull();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          variant: 'destructive',
        })
      );
    });
  });

  describe('Delete Chat', () => {
    it('should delete a chat when online', async () => {
      vi.mocked(ChatService.loadChats).mockResolvedValue(mockChats);
      vi.mocked(ChatService.deleteChat).mockResolvedValue(undefined);

      const { result } = renderHook(() => useChat());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteChat('chat-1');
      });

      expect(result.current.chats).toHaveLength(1);
      expect(result.current.chats[0].id).toBe('chat-2');
      expect(result.current.activeChat?.id).toBe('chat-2');
    });

    it('should not delete chat when offline', async () => {
      vi.mocked(useOffline).mockReturnValue({ isOnline: false } as any);
      vi.mocked(ChatService.loadChats).mockResolvedValue(mockChats);

      const { result } = renderHook(() => useChat());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteChat('chat-1');
      });

      expect(result.current.chats).toHaveLength(2);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Offline',
        })
      );
    });

    it('should update active chat when deleting current chat', async () => {
      vi.mocked(ChatService.loadChats).mockResolvedValue(mockChats);
      vi.mocked(ChatService.deleteChat).mockResolvedValue(undefined);

      const { result } = renderHook(() => useChat());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Active chat is chat-1 by default
      expect(result.current.activeChat?.id).toBe('chat-1');

      await act(async () => {
        await result.current.deleteChat('chat-1');
      });

      expect(result.current.activeChat?.id).toBe('chat-2');
    });
  });

  describe('Update Chat Title', () => {
    it('should update chat title when online', async () => {
      vi.mocked(ChatService.loadChats).mockResolvedValue(mockChats);
      vi.mocked(ChatService.updateChatTitle).mockResolvedValue(undefined);

      const { result } = renderHook(() => useChat());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.updateChatTitle('chat-1', 'Updated Title');
      });

      const updatedChat = result.current.chats.find(c => c.id === 'chat-1');
      expect(updatedChat?.title).toBe('Updated Title');
      expect(result.current.activeChat?.title).toBe('Updated Title');
    });

    it('should not update title when offline', async () => {
      vi.mocked(useOffline).mockReturnValue({ isOnline: false } as any);
      vi.mocked(ChatService.loadChats).mockResolvedValue(mockChats);

      const { result } = renderHook(() => useChat());

      await vi.waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.sendMessage('Hello AI');
      });

      const activeChat = result.current.activeChat;
      expect(activeChat?.messages).toHaveLength(2);
      expect(activeChat?.messages[0].type).toBe('user');
      expect(activeChat?.messages[0].content).toBe('Hello AI');
      expect(activeChat?.messages[1].type).toBe('assistant');
      expect(activeChat?.messages[1].content).toBe(mockResponse);
    });

    it('should handle rate limiting', async () => {
      vi.mocked(ChatService.loadChats).mockResolvedValue(mockChats);

      const { result } = renderHook(() => useChat());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Send multiple messages rapidly
      for (let i = 0; i < 25; i++) {
        await act(async () => {
          await result.current.sendMessage('Message ' + i);
        });
      }

      // Should have been rate limited
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Rate Limit',
        })
      );
    });
  });
});
