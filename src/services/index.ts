/**
 * Services Index
 * Central export point for all service modules
 */

export { ChatService, ChatServiceImpl } from './chat.service';
export { KnowledgeService, KnowledgeServiceImpl } from './knowledge.service';
export { StoresService } from './stores.service';
export { BaseService, handleSupabaseResult, handleSupabaseArrayResult } from './base.service';

// Type exports
export type { Store, StoreInsert, StoreUpdate, StoreWithoutApiKey, StoreService } from './stores.service';
