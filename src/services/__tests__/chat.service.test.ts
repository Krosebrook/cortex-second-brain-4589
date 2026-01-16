import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from '../chat.service';
import { supabase } from '@/integrations/supabase/client';
import { offlineStorage } from '@/lib/offline-storage';

// Mock dependencies
vi.mock('@/integrations/supabase/client');
vi.mock('@/lib/offline-storage');

describe('ChatService', () => {
  const mockUserId = 'user-123';
  const mockChatId = 'chat-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadChats', () => {
    it('should load chats from Supabase and cache them', async () => {
      const mockChatsData = [
        {
          id: 'chat-1',
          title: 'Test Chat',
          user_id: mockUserId,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

// Mock messages data reserved for future tests

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockChatsData, error: null }),
      } as any);

      // Mock loadMessages
      vi.spyOn(ChatService, 'loadMessages').mockResolvedValue([
        {
          id: 'msg-1',
          type: 'user',
          content: 'Hello',
          timestamp: new Date('2024-01-01T00:00:00Z'),
        },
      ]);

      vi.mocked(offlineStorage.storeChats).mockResolvedValue(undefined);

      const result = await ChatService.loadChats(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Chat');
      expect(result[0].messages).toHaveLength(1);
      expect(offlineStorage.storeChats).toHaveBeenCalledWith(result);
    });

    it('should fallback to offline storage on error', async () => {
      const mockOfflineChats = [
        {
          id: 'chat-1',
          title: 'Offline Chat',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('Network error') }),
      } as any);

      vi.mocked(offlineStorage.getChats).mockResolvedValue(mockOfflineChats);

      const result = await ChatService.loadChats(mockUserId);

      expect(result).toEqual(mockOfflineChats);
      expect(offlineStorage.getChats).toHaveBeenCalled();
    });
  });

  describe('loadMessages', () => {
    it('should load messages for a chat', async () => {
      const mockMessagesData = [
        {
          id: 'msg-1',
          chat_id: mockChatId,
          role: 'user',
          content: 'Hello',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'msg-2',
          chat_id: mockChatId,
          role: 'assistant',
          content: 'Hi there!',
          created_at: '2024-01-01T00:01:00Z',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockMessagesData, error: null }),
      } as any);

      const result = await ChatService.loadMessages(mockChatId);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('user');
      expect(result[1].type).toBe('assistant');
    });

    it('should throw error if Supabase fails', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
      } as any);

      await expect(ChatService.loadMessages(mockChatId)).rejects.toThrow('DB error');
    });
  });

  describe('createChat', () => {
    it('should create a new chat', async () => {
      const mockChatData = {
        id: 'chat-new',
        title: 'New Chat',
        user_id: mockUserId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockChatData, error: null }),
      } as any);

      const result = await ChatService.createChat(mockUserId, 'New Chat');

      expect(result.title).toBe('New Chat');
      expect(result.messages).toEqual([]);
    });

    it('should use default title if not provided', async () => {
      const mockChatData = {
        id: 'chat-new',
        title: 'New Chat',
        user_id: mockUserId,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockChatData, error: null }),
      } as any);

      await ChatService.createChat(mockUserId);

      expect(supabase.from('chats').insert).toHaveBeenCalledWith({
        user_id: mockUserId,
        title: 'New Chat',
      });
    });
  });

  describe('deleteChat', () => {
    it('should delete a chat', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      } as any);

      const mockDelete = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from('chats').delete().eq).mockImplementation(mockDelete as any);

      await ChatService.deleteChat(mockChatId, mockUserId);

      expect(supabase.from).toHaveBeenCalledWith('chats');
    });
  });

  describe('updateChatTitle', () => {
    it('should update chat title', async () => {
      const newTitle = 'Updated Title';

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      } as any);

      const mockUpdate = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from('chats').update({ title: newTitle }).eq).mockImplementation(mockUpdate as any);

      await ChatService.updateChatTitle(mockChatId, mockUserId, newTitle);

      expect(supabase.from).toHaveBeenCalledWith('chats');
    });
  });

  describe('sendMessageToAPI', () => {
    it('should send message and receive response', async () => {
      const mockResponse = { message: 'AI response' };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResponse,
        error: null,
      } as any);

      const result = await ChatService.sendMessageToAPI('Hello', mockChatId);

      expect(result).toBe('AI response');
      expect(supabase.functions.invoke).toHaveBeenCalledWith('chat-with-tessa-secure', {
        body: { message: 'Hello', chatId: mockChatId },
      });
    });

    it('should throw error if no response from AI', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {},
        error: null,
      } as any);

      await expect(ChatService.sendMessageToAPI('Hello', mockChatId)).rejects.toThrow(
        'No response from AI'
      );
    });
  });
});
