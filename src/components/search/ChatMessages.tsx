import { useRef, useEffect } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnimatedTransition from '@/components/AnimatedTransition';
import { Chat, ChatMessage } from '@/types/chat';
import { TessaPersonality } from './TessaPersonality';
import { useVirtualScroll } from '@/hooks/useVirtualScroll';

interface ChatMessagesProps {
  activeChat: Chat | null;
}

const VIRTUALIZATION_THRESHOLD = 100;
const MESSAGE_HEIGHT = 120;

const ChatMessages: React.FC<ChatMessagesProps> = ({ activeChat }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const messages = activeChat?.messages || [];
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
      if (enableVirtualization) {
        virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
      } else {
        parentRef.current.scrollTop = parentRef.current.scrollHeight;
      }
    }
  }, [messages.length, enableVirtualization, virtualizer]);

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

export default ChatMessages;
