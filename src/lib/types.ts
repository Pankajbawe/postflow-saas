export type Platform = 'instagram' | 'facebook' | 'youtube' | 'linkedin';

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

export type MediaType = 'image' | 'video';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: Platform;
  account_name: string;
  account_username: string | null;
  account_id: string | null;
  status: 'connected' | 'disconnected';
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  title: string | null;
  caption: string;
  media_url: string | null;
  media_type: MediaType | null;
  status: PostStatus;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostPlatform {
  id: string;
  post_id: string;
  platform: Platform;
  status: PostStatus;
  published_url: string | null;
  published_at: string | null;
}

export interface ScheduledPost {
  id: string;
  post_id: string;
  user_id: string;
  scheduled_at: string;
  status: 'scheduled' | 'published' | 'cancelled';
  published_at: string | null;
  created_at: string;
}

export interface RepurposeSession {
  id: string;
  user_id: string;
  source_media_url: string | null;
  source_text: string | null;
  source_type: 'text' | 'image' | 'video';
  platforms: Platform[];
  tone: string;
  goal: string;
  language: string;
  brand_voice: string | null;
  generated_content: Record<string, PlatformContent>;
  created_at: string;
  updated_at: string;
}

export interface AiUsage {
  id: string;
  user_id: string;
  month: string;
  generations_used: number;
  created_at: string;
  updated_at: string;
}

export interface PlatformContent {
  hook?: string;
  caption?: string;
  hashtags?: string[];
  cta?: string;
  title?: string;
  description?: string;
  tags?: string[];
  post?: string;
  key_takeaway?: string;
  professional_hook?: string;
  score?: number;
}

export const PLATFORMS: { id: Platform; name: string; color: string }[] = [
  { id: 'instagram', name: 'Instagram', color: '#E1306C' },
  { id: 'facebook', name: 'Facebook', color: '#1877F2' },
  { id: 'youtube', name: 'YouTube', color: '#FF0000' },
  { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2' },
];

export const platformName = (p: Platform): string =>
  PLATFORMS.find((x) => x.id === p)?.name ?? p;

export const platformColor = (p: Platform): string =>
  PLATFORMS.find((x) => x.id === p)?.color ?? '#6B7280';

export const AI_MONTHLY_LIMIT = 10;
