import { type ReactNode } from 'react';
import {
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  type LucideIcon,
} from 'lucide-react';
import type { Platform } from '@/lib/types';
import { platformColor } from '@/lib/types';

const iconMap: Record<Platform, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  linkedin: Linkedin,
};

export function PlatformIcon({
  platform,
  className,
  size = 18,
}: {
  platform: Platform;
  className?: string;
  size?: number;
}) {
  const Icon = iconMap[platform];
  return <Icon style={{ color: platformColor(platform) }} className={className} size={size} />;
}

export function PlatformBadge({
  platform,
  children,
}: {
  platform: Platform;
  children?: ReactNode;
}) {
  const Icon = iconMap[platform];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
      <Icon style={{ color: platformColor(platform) }} size={14} />
      {children}
    </span>
  );
}

const statusConfig = {
  draft: { label: 'Draft', class: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  scheduled: { label: 'Scheduled', class: 'bg-warning-100 text-warning-700 dark:bg-warning-600/15 dark:text-warning-500' },
  published: { label: 'Published', class: 'bg-success-100 text-success-700 dark:bg-success-600/15 dark:text-success-500' },
  failed: { label: 'Failed', class: 'bg-error-100 text-error-700 dark:bg-error-600/15 dark:text-error-500' },
  cancelled: { label: 'Cancelled', class: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500' },
  pending: { label: 'Pending', class: 'bg-primary-100 text-primary-700 dark:bg-primary-600/15 dark:text-primary-400' },
  connected: { label: 'Connected', class: 'bg-success-100 text-success-700 dark:bg-success-600/15 dark:text-success-500' },
  disconnected: { label: 'Disconnected', class: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.draft;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${config.class}`}>
      {config.label}
    </span>
  );
}
