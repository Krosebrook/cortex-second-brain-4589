
import React, { useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatSidebar from './ChatSidebar';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';

export const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  
  const { user } = useAuth();
  const {
    chats,
    activeChat,
    loading,
    isSubmitting,
    setActiveChat,
    createNewChat,
    deleteChat: deleteChatFromDB,
    updateChatTitle,
    sendMessage
  } = useChat();

  // Handle new chat creation
  const handleCreateNewChat = () => {
    createNewChat();
  };

  // Handle chat deletion
  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteChatFromDB(chatId);
  };

  // Edit chat title handlers
  const startEditingTitle = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setIsEditingTitle(chatId);
      setEditTitle(chat.title);
    }
  };

  const saveTitle = (chatId: string) => {
    updateChatTitle(chatId, editTitle);
    setIsEditingTitle(null);
  };

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && !isSubmitting) {
      await sendMessage(searchQuery);
      setSearchQuery('');
    }
  };

  // Show loading or require authentication
  if (!user) {
    return (
      <div className="w-full h-[calc(100vh-120px)] flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to start chatting with Tessa.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-120px)] flex items-center justify-center">
        <p className="text-muted-foreground">Loading your chats...</p>
      </div>
    );
  }

  // Toggle sidebar
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="w-full h-[calc(100vh-120px)] flex">
      {/* Sidebar with chat history */}
      <ChatSidebar 
        chats={chats}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        createNewChat={handleCreateNewChat}
        deleteChat={handleDeleteChat}
        showSidebar={showSidebar}
        isEditingTitle={isEditingTitle}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        startEditingTitle={startEditingTitle}
        saveTitle={saveTitle}
      />
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header with toggle */}
        <div className="border-b py-2 px-4 flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="mr-2"
          >
            <SearchIcon size={18} />
          </Button>
          <h2 className="font-medium">
            {activeChat?.title || 'Chat with Tessa'}
          </h2>
        </div>
        
        {/* Chat messages area */}
        <ChatMessages activeChat={activeChat} />
        
        {/* Input area */}
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

export default Search;
