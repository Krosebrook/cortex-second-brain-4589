import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Chat, ChatMessage } from '@/types/chat';
import { generateId } from '@/utils/chatUtils';
import { useToast } from '@/hooks/use-toast';

export const useChat = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load chats from database
  const loadChats = async () => {
    if (!user) return;
    
    try {
      const { data: chatsData, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Convert database format to Chat type
      const formattedChats: Chat[] = await Promise.all(
        chatsData.map(async (chat) => {
          const { data: messagesData, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: true });

          if (messagesError) throw messagesError;

          const messages: ChatMessage[] = messagesData.map(msg => ({
            id: msg.id,
            type: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at)
          }));

          return {
            id: chat.id,
            title: chat.title,
            messages,
            createdAt: new Date(chat.created_at),
            updatedAt: new Date(chat.updated_at)
          };
        })
      );

      setChats(formattedChats);
      
      // Set first chat as active if none selected
      if (formattedChats.length > 0 && !activeChat) {
        setActiveChat(formattedChats[0]);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      toast({
        title: "Error",
        description: "Failed to load chats",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create new chat
  const createNewChat = async (): Promise<Chat | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          title: 'New Chat'
        })
        .select()
        .single();

      if (error) throw error;

      const newChat: Chat = {
        id: data.id,
        title: data.title,
        messages: [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      setChats([newChat, ...chats]);
      setActiveChat(newChat);
      return newChat;
    } catch (error) {
      console.error('Error creating chat:', error);
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive"
      });
      return null;
    }
  };

  // Delete chat
  const deleteChat = async (chatId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId)
        .eq('user_id', user.id);

      if (error) throw error;

      const updatedChats = chats.filter(chat => chat.id !== chatId);
      setChats(updatedChats);

      // If we deleted the active chat, set the first available chat as active
      if (activeChat && activeChat.id === chatId) {
        if (updatedChats.length > 0) {
          setActiveChat(updatedChats[0]);
        } else {
          // Create a new chat if none left
          await createNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive"
      });
    }
  };

  // Update chat title
  const updateChatTitle = async (chatId: string, title: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chats')
        .update({ title: title.trim() || 'Untitled Chat' })
        .eq('id', chatId)
        .eq('user_id', user.id);

      if (error) throw error;

      const updatedChats = chats.map(chat => 
        chat.id === chatId ? { ...chat, title: title.trim() || 'Untitled Chat' } : chat
      );
      setChats(updatedChats);

      if (activeChat && activeChat.id === chatId) {
        setActiveChat({ ...activeChat, title: title.trim() || 'Untitled Chat' });
      }
    } catch (error) {
      console.error('Error updating chat title:', error);
      toast({
        title: "Error",
        description: "Failed to update chat title",
        variant: "destructive"
      });
    }
  };

  // Send message and get AI response
  const sendMessage = async (content: string) => {
    if (!user || !activeChat || !content.trim() || isSubmitting) return;

    // Validate message length (security enhancement)
    if (content.length > 4000) {
      toast({
        title: "Error",
        description: "Message too long. Please keep messages under 4000 characters.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create user message
      const userMessage: ChatMessage = {
        id: generateId(),
        type: 'user',
        content: content.trim(),
        timestamp: new Date()
      };

      // Update local state immediately for better UX
      const updatedChat = {
        ...activeChat,
        messages: [...activeChat.messages, userMessage],
        updatedAt: new Date()
      };
      
      // Update title if it's the first message
      if (activeChat.messages.length === 0) {
        updatedChat.title = content.length > 25 
          ? `${content.substring(0, 22)}...` 
          : content;
      }

      setActiveChat(updatedChat);
      setChats(chats.map(chat => chat.id === activeChat.id ? updatedChat : chat));

      // Call the edge function for AI response
      const { data, error } = await supabase.functions.invoke('chat-with-tessa', {
        body: {
          message: content.trim(),
          chatId: activeChat.id
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      // Create AI message
      const aiMessage: ChatMessage = {
        id: generateId(),
        type: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      // Update chat with AI response
      const finalUpdatedChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, aiMessage],
        updatedAt: new Date()
      };

      setActiveChat(finalUpdatedChat);
      setChats(chats.map(chat => chat.id === activeChat.id ? finalUpdatedChat : chat));

      // Update chat title in database if it changed
      if (updatedChat.title !== activeChat.title) {
        await updateChatTitle(activeChat.id, updatedChat.title);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load chats when user changes
  useEffect(() => {
    if (user) {
      loadChats();
    } else {
      setChats([]);
      setActiveChat(null);
      setLoading(false);
    }
  }, [user]);

  return {
    chats,
    activeChat,
    loading,
    isSubmitting,
    setActiveChat,
    createNewChat,
    deleteChat,
    updateChatTitle,
    sendMessage,
    refreshChats: loadChats
  };
};