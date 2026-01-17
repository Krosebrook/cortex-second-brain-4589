/**
 * Infinite Scroll Chat Sidebar
 * Chat list with cursor-based infinite scroll pagination
 */

import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Chat } from '@/types/chat';
import { PlusCircle, Edit3, Trash2, SearchIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { groupChatsByDate } from '@/utils/chatUtils';
import { useInfiniteScroll, CursorPaginatedResult } from '@/hooks/useInfiniteScroll';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface InfiniteScrollChatSidebarProps {
  activeChat: Chat | null;
  setActiveChat: (chat: Chat) => void;
  createNewChat: () => void;
  deleteChat: (chatId: string, e: React.MouseEvent) => void;
  showSidebar: boolean;
  isEditingTitle: string | null;
  editTitle: string;
  setEditTitle: (title: string) => void;
  startEditingTitle: (chatId: string, e: React.MouseEvent) => void;
  saveTitle: (chatId: string) => void;
}

const PAGE_SIZE = 20;

const InfiniteScrollChatSidebar: React.FC<InfiniteScrollChatSidebarProps> = ({
  activeChat,
  setActiveChat,
  createNewChat,
  deleteChat,
  showSidebar,
  isEditingTitle,
  editTitle,
  setEditTitle,
  startEditingTitle,
  saveTitle
}) => {
  const { user } = useAuth();

  const fetchChats = useCallback(async (
    cursor: string | null, 
    pageSize: number
  ): Promise<CursorPaginatedResult<Chat>> => {
    if (!user) {
      return { data: [], nextCursor: null, hasMore: false };
    }

    let query = supabase
      .from('chats')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(pageSize + 1); // Fetch one extra to check if there are more

    if (cursor) {
      query = query.lt('updated_at', cursor);
    }

    const { data, error } = await query;

    if (error) throw error;

    const hasMore = data && data.length > pageSize;
    const chats = (data || []).slice(0, pageSize);

    const formattedChats: Chat[] = chats.map(chat => ({
      id: chat.id,
      title: chat.title,
      messages: [], // Messages loaded separately
      createdAt: new Date(chat.created_at),
      updatedAt: new Date(chat.updated_at),
    }));

    const nextCursor = hasMore && chats.length > 0 
      ? chats[chats.length - 1].updated_at 
      : null;

    return {
      data: formattedChats,
      nextCursor,
      hasMore,
    };
  }, [user]);

  const {
    data: chats,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    sentinelRef,
  } = useInfiniteScroll<Chat>({
    queryKey: ['chats-infinite', user?.id || ''],
    queryFn: fetchChats,
    pageSize: PAGE_SIZE,
    enabled: !!user,
    getItemId: (chat) => chat.id,
  });

  const groupedChats = groupChatsByDate(chats);

  return (
    <div className={cn(
      "h-full bg-muted/30 border-r transition-all duration-300",
      showSidebar ? "w-64" : "w-0 overflow-hidden"
    )}>
      <div className="h-full flex flex-col">
        <div className="p-3">
          <Button 
            onClick={createNewChat}
            className="w-full justify-start gap-2"
            variant="outline"
          >
            <PlusCircle size={16} />
            New Chat
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No chats yet. Create one to get started!
            </div>
          ) : (
            <>
              {groupedChats.map(([dateGroup, dateChats]) => (
                <div key={dateGroup} className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground px-2">{dateGroup}</h3>
                  
                  {dateChats.map(chat => (
                    <div 
                      key={chat.id}
                      onClick={() => setActiveChat(chat)}
                      className={cn(
                        "p-2 rounded-lg flex items-center gap-2 cursor-pointer group",
                        activeChat?.id === chat.id 
                          ? "bg-primary/10 text-primary" 
                          : "hover:bg-muted/50"
                      )}
                    >
                      <SearchIcon size={16} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {isEditingTitle === chat.id ? (
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              saveTitle(chat.id);
                            }}
                          >
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              autoFocus
                              onBlur={() => saveTitle(chat.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-6 py-0 text-sm"
                            />
                          </form>
                        ) : (
                          <p className="text-sm truncate">{chat.title}</p>
                        )}
                      </div>
                      <div className={cn(
                        "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                        activeChat?.id === chat.id ? "opacity-100" : ""
                      )}>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7" 
                          onClick={(e) => startEditingTitle(chat.id, e)}
                        >
                          <Edit3 size={14} />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7" 
                          onClick={(e) => deleteChat(chat.id, e)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              
              {/* Sentinel element for infinite scroll */}
              <div 
                ref={sentinelRef}
                className="h-10 flex items-center justify-center"
              >
                {isFetchingNextPage && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!hasNextPage && chats.length > 0 && (
                  <p className="text-xs text-muted-foreground">No more chats</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfiniteScrollChatSidebar;
