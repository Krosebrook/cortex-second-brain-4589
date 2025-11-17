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
  created_at: string;
  updated_at: string;
}

export type FilterPresetInput = Omit<FilterPreset, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
