export type Bookmark = {
  id: string;
  user_id: string;
  url: string;
  title: string;
  description?: string | null;
  tags?: string[] | null;
  favicon_url?: string | null;
  folder_id?: string | null;
  is_favorite?: boolean;
  is_pinned?: boolean;
  symbol?: string | null;
  color?: string | null;
  visit_count?: number;
  last_visited_at?: string | null;
  custom_metadata?: unknown;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  type?: string;
};

export type Folder = {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  parent_id?: string | null;
  sort_order?: number;
  symbol?: string | null;
  color?: string | null;
  is_pinned?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}; 