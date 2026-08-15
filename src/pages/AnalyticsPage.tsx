import { useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  Users,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { PLATFORMS, type Platform } from '@/lib/types';

const platformIcons: Record<Platform, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  linkedin: Linkedin,
};

interface PlatformStat {
  platform: Platform;
  reach: number;
  engagement: number;
  posts: number;
  followers: number;
  rate: number;
}

const demoStats: PlatformStat[] = [
  { platform: 'instagram', reach: 12450, engagement: 890, posts: 24, followers: 3200, rate: 7.2 },
  { platform: 'facebook', reach: 8200, engagement: 410, posts: 18, followers: 2100, rate: 5.0 },
  { platform: 'youtube', reach: 15600, engagement: 1240, posts: 12, followers: 4500, rate: 7.9 },
  { platform: 'linkedin', reach: 6800, engagement: 520, posts: 15, followers: 1800, rate: 7.6 },
];

export function AnalyticsPage() {
  const totals = useMemo(() => {
    return demoStats.reduce(
      (acc, s) => ({
        reach: acc.reach + s.reach,
        engagement: acc.engagement + s.engagement,
        posts: acc.posts + s.posts,
        followers: acc.followers + s.followers,
      }),
      { reach: 0, engagement: 0, posts: 0, followers: 0 },
    );
  }, []);

  const engagementRate = ((totals.engagement / totals.reach) * 100).toFixed(1);

  const statCards = [
    { label: 'Total Posts', value: totals.posts, icon: BarChart3, color: 'text-primary-600 bg-primary-50 dark:bg-primary-600/10' },
    { label: 'Total Reach', value: totals.reach.toLocaleString(), icon: Eye, color: 'text-accent-600 bg-accent-50 dark:bg-accent-600/10' },
    { label: 'Engagement', value: totals.engagement.toLocaleString(), icon: Heart, color: 'text-error-600 bg-error-50 dark:bg-error-600/10' },
    { label: 'Engagement Rate', value: `${engagementRate}%`, icon: TrendingUp, color: 'text-success-600 bg-success-50 dark:bg-success-600/10' },
  ];

  const maxReach = Math.max(...demoStats.map((s) => s.reach));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your content performance across platforms.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-600/15 dark:text-amber-500">
          Demo Analytics
        </span>
      </div>

      <div className="rounded-xl bg-amber-50 dark:bg-amber-600/10 border border-amber-100 dark:border-amber-600/20 p-3">
        <p className="text-xs text-amber-700 dark:text-amber-500">
          These are simulated analytics for demonstration. They do not reflect real social platform data.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} hover>
            <CardBody className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Platform breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Breakdown</CardTitle>
        </CardHeader>
        <CardBody className="space-y-6">
          {demoStats.map((stat) => {
            const p = PLATFORMS.find((x) => x.id === stat.platform)!;
            const Icon = platformIcons[stat.platform];
            const widthPct = (stat.reach / maxReach) * 100;
            return (
              <div key={stat.platform} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon style={{ color: p.color }} className="h-5 w-5" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>{stat.posts} posts</span>
                    <span>{stat.reach.toLocaleString()} reach</span>
                    <span>{stat.rate}% rate</span>
                  </div>
                </div>
                <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${widthPct}%`, backgroundColor: p.color }}
                  />
                </div>
              </div>
            );
          })}
        </CardBody>
      </Card>

      {/* Detailed stats per platform */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {demoStats.map((stat) => {
          const p = PLATFORMS.find((x) => x.id === stat.platform)!;
          const Icon = platformIcons[stat.platform];
          return (
            <Card key={stat.platform} hover>
              <CardBody className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${p.color}15` }}>
                    <Icon style={{ color: p.color }} className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{p.name}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Eye className="h-3 w-3" /> Reach</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{stat.reach.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Heart className="h-3 w-3" /> Engagement</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{stat.engagement.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Users className="h-3 w-3" /> Followers</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{stat.followers.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Rate</span>
                    <span className="text-sm font-medium text-success-600 dark:text-success-500">{stat.rate}%</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
