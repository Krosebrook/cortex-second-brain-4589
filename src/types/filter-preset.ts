export interface FilterOptions {
  searchQuery?: string;
  types?: string[];
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface FilterPreset {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  filters: FilterOptions;
  scope: 'knowledge' | 'chats';
  is_default: boolean;
  icon?: string;
  color?: string;
  sort_order: number;
  usage_count?: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export type FilterPresetInput = Omit<FilterPreset, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sort_order' | 'usage_count' | 'last_used_at'>;
