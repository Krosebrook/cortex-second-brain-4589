import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { ChatContainer } from './ChatContainer';
import { ChatErrorBoundary } from '@/components/error/ChatErrorBoundary';
import { ChatListSkeleton } from '@/components/ui/skeleton-variants';

export const Search: React.FC = () => {
  const { user } = useAuth();
  const {
    chats,
    activeChat,
    loading,
    isSubmitting,
    setActiveChat,
    createNewChat,
    deleteChat,
    deleteBulkChats,
    updateChatTitle,
    updateChatOrder,
    sendMessage
  } = useChat();

  if (!user) {
    return (
      <div className="w-full h-[calc(100vh-120px)] flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to start chatting with Tessa.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-120px)]">
        <ChatListSkeleton />
      </div>
    );
  }

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteChat(chatId);
  };

  return (
    <ChatErrorBoundary>
      <ChatContainer
        chats={chats}
        activeChat={activeChat}
        isSubmitting={isSubmitting}
        onSetActiveChat={setActiveChat}
        onCreateNewChat={createNewChat}
        onDeleteChat={handleDeleteChat}
        onDeleteBulkChats={deleteBulkChats}
        onUpdateTitle={updateChatTitle}
        onUpdateChatOrder={updateChatOrder}
        onSendMessage={sendMessage}
      />
    </ChatErrorBoundary>
  );
};

export default Search;
