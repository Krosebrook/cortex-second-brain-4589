import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SearchIcon } from 'lucide-react';
import ChatSidebarWithBulk from './ChatSidebarWithBulk';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { Chat } from '@/types/chat';

interface ChatContainerProps {
  chats: Chat[];
  activeChat: Chat | null;
  isSubmitting: boolean;
  onSetActiveChat: (chat: Chat) => void;
  onCreateNewChat: () => void;
  onDeleteChat: (chatId: string, e: React.MouseEvent) => void;
  onDeleteBulkChats: (chatIds: string[]) => void;
  onUpdateChatOrder?: (orderedChats: { id: string; order_index: number }[]) => void;
  onUpdateTitle: (chatId: string, title: string) => void;
  onSendMessage: (message: string) => Promise<void>;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  chats,
  activeChat,
  isSubmitting,
  onSetActiveChat,
  onCreateNewChat,
  onDeleteChat,
  onDeleteBulkChats,
  onUpdateChatOrder = () => {},
  onUpdateTitle,
  onSendMessage
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startEditingTitle = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setIsEditingTitle(chatId);
      setEditTitle(chat.title);
    }
  };

  const saveTitle = (chatId: string) => {
    onUpdateTitle(chatId, editTitle);
    setIsEditingTitle(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && !isSubmitting) {
      await onSendMessage(searchQuery);
      setSearchQuery('');
    }
  };

  return (
    <div className="w-full h-[calc(100vh-120px)] flex">
      <ChatSidebarWithBulk
        chats={chats}
        activeChat={activeChat}
        setActiveChat={onSetActiveChat}
        createNewChat={onCreateNewChat}
        deleteChat={onDeleteChat}
        deleteBulkChats={onDeleteBulkChats}
        updateChatOrder={onUpdateChatOrder}
        showSidebar={showSidebar}
        isEditingTitle={isEditingTitle}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        startEditingTitle={startEditingTitle}
        saveTitle={saveTitle}
      />
      
      <div className="flex-1 flex flex-col">
        <div className="border-b py-2 px-4 flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowSidebar(!showSidebar)}
            className="mr-2"
          >
            <SearchIcon size={18} />
          </Button>
          <h2 className="font-medium">
            {activeChat?.title || 'Chat with Tessa'}
          </h2>
        </div>
        
        <ChatMessages activeChat={activeChat} />
        
        <ChatInput
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSubmit={handleSubmit}
          isFocused={isFocused}
          setIsFocused={setIsFocused}
          loading={isSubmitting}
        />
      </div>
    </div>
  );
};
