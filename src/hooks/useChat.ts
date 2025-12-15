/**
 * useChat Hook
 * Manages chat conversations with proper service integration and loading states
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOffline } from '@/contexts/OfflineContext';
import { Chat, ChatMessage } from '@/types/chat';
import { generateId } from '@/utils/chatUtils';
import { enhancedToast } from '@/components/feedback/EnhancedToast';
import { useConfirmationDialog } from '@/components/feedback/ConfirmationProvider';
import { sanitizeContent, validateChatMessage, RateLimiter } from '@/utils/security';
import { ChatService } from '@/services/chat.service';
import { useAsyncAction } from './useAsyncAction';

// ============================================
// Types
// ============================================

interface UseChatState {
  chats: Chat[];
  activeChat: Chat | null;
}

interface UseChatReturn extends UseChatState {
  loading: boolean;
  isSubmitting: boolean;
  setActiveChat: (chat: Chat | null) => void;
  createNewChat: () => Promise<Chat | null>;
  deleteChat: (chatId: string) => Promise<void>;
  deleteBulkChats: (chatIds: string[]) => Promise<void>;
  softDeleteChat: (chatId: string) => Promise<void>;
  restoreChat: (chatId: string) => Promise<void>;
  softDeleteBulkChats: (chatIds: string[]) => Promise<Chat[]>;
  restoreBulkChats: (chatIds: string[]) => Promise<void>;
  updateChatTitle: (chatId: string, title: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  updateChatOrder: (orderedChats: { id: string; order_index: number }[]) => Promise<void>;
  refreshChats: () => Promise<Chat[] | null>;
}

// ============================================
// Helper Functions
// ============================================

function sortChats(chats: Chat[]): Chat[] {
  return [...chats].sort((a, b) => {
    const orderA = (a as Chat & { order_index?: number }).order_index ?? Infinity;
    const orderB = (b as Chat & { order_index?: number }).order_index ?? Infinity;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function filterActiveChats(chats: Chat[]): Chat[] {
  return chats.filter(chat => !(chat as Chat & { deleted_at?: string }).deleted_at);
}

// ============================================
// Hook Implementation
// ============================================

export const useChat = (): UseChatReturn => {
  const [state, setState] = useState<UseChatState>({
    chats: [],
    activeChat: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();
  const { isOnline } = useOffline();
  const { confirm } = useConfirmationDialog();

  // Rate limiter for message sending
  const rateLimiter = useMemo(() => new RateLimiter(20, 60000), []);

  // ============================================
  // Async Actions
  // ============================================

  const loadChatsAction = useAsyncAction(
    async () => {
      if (!user) return [];
      const chats = await ChatService.loadChats(user.id);
      return sortChats(filterActiveChats(chats));
    },
    {
      showToast: false,
      onSuccess: (chats) => {
        setState(prev => ({
          chats,
          activeChat: prev.activeChat || (chats.length > 0 ? chats[0] : null),
        }));
      },
      onError: () => {
        if (!isOnline) {
          enhancedToast.info('Offline Mode', 'Showing cached chats');
        }
      },
    }
  );

  const createChatAction = useAsyncAction(
    async () => {
      if (!user) throw new Error('User not authenticated');
      return ChatService.createChat(user.id);
    },
    {
      showToast: false,
      onSuccess: (newChat) => {
        setState(prev => ({
          chats: [newChat, ...prev.chats],
          activeChat: newChat,
        }));
      },
      onError: () => {
        enhancedToast.error('Error', 'Failed to create new chat');
      },
    }
  );

  // ============================================
  // Effects
  // ============================================

  useEffect(() => {
    if (user) {
      loadChatsAction.execute();
    } else {
      setState({ chats: [], activeChat: null });
    }
  }, [user?.id]);

  // ============================================
  // Actions
  // ============================================

  const setActiveChat = useCallback((chat: Chat | null) => {
    setState(prev => ({ ...prev, activeChat: chat }));
  }, []);

  const createNewChat = useCallback(async (): Promise<Chat | null> => {
    if (!isOnline) {
      enhancedToast.warning('Offline', 'Cannot create new chats while offline');
      return null;
    }
    return createChatAction.execute();
  }, [isOnline, createChatAction]);

  const softDeleteChat = useCallback(async (chatId: string): Promise<void> => {
    if (!user) return;
    await ChatService.softDeleteChat(chatId, user.id);
    await loadChatsAction.execute();
  }, [user, loadChatsAction]);

  const restoreChat = useCallback(async (chatId: string): Promise<void> => {
    if (!user) return;
    await ChatService.restoreChat(chatId, user.id);
    await loadChatsAction.execute();
  }, [user, loadChatsAction]);

  const deleteChat = useCallback(async (chatId: string): Promise<void> => {
    if (!user || !isOnline) {
      if (!isOnline) enhancedToast.warning('Offline', 'Cannot delete chats while offline');
      return;
    }

    const chatToDelete = state.chats.find(chat => chat.id === chatId);
    if (!chatToDelete) return;

    confirm({
      title: 'Delete Chat',
      description: `Are you sure you want to delete "${chatToDelete.title}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await softDeleteChat(chatId);
          enhancedToast.success('Chat Deleted', `"${chatToDelete.title}" has been deleted`);
        } catch {
          enhancedToast.error('Error', 'Failed to delete chat');
        }
      },
    });
  }, [user, state.chats, isOnline, confirm, softDeleteChat]);

  const softDeleteBulkChats = useCallback(async (chatIds: string[]): Promise<Chat[]> => {
    if (!user) return [];
    await ChatService.bulkSoftDelete(chatIds, user.id);
    const deletedChats = state.chats.filter(chat => chatIds.includes(chat.id));
    await loadChatsAction.execute();
    return deletedChats;
  }, [user, state.chats, loadChatsAction]);

  const restoreBulkChats = useCallback(async (chatIds: string[]): Promise<void> => {
    if (!user) return;
    await ChatService.bulkRestore(chatIds, user.id);
    await loadChatsAction.execute();
  }, [user, loadChatsAction]);

  const deleteBulkChats = useCallback(async (chatIds: string[]): Promise<void> => {
    if (!user || !isOnline || chatIds.length === 0) {
      if (!isOnline) enhancedToast.warning('Offline', 'Cannot delete chats while offline');
      return;
    }

    confirm({
      title: 'Delete Multiple Chats',
      description: `Are you sure you want to delete ${chatIds.length} chat${chatIds.length > 1 ? 's' : ''}?`,
      confirmText: `Delete ${chatIds.length} Chat${chatIds.length > 1 ? 's' : ''}`,
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await softDeleteBulkChats(chatIds);
          enhancedToast.success(
            'Chats Deleted',
            `${chatIds.length} chat${chatIds.length > 1 ? 's have' : ' has'} been deleted`
          );
        } catch {
          enhancedToast.error('Error', 'Failed to delete chats');
        }
      },
    });
  }, [user, isOnline, confirm, softDeleteBulkChats]);

  const updateChatTitle = useCallback(async (chatId: string, title: string): Promise<void> => {
    if (!user || !isOnline) {
      if (!isOnline) enhancedToast.warning('Offline', 'Cannot update chat titles while offline');
      return;
    }

    try {
      await ChatService.updateChatTitle(chatId, user.id, title);
      setState(prev => ({
        ...prev,
        chats: prev.chats.map(chat => chat.id === chatId ? { ...chat, title } : chat),
        activeChat: prev.activeChat?.id === chatId ? { ...prev.activeChat, title } : prev.activeChat,
      }));
    } catch {
      enhancedToast.error('Error', 'Failed to update chat title');
    }
  }, [user, isOnline]);

  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!user || !state.activeChat || !content.trim() || isSubmitting) return;

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
      enhancedToast.error('Invalid Message', validation.error || 'Message validation failed');
      return;
    }

    const sanitizedContent = sanitizeContent(content);
    setIsSubmitting(true);

    try {
      const userMessage: ChatMessage = {
        id: generateId(),
        type: 'user',
        content: sanitizedContent,
        timestamp: new Date(),
      };

      // Update local state optimistically
      const isNewChat = state.activeChat.messages.length === 0;
      const newTitle = isNewChat
        ? (sanitizedContent.length > 25 ? `${sanitizedContent.substring(0, 22)}...` : sanitizedContent)
        : state.activeChat.title;

      const updatedChat: Chat = {
        ...state.activeChat,
        title: newTitle,
        messages: [...state.activeChat.messages, userMessage],
        updatedAt: new Date(),
      };

      setState(prev => ({
        ...prev,
        activeChat: updatedChat,
        chats: prev.chats.map(chat => chat.id === updatedChat.id ? updatedChat : chat),
      }));

      // Update title on server if new chat
      if (isNewChat) {
        await ChatService.updateChatTitle(state.activeChat.id, user.id, newTitle);
      }

      // Get AI response
      const aiResponse = await ChatService.sendMessageToAPI(sanitizedContent, state.activeChat.id);

      const aiMessage: ChatMessage = {
        id: generateId(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      const finalChat: Chat = {
        ...updatedChat,
        messages: [...updatedChat.messages, aiMessage],
        updatedAt: new Date(),
      };

      setState(prev => ({
        ...prev,
        activeChat: finalChat,
        chats: prev.chats.map(chat => chat.id === finalChat.id ? finalChat : chat),
      }));
    } catch {
      enhancedToast.error('Error', 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, state.activeChat, isOnline, isSubmitting, rateLimiter]);

  const updateChatOrder = useCallback(async (orderedChats: { id: string; order_index: number }[]): Promise<void> => {
    if (!user || !isOnline) {
      if (!isOnline) enhancedToast.warning('Offline', 'Cannot reorder chats while offline');
      return;
    }

    try {
      await Promise.all(
        orderedChats.map(({ id, order_index }) =>
          ChatService.updateChat(id, user.id, { order_index })
        )
      );
      await loadChatsAction.execute();
      enhancedToast.success('Success', 'Chats reordered successfully');
    } catch {
      enhancedToast.error('Error', 'Failed to update order');
    }
  }, [user, isOnline, loadChatsAction]);

  // ============================================
  // Return
  // ============================================

  return {
    chats: state.chats,
    activeChat: state.activeChat,
    loading: loadChatsAction.loading,
    isSubmitting,
    setActiveChat,
    createNewChat,
    deleteChat,
    deleteBulkChats,
    softDeleteChat,
    restoreChat,
    softDeleteBulkChats,
    restoreBulkChats,
    updateChatTitle,
    sendMessage,
    updateChatOrder,
    refreshChats: loadChatsAction.execute,
  };
};
