import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOffline } from '@/contexts/OfflineContext';
import { Chat, ChatMessage } from '@/types/chat';
import { generateId } from '@/utils/chatUtils';
import { enhancedToast } from '@/components/feedback/EnhancedToast';
import { useConfirmationDialog } from '@/components/feedback/ConfirmationProvider';
import { sanitizeContent, validateChatMessage, RateLimiter } from '@/utils/security';
import { ChatService } from '@/services/chat.service';

export const useChat = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const { confirm } = useConfirmationDialog();
  
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
      if (isOnline) {
        enhancedToast.error('Error', 'Failed to load chats');
      } else {
        enhancedToast.info('Offline Mode', 'Showing offline chats');
      }
    } finally {
      setLoading(false);
    }
  }, [user, activeChat, isOnline]);

  useEffect(() => {
    loadChats();
  }, [user]);

  const createNewChat = useCallback(async (): Promise<Chat | null> => {
    if (!user) return null;

    if (!isOnline) {
      enhancedToast.warning('Offline', 'Cannot create new chats while offline');
      return null;
    }

    try {
      const newChat = await ChatService.createChat(user.id);
      setChats([newChat, ...chats]);
      setActiveChat(newChat);
      return newChat;
    } catch (error) {
      console.error('Error creating chat:', error);
      enhancedToast.error('Error', 'Failed to create new chat');
      return null;
    }
  }, [user, chats, isOnline]);

  const deleteChat = useCallback(async (chatId: string) => {
    if (!user) return;

    if (!isOnline) {
      enhancedToast.warning('Offline', 'Cannot delete chats while offline');
      return;
    }

    const chatToDelete = chats.find(chat => chat.id === chatId);
    if (!chatToDelete) return;

    confirm({
      title: 'Delete Chat',
      description: `Are you sure you want to delete "${chatToDelete.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        const previousChats = [...chats];
        const previousActiveChat = activeChat;

        // Optimistically update UI
        const updatedChats = chats.filter(chat => chat.id !== chatId);
        setChats(updatedChats);
        
        if (activeChat?.id === chatId) {
          setActiveChat(updatedChats[0] || null);
        }

        try {
          await ChatService.deleteChat(chatId, user.id);
          enhancedToast.destructive(
            'Chat Deleted',
            `"${chatToDelete.title}" has been deleted`,
            async () => {
              // Undo deletion
              setChats(previousChats);
              setActiveChat(previousActiveChat);
              enhancedToast.success('Chat Restored', 'The chat has been restored');
            }
          );
        } catch (error) {
          console.error('Error deleting chat:', error);
          // Revert optimistic update on error
          setChats(previousChats);
          setActiveChat(previousActiveChat);
          enhancedToast.error('Error', 'Failed to delete chat');
        }
      },
      successMessage: undefined,
      errorMessage: undefined
    });
  }, [user, chats, activeChat, isOnline, confirm]);

  const deleteBulkChats = useCallback(async (chatIds: string[]) => {
    if (!user) return;

    if (!isOnline) {
      enhancedToast.warning('Offline', 'Cannot delete chats while offline');
      return;
    }

    if (chatIds.length === 0) return;

    const chatsToDelete = chats.filter(chat => chatIds.includes(chat.id));
    
    confirm({
      title: 'Delete Multiple Chats',
      description: `Are you sure you want to delete ${chatIds.length} chat${chatIds.length > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: `Delete ${chatIds.length} Chat${chatIds.length > 1 ? 's' : ''}`,
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        const previousChats = [...chats];
        const previousActiveChat = activeChat;

        // Optimistically update UI
        const updatedChats = chats.filter(chat => !chatIds.includes(chat.id));
        setChats(updatedChats);
        
        if (activeChat && chatIds.includes(activeChat.id)) {
          setActiveChat(updatedChats[0] || null);
        }

        try {
          // Delete all chats in parallel
          await Promise.all(
            chatIds.map(chatId => ChatService.deleteChat(chatId, user.id))
          );

          enhancedToast.destructive(
            'Chats Deleted',
            `${chatIds.length} chat${chatIds.length > 1 ? 's have' : ' has'} been deleted`,
            async () => {
              // Undo deletion
              setChats(previousChats);
              setActiveChat(previousActiveChat);
              enhancedToast.success('Chats Restored', 'All chats have been restored');
            }
          );
        } catch (error) {
          console.error('Error deleting chats:', error);
          // Revert optimistic update on error
          setChats(previousChats);
          setActiveChat(previousActiveChat);
          enhancedToast.error('Error', 'Failed to delete some chats');
        }
      },
      successMessage: undefined,
      errorMessage: undefined
    });
  }, [user, chats, activeChat, isOnline, confirm]);

  const updateChatTitle = useCallback(async (chatId: string, title: string) => {
    if (!user) return;

    if (!isOnline) {
      enhancedToast.warning('Offline', 'Cannot update chat titles while offline');
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
      enhancedToast.error('Error', 'Failed to update chat title');
    }
  }, [user, chats, activeChat, isOnline]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !activeChat || !content.trim() || isSubmitting) return;

    if (!isOnline) {
      enhancedToast.warning('Offline', 'Cannot send messages while offline');
      return;
    }

    if (!rateLimiter.isAllowed(user.id)) {
      enhancedToast.warning('Rate Limit Exceeded', 'Please wait before sending another message');
      return;
    }

    const validation = validateChatMessage(content);
    if (!validation.isValid) {
      enhancedToast.error('Invalid Message', validation.error);
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
      if (isOnline) {
        enhancedToast.error('Error', 'Failed to send message');
      } else {
        enhancedToast.warning('Offline', 'Cannot send messages while offline');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [user, activeChat, chats, isOnline, isSubmitting, rateLimiter]);

  return {
    chats,
    activeChat,
    loading,
    isSubmitting,
    setActiveChat,
    createNewChat,
    deleteChat,
    deleteBulkChats,
    updateChatTitle,
    sendMessage,
    refreshChats: loadChats
  };
};
