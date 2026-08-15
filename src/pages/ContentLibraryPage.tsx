import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Image as ImageIcon,
  Video,
  Download,
  Trash2,
  Eye,
  PenSquare,
  Library,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';

interface MediaItem {
  name: string;
  url: string;
  type: 'image' | 'video';
  size: number;
  created_at: string;
}

export function ContentLibraryPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadMedia = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.storage.from('media').list(user!.id, {
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    const mediaItems: MediaItem[] = (data ?? [])
      .filter((f) => !f.id.endsWith('.emptyFolderPlaceholder'))
      .map((f) => {
        const path = `${user!.id}/${f.name}`;
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
        const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
        const isVideo = ['mp4', 'webm', 'mov', 'avi'].includes(ext);
        return {
          name: f.name,
          url: urlData.publicUrl,
          type: isVideo ? 'video' : 'image',
          size: f.metadata?.size ?? 0,
          created_at: f.created_at ?? new Date().toISOString(),
        };
      });
    setItems(mediaItems);
    setLoading(false);
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const filtered = filter === 'all' ? items : items.filter((i) => i.type === filter);

  const handleDownload = async (item: MediaItem) => {
    try {
      const { data, error } = await supabase.storage.from('media').download(`${user!.id}/${item.name}`);
      if (error) throw error;
      const blob = data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addNotification({ title: 'Download started', message: item.name, type: 'info' });
    } catch (err) {
      addNotification({ title: 'Download failed', message: err instanceof Error ? err.message : 'Unknown error', type: 'error' });
    }
  };

  const handleDelete = async (item: MediaItem) => {
    setDeleting(item.name);
    const { error } = await supabase.storage.from('media').remove([`${user!.id}/${item.name}`]);
    if (error) {
      addNotification({ title: 'Delete failed', message: error.message, type: 'error' });
    } else {
      setItems((prev) => prev.filter((i) => i.name !== item.name));
      addNotification({ title: 'Media deleted', message: item.name, type: 'info' });
    }
    setDeleting(null);
  };

  const handleUseInPost = (item: MediaItem) => {
    navigate('/create-post', {
      state: { prefillMedia: { url: item.url, type: item.type, name: item.name } },
    });
  };

  const filters = [
    { id: 'all' as const, label: 'All', icon: Library },
    { id: 'image' as const, label: 'Images', icon: ImageIcon },
    { id: 'video' as const, label: 'Videos', icon: Video },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Library</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Your uploaded media files, organized and ready to use.
          </p>
        </div>
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <f.icon className="h-4 w-4" /> {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={loadMedia} />}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Library className="h-6 w-6" />}
              title="No media yet"
              description="Upload images or videos from the Create Post page to build your library."
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <Card key={item.name} hover className="overflow-hidden group">
              <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                {item.type === 'image' ? (
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <video src={item.url} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => setPreview(item)}
                    className="p-2 rounded-lg bg-white/90 text-gray-900 hover:bg-white transition-colors"
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleUseInPost(item)}
                    className="p-2 rounded-lg bg-white/90 text-gray-900 hover:bg-white transition-colors"
                    title="Use in Post"
                  >
                    <PenSquare className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(item)}
                    className="p-2 rounded-lg bg-white/90 text-gray-900 hover:bg-white transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-2 rounded-lg bg-white/90 text-error-600 hover:bg-white transition-colors"
                    title="Delete"
                  >
                    {deleting === item.name ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/60 text-white">
                  {item.type}
                </span>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Preview modal */}
      <Modal open={preview !== null} onClose={() => setPreview(null)} title={preview?.name ?? ''} size="lg">
        {preview && (
          <div className="space-y-3">
            {preview.type === 'image' ? (
              <img src={preview.url} alt={preview.name} className="w-full rounded-xl" />
            ) : (
              <video src={preview.url} controls className="w-full rounded-xl" />
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleDownload(preview)}>
                <Download className="h-4 w-4" /> Download
              </Button>
              <Button size="sm" onClick={() => handleUseInPost(preview)}>
                <PenSquare className="h-4 w-4" /> Use in Post
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
