/**
 * Infinite Scroll Chat Messages
 * Messages with cursor-based pagination for loading older messages
 */

import { useRef, useEffect, useCallback } from 'react';
import { User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnimatedTransition from '@/components/AnimatedTransition';
import { Chat, ChatMessage } from '@/types/chat';
import { TessaPersonality } from './TessaPersonality';
import { useVirtualScroll } from '@/hooks/useVirtualScroll';
import { useInfiniteScroll, CursorPaginatedResult } from '@/hooks/useInfiniteScroll';
import { supabase } from '@/integrations/supabase/client';

interface InfiniteScrollChatMessagesProps {
  activeChat: Chat | null;
  /** Optional: messages provided externally (for real-time updates) */
  externalMessages?: ChatMessage[];
}

const VIRTUALIZATION_THRESHOLD = 100;
const MESSAGE_HEIGHT = 120;
const PAGE_SIZE = 50;

const InfiniteScrollChatMessages: React.FC<InfiniteScrollChatMessagesProps> = ({ 
  activeChat,
  externalMessages 
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  // Fetch messages with cursor-based pagination (for older messages)
  const fetchMessages = useCallback(async (
    cursor: string | null,
    pageSize: number
  ): Promise<CursorPaginatedResult<ChatMessage>> => {
    if (!activeChat?.id) {
      return { data: [], nextCursor: null, hasMore: false };
    }

    let query = supabase
      .from('messages')
      .select('*')
      .eq('chat_id', activeChat.id)
      .order('created_at', { ascending: false })
      .limit(pageSize + 1);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) throw error;

    const hasMore = data && data.length > pageSize;
    const messages = (data || []).slice(0, pageSize);

    // Reverse to maintain chronological order
    const formattedMessages: ChatMessage[] = messages.reverse().map(msg => ({
      id: msg.id,
      type: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: new Date(msg.created_at),
    }));

    const nextCursor = hasMore && messages.length > 0
      ? messages[messages.length - 1].created_at
      : null;

    return {
      data: formattedMessages,
      nextCursor,
      hasMore,
    };
  }, [activeChat?.id]);

  const {
    data: loadedMessages,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    sentinelRef,
  } = useInfiniteScroll<ChatMessage>({
    queryKey: ['chat-messages-infinite', activeChat?.id || ''],
    queryFn: fetchMessages,
    pageSize: PAGE_SIZE,
    enabled: !!activeChat?.id,
    getItemId: (msg) => msg.id,
  });

  // Use external messages if provided, otherwise use loaded messages
  const messages = externalMessages || activeChat?.messages || loadedMessages;
  const enableVirtualization = messages.length > VIRTUALIZATION_THRESHOLD;

  const virtualizer = useVirtualScroll({
    count: messages.length,
    parentRef,
    estimateSize: MESSAGE_HEIGHT,
    overscan: 5,
    enabled: enableVirtualization,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (parentRef.current && messages.length > 0) {
      // Only auto-scroll on initial load or new messages at bottom
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        if (enableVirtualization) {
          virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
        } else {
          parentRef.current.scrollTop = parentRef.current.scrollHeight;
        }
      }
    }
  }, [messages.length, enableVirtualization, virtualizer]);

  // Reset initial load flag when chat changes
  useEffect(() => {
    isInitialLoad.current = true;
  }, [activeChat?.id]);

  const renderMessage = (message: ChatMessage) => (
    <div 
      key={message.id}
      className={cn(
        "flex gap-3 p-4 rounded-lg",
        message.type === 'user' 
          ? "bg-primary/10 ml-auto max-w-[80%]" 
          : "bg-muted/10 mr-auto max-w-[80%]"
      )}
    >
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        message.type === 'user' ? "bg-primary/20" : "bg-gradient-to-br from-primary/20 to-accent/20"
      )}>
        {message.type === 'user' ? (
          <User size={16} className="text-primary" />
        ) : (
          <div className="text-xs font-bold text-primary">T</div>
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm">{message.content}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(message.timestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  );

  const renderAnalysisPanel = () => (
    <div className="p-4 glass-panel rounded-xl space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Tessa's Analysis</h3>
      <div className="space-y-3">
        {[
          { title: 'Temporal Context', description: 'Recent patterns in your knowledge base' },
          { title: 'Cross-Referenced Insights', description: 'Connections Tessa found across your content' },
          { title: 'Goal Alignment', description: 'How this relates to your objectives' }
        ].map((result, index) => (
          <div 
            key={index}
            className="p-3 hover:bg-primary/5 rounded-lg transition-all duration-200 cursor-pointer"
          >
            <h4 className="font-medium">{result.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {result.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLoadMoreIndicator = () => (
    <div 
      ref={sentinelRef}
      className="flex items-center justify-center py-4"
    >
      {isFetchingNextPage ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading older messages...</span>
        </div>
      ) : hasNextPage ? (
        <button 
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
          onClick={() => {/* Auto-loads via intersection observer */}}
        >
          Scroll up for more
        </button>
      ) : messages.length > PAGE_SIZE ? (
        <span className="text-xs text-muted-foreground">Beginning of conversation</span>
      ) : null}
    </div>
  );

  // Loading state
  if (isLoading && !externalMessages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading messages...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatedTransition
          show={true}
          animation="fade"
          className="h-full flex items-center justify-center"
        >
          <div className="max-w-2xl w-full">
            <TessaPersonality show={true} />
          </div>
        </AnimatedTransition>
      </div>
    );
  }

  // Non-virtualized rendering for smaller lists
  if (!enableVirtualization) {
    return (
      <div ref={parentRef} className="flex-1 overflow-y-auto p-4">
        {renderLoadMoreIndicator()}
        
        <AnimatedTransition
          show={true}
          animation="fade"
          className="space-y-4"
        >
          {messages.map((message) => renderMessage(message))}
          
          {messages.length > 0 && messages[messages.length - 1].type === 'assistant' && (
            renderAnalysisPanel()
          )}
        </AnimatedTransition>
      </div>
    );
  }

  // Virtualized rendering for large lists
  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto p-4">
      {renderLoadMoreIndicator()}
      
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const message = messages[virtualRow.index];
          
          return (
            <div
              key={virtualRow.key}
              className="mb-4"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderMessage(message)}
            </div>
          );
        })}
      </div>
      
      {messages.length > 0 && messages[messages.length - 1].type === 'assistant' && (
        <div className="mt-4">
          {renderAnalysisPanel()}
        </div>
      )}
    </div>
  );
};

export default InfiniteScrollChatMessages;
