import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PenSquare,
  FileText,
  CheckCircle2,
  CalendarClock,
  XCircle,
  ArrowRight,
  Share2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PlatformIcon, StatusBadge, PlatformBadge } from '@/components/ui/Platform';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { PLATFORMS, type Platform, type Post, type PostPlatform, type SocialAccount } from '@/lib/types';

interface Stats {
  total: number;
  published: number;
  scheduled: number;
  failed: number;
}

export function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [recentPosts, setRecentPosts] = useState<(Post & { platforms?: PostPlatform[] })[]>([]);
  const [upcoming, setUpcoming] = useState<(Post & { platforms?: PostPlatform[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [postsRes, accountsRes] = await Promise.all([
        supabase.from('posts').select('*, post_platforms(*)').order('created_at', { ascending: false }),
        supabase.from('social_accounts').select('*').order('created_at', { ascending: true }),
      ]);

      if (postsRes.error) throw postsRes.error;
      if (accountsRes.error) throw accountsRes.error;

      const posts = postsRes.data as (Post & { post_platforms: PostPlatform[] })[];
      setAccounts(accountsRes.data as SocialAccount[]);

      setStats({
        total: posts.length,
        published: posts.filter((p) => p.status === 'published').length,
        scheduled: posts.filter((p) => p.status === 'scheduled').length,
        failed: posts.filter((p) => p.status === 'failed').length,
      });

      setRecentPosts(posts.slice(0, 5));

      const now = new Date().toISOString();
      setUpcoming(
        posts
          .filter((p) => p.status === 'scheduled' && p.scheduled_at && p.scheduled_at > now)
          .sort((a, b) => (a.scheduled_at! < b.scheduled_at! ? -1 : 1))
          .slice(0, 5),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  const statCards = [
    { label: 'Total Posts', value: stats?.total, icon: FileText, color: 'text-primary-600 bg-primary-50 dark:bg-primary-600/10' },
    { label: 'Published', value: stats?.published, icon: CheckCircle2, color: 'text-success-600 bg-success-50 dark:bg-success-600/10' },
    { label: 'Scheduled', value: stats?.scheduled, icon: CalendarClock, color: 'text-warning-600 bg-warning-50 dark:bg-warning-600/10' },
    { label: 'Failed', value: stats?.failed, icon: XCircle, color: 'text-error-600 bg-error-50 dark:bg-error-600/10' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Here is what is happening with your content today.
          </p>
        </div>
        <Link to="/create-post">
          <Button size="lg">
            <PenSquare className="h-5 w-5" /> Create Post
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} hover>
            <CardBody className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value ?? 0}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {error && <ErrorState message={error} onRetry={loadData} />}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Connected Accounts */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Connected Accounts</CardTitle>
            <Link to="/social-accounts" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Manage <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardBody className="space-y-3">
            {loading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : (
              PLATFORMS.map((p: { id: Platform; name: string }) => {
                const acct = accounts.find((a) => a.platform === p.id);
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <PlatformIcon platform={p.id} size={22} />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {acct ? `@${acct.account_username ?? acct.account_name}` : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                        acct
                          ? 'bg-success-100 text-success-700 dark:bg-success-600/15 dark:text-success-500'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {acct ? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                );
              })
            )}
          </CardBody>
        </Card>

        {/* Upcoming Scheduled */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Upcoming Scheduled</CardTitle>
            <Link to="/calendar" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Calendar <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardBody>
            {loading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full mb-2" />)
            ) : upcoming.length === 0 ? (
              <EmptyState
                icon={<CalendarClock className="h-6 w-6" />}
                title="No upcoming posts"
                description="Schedule posts to see them here."
              />
            ) : (
              <div className="space-y-3">
                {upcoming.map((post) => (
                  <div key={post.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {post.title || 'Untitled post'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {new Date(post.scheduled_at!).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <StatusBadge status={post.status} />
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Recent Posts</CardTitle>
          <Link to="/post-history" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardBody>
          {loading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full mb-2" />)
          ) : recentPosts.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="No posts yet"
              description="Create your first post to get started."
              action={
                <Link to="/create-post">
                  <Button size="sm"><PenSquare className="h-4 w-4" /> Create Post</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {post.media_url ? (
                      <img src={post.media_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {post.title || 'Untitled post'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1">
                    {post.post_platforms?.map((pp) => (
                      <PlatformIcon key={pp.id} platform={pp.platform} size={16} />
                    ))}
                  </div>
                  <StatusBadge status={post.status} />
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
