/**
 * Chat Service
 * Handles all chat-related operations with proper error handling and retry logic
 */

import { supabase } from '@/integrations/supabase/client';
import { Chat, ChatMessage } from '@/types/chat';
import { offlineStorage } from '@/lib/offline-storage';
import { BaseService, handleSupabaseResult, handleSupabaseArrayResult } from './base.service';
import { createAppError, ErrorCode } from '@/lib/error-handling';

class ChatServiceImpl extends BaseService {
  constructor() {
    super('ChatService');
  }

  /**
   * Load all chats for a user with batch-loaded messages (fixes N+1 query pattern)
   */
  async loadChats(userId: string): Promise<Chat[]> {
    return this.executeWithRetry('loadChats', async () => {
      try {
        // Step 1: Load all chats
        const chatsResult = await supabase
          .from('chats')
          .select('*')
          .eq('user_id', userId)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false });

        const chatsData = handleSupabaseArrayResult(chatsResult);

        if (chatsData.length === 0) {
          return [];
        }

        // Step 2: Batch load all messages for all chats in a single query
        const chatIds = chatsData.map(chat => chat.id);
        const messagesResult = await supabase
          .from('messages')
          .select('*')
          .in('chat_id', chatIds)
          .order('created_at', { ascending: true });

        const messagesData = handleSupabaseArrayResult(messagesResult);

        // Step 3: Group messages by chat_id
        const messagesByChatId = new Map<string, ChatMessage[]>();
        for (const msg of messagesData) {
          const chatMessages = messagesByChatId.get(msg.chat_id) || [];
          chatMessages.push({
            id: msg.id,
            type: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at),
          });
          messagesByChatId.set(msg.chat_id, chatMessages);
        }

        // Step 4: Format chats with their messages
        const formattedChats: Chat[] = chatsData.map((chat) => ({
          id: chat.id,
          title: chat.title,
          messages: messagesByChatId.get(chat.id) || [],
          createdAt: new Date(chat.created_at),
          updatedAt: new Date(chat.updated_at),
        }));

        // Cache for offline use
        await offlineStorage.storeChats(formattedChats);
        return formattedChats;
      } catch (_error) {
        this.log('loadChats', 'Falling back to offline storage');
        return await offlineStorage.getChats();
      }
    });
  }

  /**
   * Load messages for a specific chat
   */
  async loadMessages(chatId: string): Promise<ChatMessage[]> {
    return this.executeWithRetry('loadMessages', async () => {
      const result = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      const messagesData = handleSupabaseArrayResult(result);

      return messagesData.map((msg) => ({
        id: msg.id,
        type: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at),
      }));
    });
  }

  /**
   * Batch load messages for multiple chats in a single query
   */
  async loadMessagesForChats(chatIds: string[]): Promise<Map<string, ChatMessage[]>> {
    return this.executeWithRetry('loadMessagesForChats', async () => {
      if (chatIds.length === 0) {
        return new Map();
      }

      const result = await supabase
        .from('messages')
        .select('*')
        .in('chat_id', chatIds)
        .order('created_at', { ascending: true });

      const messagesData = handleSupabaseArrayResult(result);

      const messagesByChatId = new Map<string, ChatMessage[]>();
      for (const msg of messagesData) {
        const chatMessages = messagesByChatId.get(msg.chat_id) || [];
        chatMessages.push({
          id: msg.id,
          type: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at),
        });
        messagesByChatId.set(msg.chat_id, chatMessages);
      }

      return messagesByChatId;
    });
  }

  /**
   * Create a new chat
   */
  async createChat(userId: string, title: string = 'New Chat'): Promise<Chat> {
    return this.executeWithRetry('createChat', async () => {
      const result = await supabase
        .from('chats')
        .insert({ user_id: userId, title })
        .select()
        .single();

      const data = handleSupabaseResult(result);

      return {
        id: data.id,
        title: data.title,
        messages: [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    });
  }

  /**
   * Soft delete a chat (marks as deleted but preserves data)
   */
  async softDeleteChat(chatId: string, userId: string): Promise<void> {
    return this.executeWithRetry('softDeleteChat', async () => {
      const result = await supabase
        .from('chats')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', chatId)
        .eq('user_id', userId)
        .select()
        .single();

      handleSupabaseResult(result);
    });
  }

  /**
   * Restore a soft-deleted chat
   */
  async restoreChat(chatId: string, userId: string): Promise<void> {
    return this.executeWithRetry('restoreChat', async () => {
      const result = await supabase
        .from('chats')
        .update({ deleted_at: null })
        .eq('id', chatId)
        .eq('user_id', userId)
        .select()
        .single();

      handleSupabaseResult(result);
    });
  }

  /**
   * Permanently delete a chat
   */
  async deleteChat(chatId: string, userId: string): Promise<void> {
    return this.executeWithRetry('deleteChat', async () => {
      const result = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId)
        .eq('user_id', userId);

      if (result.error) {
        throw result.error;
      }
    });
  }

  /**
   * Update chat title
   */
  async updateChatTitle(chatId: string, userId: string, title: string): Promise<void> {
    if (!title.trim()) {
      throw createAppError(ErrorCode.VALIDATION, 'Chat title cannot be empty');
    }

    return this.executeWithRetry('updateChatTitle', async () => {
      const result = await supabase
        .from('chats')
        .update({ title: title.trim() })
        .eq('id', chatId)
        .eq('user_id', userId)
        .select()
        .single();

      handleSupabaseResult(result);
    });
  }

  /**
   * Update chat properties (order, title, etc.)
   */
  async updateChat(
    chatId: string,
    userId: string,
    updates: { order_index?: number; title?: string }
  ): Promise<void> {
    return this.executeWithRetry('updateChat', async () => {
      const result = await supabase
        .from('chats')
        .update(updates)
        .eq('id', chatId)
        .eq('user_id', userId)
        .select()
        .single();

      handleSupabaseResult(result);
    });
  }

  /**
   * Send a message to the AI and get a response
   */
  async sendMessageToAPI(message: string, chatId: string): Promise<string> {
    if (!message.trim()) {
      throw createAppError(ErrorCode.VALIDATION, 'Message cannot be empty');
    }

    return this.executeWithRetry('sendMessageToAPI', async () => {
      const { data, error } = await supabase.functions.invoke('chat-with-tessa-secure', {
        body: { message: message.trim(), chatId },
      });

      if (error) {
        throw createAppError(
          ErrorCode.SERVICE_UNAVAILABLE,
          'AI service temporarily unavailable',
          { originalError: error }
        );
      }

      if (!data?.message) {
        throw createAppError(ErrorCode.SERVICE_UNAVAILABLE, 'No response from AI');
      }

      return data.message;
    });
  }

  /**
   * Save a message to the database
   */
  async saveMessage(
    chatId: string,
    content: string,
    role: 'user' | 'assistant'
  ): Promise<ChatMessage> {
    return this.executeWithRetry('saveMessage', async () => {
      const userId = await this.getCurrentUserId();
      const result = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          user_id: userId,
          content,
          role,
        })
        .select()
        .single();

      const data = handleSupabaseResult(result);

      return {
        id: data.id,
        type: data.role as 'user' | 'assistant',
        content: data.content,
        timestamp: new Date(data.created_at),
      };
    });
  }

  /**
   * Bulk soft delete chats
   */
  async bulkSoftDelete(chatIds: string[], userId: string): Promise<void> {
    return this.executeWithRetry('bulkSoftDelete', async () => {
      const result = await supabase
        .from('chats')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', chatIds)
        .eq('user_id', userId);

      if (result.error) {
        throw result.error;
      }
    });
  }

  /**
   * Bulk restore chats
   */
  async bulkRestore(chatIds: string[], userId: string): Promise<void> {
    return this.executeWithRetry('bulkRestore', async () => {
      const result = await supabase
        .from('chats')
        .update({ deleted_at: null })
        .in('id', chatIds)
        .eq('user_id', userId);

      if (result.error) {
        throw result.error;
      }
    });
  }
}

// Export singleton instance
export const ChatService = new ChatServiceImpl();

// Also export the class for testing
export { ChatServiceImpl };
