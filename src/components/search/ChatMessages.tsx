import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnimatedTransition from '@/components/AnimatedTransition';
import { Chat, ChatMessage } from '@/types/chat';
import { TessaPersonality } from './TessaPersonality';

interface ChatMessagesProps {
  activeChat: Chat | null;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ activeChat }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <AnimatedTransition
        show={activeChat?.messages.length === 0}
        animation="fade"
        className="h-full flex items-center justify-center"
      >
        <div className="max-w-2xl w-full">
          <TessaPersonality show={true} />
        </div>
      </AnimatedTransition>
      
      <AnimatedTransition
        show={activeChat?.messages.length > 0}
        animation="fade"
        className="space-y-4"
      >
        {activeChat?.messages.map((message: ChatMessage) => (
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
        ))}
        
        {activeChat?.messages.length > 0 && activeChat.messages[activeChat.messages.length - 1].type === 'assistant' && (
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
        )}
      </AnimatedTransition>
    </div>
  );
};

export default ChatMessages;
