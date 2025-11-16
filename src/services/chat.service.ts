import { supabase } from '@/integrations/supabase/client';
import { Chat, ChatMessage } from '@/types/chat';
import { offlineStorage } from '@/lib/offline-storage';

export class ChatService {
  static async loadChats(userId: string): Promise<Chat[]> {
    try {
      const { data: chatsData, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const formattedChats: Chat[] = await Promise.all(
        chatsData.map(async (chat) => {
          const messages = await this.loadMessages(chat.id);
          return {
            id: chat.id,
            title: chat.title,
            messages,
            createdAt: new Date(chat.created_at),
            updatedAt: new Date(chat.updated_at)
          };
        })
      );

      // Store in offline cache
      await offlineStorage.storeChats(formattedChats);
      return formattedChats;
    } catch (error) {
      console.error('Error loading chats:', error);
      // Try to load from offline storage
      return await offlineStorage.getChats();
    }
  }

  static async loadMessages(chatId: string): Promise<ChatMessage[]> {
    const { data: messagesData, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return messagesData.map(msg => ({
      id: msg.id,
      type: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: new Date(msg.created_at)
    }));
  }

  static async createChat(userId: string, title: string = 'New Chat'): Promise<Chat> {
    const { data, error } = await supabase
      .from('chats')
      .insert({ user_id: userId, title })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      messages: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  static async deleteChat(chatId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  static async updateChatTitle(chatId: string, userId: string, title: string): Promise<void> {
    const { error } = await supabase
      .from('chats')
      .update({ title })
      .eq('id', chatId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  static async updateChat(chatId: string, userId: string, updates: { order_index?: number; title?: string }): Promise<void> {
    const { error } = await supabase
      .from('chats')
      .update(updates)
      .eq('id', chatId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  static async sendMessageToAPI(message: string, chatId: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke('chat-with-tessa-secure', {
      body: { message, chatId }
    });

    if (error) throw error;
    if (!data?.message) throw new Error('No response from AI');

    return data.message;
  }
}
