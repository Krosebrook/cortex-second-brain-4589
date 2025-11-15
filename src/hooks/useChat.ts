import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOffline } from '@/contexts/OfflineContext';
import { Chat, ChatMessage } from '@/types/chat';
import { generateId } from '@/utils/chatUtils';
import { useToast } from '@/hooks/use-toast';
import { sanitizeContent, validateChatMessage, RateLimiter } from '@/utils/security';
import { ChatService } from '@/services/chat.service';

export const useChat = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const { toast } = useToast();
  
  const [rateLimiter] = useState(() => new RateLimiter(20, 60000));

  const loadChats = useCallback(async () => {
    if (!user) return;
    
    try {
      const formattedChats = await ChatService.loadChats(user.id);
      setChats(formattedChats);
      
      if (formattedChats.length > 0 && !activeChat) {
        setActiveChat(formattedChats[0]);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      toast({
        title: isOnline ? "Error" : "Offline Mode",
        description: isOnline ? "Failed to load chats" : "Showing offline chats",
        variant: isOnline ? "destructive" : "default"
      });
    } finally {
      setLoading(false);
    }
  }, [user, activeChat, isOnline, toast]);

  useEffect(() => {
    loadChats();
  }, [user]);

  const createNewChat = useCallback(async (): Promise<Chat | null> => {
    if (!user) return null;

    if (!isOnline) {
      toast({
        title: "Offline",
        description: "Cannot create new chats while offline",
        variant: "default"
      });
      return null;
    }

    try {
      const newChat = await ChatService.createChat(user.id);
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
  }, [user, chats, isOnline, toast]);

  const deleteChat = useCallback(async (chatId: string) => {
    if (!user) return;

    if (!isOnline) {
      toast({
        title: "Offline",
        description: "Cannot delete chats while offline",
        variant: "default"
      });
      return;
    }

    try {
      await ChatService.deleteChat(chatId, user.id);
      const updatedChats = chats.filter(chat => chat.id !== chatId);
      setChats(updatedChats);
      
      if (activeChat?.id === chatId) {
        setActiveChat(updatedChats[0] || null);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive"
      });
    }
  }, [user, chats, activeChat, isOnline, toast]);

  const updateChatTitle = useCallback(async (chatId: string, title: string) => {
    if (!user) return;

    if (!isOnline) {
      toast({
        title: "Offline",
        description: "Cannot update chat titles while offline",
        variant: "default"
      });
      return;
    }

    try {
      await ChatService.updateChatTitle(chatId, user.id, title);
      setChats(chats.map(chat => 
        chat.id === chatId ? { ...chat, title } : chat
      ));

      if (activeChat?.id === chatId) {
        setActiveChat({ ...activeChat, title });
      }
    } catch (error) {
      console.error('Error updating chat title:', error);
      toast({
        title: "Error",
        description: "Failed to update chat title",
        variant: "destructive"
      });
    }
  }, [user, chats, activeChat, isOnline, toast]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !activeChat || !content.trim() || isSubmitting) return;

    if (!isOnline) {
      toast({
        title: "Offline",
        description: "Cannot send messages while offline",
        variant: "default"
      });
      return;
    }

    if (!rateLimiter.isAllowed(user.id)) {
      toast({
        title: "Rate Limit Exceeded",
        description: "Please wait before sending another message",
        variant: "destructive"
      });
      return;
    }

    const validation = validateChatMessage(content);
    if (!validation.isValid) {
      toast({
        title: "Invalid Message",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    const sanitizedContent = sanitizeContent(content);
    setIsSubmitting(true);

    try {
      const userMessage: ChatMessage = {
        id: generateId(),
        type: 'user',
        content: sanitizedContent,
        timestamp: new Date()
      };

      const updatedChat = {
        ...activeChat,
        messages: [...activeChat.messages, userMessage],
        updatedAt: new Date()
      };
      
      if (activeChat.messages.length === 0) {
        updatedChat.title = sanitizedContent.length > 25 
          ? `${sanitizedContent.substring(0, 22)}...` 
          : sanitizedContent;
      }

      let chatToUse = updatedChat;

      if (activeChat.messages.length === 0) {
        await ChatService.updateChatTitle(activeChat.id, user.id, updatedChat.title);
        chatToUse = { ...updatedChat, title: updatedChat.title };
      }

      setActiveChat(chatToUse);
      setChats(chats.map(chat => chat.id === activeChat.id ? chatToUse : chat));

      const aiResponse = await ChatService.sendMessageToAPI(sanitizedContent, chatToUse.id);

      const aiMessage: ChatMessage = {
        id: generateId(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      const finalChat = {
        ...chatToUse,
        messages: [...chatToUse.messages, aiMessage],
        updatedAt: new Date()
      };

      setActiveChat(finalChat);
      setChats(chats.map(chat => chat.id === finalChat.id ? finalChat : chat));
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: isOnline ? "Error" : "Offline",
        description: isOnline ? "Failed to send message" : "Cannot send messages while offline",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, activeChat, chats, isOnline, isSubmitting, rateLimiter, toast]);

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
