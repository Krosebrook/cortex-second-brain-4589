import { Chat, ChatMessage } from '@/types/chat';
import { KnowledgeItem } from '@/hooks/useKnowledge';

export type ConflictResolutionStrategy = 'last-write-wins' | 'user-choice' | 'merge';

interface ConflictResolution<T> {
  resolved: T;
  strategy: ConflictResolutionStrategy;
  timestamp: Date;
}

export class SyncResolver {
  // Resolve chat conflicts
  static resolveChat(
    localChat: Chat,
    remoteChat: Chat,
    strategy: ConflictResolutionStrategy = 'last-write-wins'
  ): ConflictResolution<Chat> {
    if (strategy === 'last-write-wins') {
      const resolved = localChat.updatedAt > remoteChat.updatedAt ? localChat : remoteChat;
      return {
        resolved,
        strategy,
        timestamp: new Date(),
      };
    }

    if (strategy === 'merge') {
      // Merge messages from both, removing duplicates
      const allMessages = [...localChat.messages, ...remoteChat.messages];
      const uniqueMessages = Array.from(
        new Map(allMessages.map(msg => [msg.id, msg])).values()
      ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      const resolved: Chat = {
        ...remoteChat,
        messages: uniqueMessages,
        updatedAt: new Date(Math.max(
          localChat.updatedAt.getTime(),
          remoteChat.updatedAt.getTime()
        )),
      };

      return {
        resolved,
        strategy,
        timestamp: new Date(),
      };
    }

    // Default: return remote (server version)
    return {
      resolved: remoteChat,
      strategy,
      timestamp: new Date(),
    };
  }

  // Resolve knowledge item conflicts
  static resolveKnowledgeItem(
    localItem: KnowledgeItem,
    remoteItem: KnowledgeItem,
    strategy: ConflictResolutionStrategy = 'last-write-wins'
  ): ConflictResolution<KnowledgeItem> {
    if (strategy === 'last-write-wins') {
      const localTime = new Date(localItem.updated_at).getTime();
      const remoteTime = new Date(remoteItem.updated_at).getTime();
      const resolved = localTime > remoteTime ? localItem : remoteItem;
      
      return {
        resolved,
        strategy,
        timestamp: new Date(),
      };
    }

    if (strategy === 'merge') {
      // Merge tags from both
      const allTags = [...(localItem.tags || []), ...(remoteItem.tags || [])];
      const uniqueTags = Array.from(new Set(allTags));

      const resolved: KnowledgeItem = {
        ...remoteItem,
        tags: uniqueTags,
        updated_at: new Date(Math.max(
          new Date(localItem.updated_at).getTime(),
          new Date(remoteItem.updated_at).getTime()
        )).toISOString(),
      };

      return {
        resolved,
        strategy,
        timestamp: new Date(),
      };
    }

    // Default: return remote (server version)
    return {
      resolved: remoteItem,
      strategy,
      timestamp: new Date(),
    };
  }

  // Check if items are in conflict
  static hasConflict<T extends { updated_at: string | Date }>(
    localItem: T,
    remoteItem: T
  ): boolean {
    const localTime = new Date(localItem.updated_at).getTime();
    const remoteTime = new Date(remoteItem.updated_at).getTime();
    
    // Consider items in conflict if their timestamps differ by more than 1 second
    return Math.abs(localTime - remoteTime) > 1000;
  }
}
