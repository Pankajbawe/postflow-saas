import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Search,
  Eye,
  Trash2,
  Calendar,
  History,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNotifications } from '@/context/NotificationContext';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PlatformIcon, StatusBadge } from '@/components/ui/Platform';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { PLATFORMS, type Post, type PostPlatform, type PostStatus } from '@/lib/types';

type Filter = 'all' | PostStatus;

export function PostHistoryPage() {
  const { addNotification } = useNotifications();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState<(Post & { post_platforms: PostPlatform[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [preview, setPreview] = useState<(Post & { post_platforms: PostPlatform[] }) | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('posts')
      .select('*, post_platforms(*)')
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setPosts(data as (Post & { post_platforms: PostPlatform[] })[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const filtered = useMemo(() => {
    let result = posts;
    if (filter !== 'all') {
      result = result.filter((p) => p.status === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          (p.title ?? '').toLowerCase().includes(q) ||
          p.caption.toLowerCase().includes(q),
      );
    }
    return result;
  }, [posts, filter, search]);

  const handleDelete = async (post: Post) => {
    setDeleting(post.id);
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (error) {
      addNotification({ title: 'Delete failed', message: error.message, type: 'error' });
    } else {
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      addNotification({ title: 'Post deleted', message: post.title || 'Untitled post', type: 'info' });
    }
    setDeleting(null);
  };

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Draft' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'published', label: 'Published' },
    { id: 'failed', label: 'Failed' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Post History</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Browse and manage all your posts across every status.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by title or caption..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                filter === f.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={loadPosts} />}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<History className="h-6 w-6" />}
              title="No posts found"
              description={search || filter !== 'all' ? 'Try adjusting your filters or search.' : 'Create your first post to see it here.'}
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Post</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Platforms</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Date</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((post) => (
                    <tr key={post.id} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {post.media_url ? (
                              <img src={post.media_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <FileText className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                              {post.title || 'Untitled post'}
                            </p>
                            <p className="text-xs text-gray-400 truncate max-w-[200px]">{post.caption.slice(0, 50)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {post.post_platforms?.map((pp) => (
                            <PlatformIcon key={pp.id} platform={pp.platform} size={16} />
                          ))}
                          {(!post.post_platforms || post.post_platforms.length === 0) && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={post.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPreview(post)}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(post)}
                            className="p-2 rounded-lg text-gray-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-600/10 transition-colors"
                            title="Delete"
                          >
                            {deleting === post.id ? (
                              <div className="h-4 w-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((post) => (
                <div key={post.id} className="p-4">
                  <div className="flex items-start gap-3">
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
                      <p className="text-xs text-gray-400 truncate mt-0.5">{post.caption.slice(0, 60)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex gap-1">
                          {post.post_platforms?.map((pp) => (
                            <PlatformIcon key={pp.id} platform={pp.platform} size={14} />
                          ))}
                        </div>
                        <StatusBadge status={post.status} />
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <button
                          onClick={() => setPreview(post)}
                          className="text-xs text-primary-600 font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(post)}
                          className="text-xs text-error-600 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Preview modal */}
      <Modal open={preview !== null} onClose={() => setPreview(null)} title="Post Details" size="lg">
        {preview && (
          <div className="space-y-4">
            {preview.media_url && (
              preview.media_type === 'image' ? (
                <img src={preview.media_url} alt="" className="w-full rounded-xl" />
              ) : (
                <video src={preview.media_url} controls className="w-full rounded-xl" />
              )
            )}
            {preview.title && <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{preview.title}</h3>}
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{preview.caption}</p>
            <div className="flex items-center gap-2">
              <StatusBadge status={preview.status} />
              <span className="text-xs text-gray-400">
                {new Date(preview.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
            {preview.post_platforms && preview.post_platforms.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                {preview.post_platforms.map((pp) => (
                  <div key={pp.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <PlatformIcon platform={pp.platform} size={16} />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                      {PLATFORMS.find((p) => p.id === pp.platform)?.name}
                    </span>
                    <StatusBadge status={pp.status} />
                    {pp.published_url && (
                      <a href={pp.published_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">
                        View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
