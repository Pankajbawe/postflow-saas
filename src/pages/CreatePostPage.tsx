import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  X,
  Save,
  Send,
  CalendarClock,
  Eye,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PlatformIcon } from '@/components/ui/Platform';
import { PLATFORMS, type Platform, type PostStatus } from '@/lib/types';

interface PublishResult {
  platform: Platform;
  status: 'publishing' | 'published' | 'failed';
  url?: string;
}

export function CreatePostPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(new Set());
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [mediaName, setMediaName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<PublishResult[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [platformError, setPlatformError] = useState<string | null>(null);

  // Pre-fill from AI repurpose via location state
  useEffect(() => {
    const state = location.state as { prefill?: { title?: string; caption?: string; platforms?: Platform[] } } | null;
    if (state?.prefill) {
      if (state.prefill.title) setTitle(state.prefill.title);
      if (state.prefill.caption) setCaption(state.prefill.caption);
      if (state.prefill.platforms) setSelectedPlatforms(new Set(state.prefill.platforms));
    }
    // Also check query params for session-based prefill
    const sessionContent = searchParams.get('content');
    if (sessionContent) {
      try {
        const parsed = JSON.parse(decodeURIComponent(sessionContent));
        if (parsed.title) setTitle(parsed.title);
        if (parsed.caption) setCaption(parsed.caption);
        if (parsed.platforms) setSelectedPlatforms(new Set(parsed.platforms));
      } catch {
        // ignore
      }
    }
  }, [location, searchParams]);

  const togglePlatform = (p: Platform) => {
    setPlatformError(null);
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload an image (JPEG, PNG, WebP, GIF) or video (MP4, WebM).');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be under 50MB.');
      return;
    }

    setError(null);
    setUploading(true);

    const ext = file.name.split('.').pop();
    const path = `${user!.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from('media').upload(path, file, {
      contentType: file.type,
    });

    if (uploadErr) {
      setError(`Upload failed: ${uploadErr.message}`);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);

    setMediaUrl(urlData.publicUrl);
    setMediaType(file.type.startsWith('image/') ? 'image' : 'video');
    setMediaName(file.name);
    setUploading(false);
    addNotification({
      title: 'Media uploaded',
      message: `${file.name} has been uploaded successfully.`,
      type: 'success',
    });
  };

  const removeMedia = () => {
    setMediaUrl(null);
    setMediaType(null);
    setMediaName(null);
  };

  const validate = (): boolean => {
    if (!caption.trim() && !mediaUrl) {
      setError('Please add a caption or upload media.');
      return false;
    }
    if (selectedPlatforms.size === 0) {
      setPlatformError('Please select at least one platform.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSaveDraft = async () => {
    if (!caption.trim() && !mediaUrl) {
      setError('Please add a caption or upload media before saving.');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user!.id,
        title: title || null,
        caption,
        media_url: mediaUrl,
        media_type: mediaType,
        status: 'draft',
      })
      .select('*')
      .single();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    addNotification({ title: 'Draft saved', message: 'Your post has been saved as a draft.', type: 'success' });
    navigate('/post-history');
  };

  const handlePublish = async () => {
    if (!validate()) return;
    setShowPublish(true);
    setPublishing(true);
    setError(null);

    // Create post
    const { data: post, error: postErr } = await supabase
      .from('posts')
      .insert({
        user_id: user!.id,
        title: title || null,
        caption,
        media_url: mediaUrl,
        media_type: mediaType,
        status: 'publishing',
      })
      .select('*')
      .single();

    if (postErr || !post) {
      setError(postErr?.message ?? 'Failed to create post');
      setPublishing(false);
      return;
    }

    const platforms = [...selectedPlatforms];
    const results: PublishResult[] = platforms.map((p) => ({ platform: p, status: 'publishing' }));
    setPublishResults(results);

    // Simulate publishing per platform
    for (let i = 0; i < platforms.length; i++) {
      await new Promise((r) => setTimeout(r, 1200));
      const demoUrl = `https://${platforms[i]}.com/p/${crypto.randomUUID().slice(0, 8)}`;

      await supabase.from('post_platforms').insert({
        post_id: post.id,
        platform: platforms[i],
        status: 'published',
        published_url: demoUrl,
        published_at: new Date().toISOString(),
      });

      results[i] = { platform: platforms[i], status: 'published', url: demoUrl };
      setPublishResults([...results]);
    }

    // Update post status
    await supabase.from('posts').update({ status: 'published' }).eq('id', post.id);

    setPublishing(false);
    addNotification({
      title: 'Post published',
      message: `Published to ${platforms.length} platform(s). This is demo publishing only.`,
      type: 'success',
    });
  };

  const handleSchedule = async () => {
    if (!validate()) return;
    if (!scheduleDate || !scheduleTime) {
      setError('Please select a date and time.');
      return;
    }

    setSaving(true);
    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();

    const { data: post, error: postErr } = await supabase
      .from('posts')
      .insert({
        user_id: user!.id,
        title: title || null,
        caption,
        media_url: mediaUrl,
        media_type: mediaType,
        status: 'scheduled',
        scheduled_at: scheduledAt,
      })
      .select('*')
      .single();

    if (postErr || !post) {
      setError(postErr?.message ?? 'Failed to create post');
      setSaving(false);
      return;
    }

    // Create post_platforms
    for (const p of selectedPlatforms) {
      await supabase.from('post_platforms').insert({
        post_id: post.id,
        platform: p,
        status: 'scheduled',
      });
    }

    // Create scheduled_post
    await supabase.from('scheduled_posts').insert({
      post_id: post.id,
      user_id: user!.id,
      scheduled_at: scheduledAt,
      status: 'scheduled',
    });

    setSaving(false);
    setShowSchedule(false);
    addNotification({
      title: 'Post scheduled',
      message: `Scheduled for ${new Date(scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}. This is demo scheduling.`,
      type: 'success',
    });
    navigate('/calendar');
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Post</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Compose once and publish across all your connected platforms.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-error-50 dark:bg-error-600/10 text-error-700 dark:text-error-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Composer */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Post Details</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Post Title"
                placeholder="Give your post a title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Image / Video
                </label>
                {mediaUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    {mediaType === 'image' ? (
                      <img src={mediaUrl} alt="" className="w-full max-h-64 object-cover" />
                    ) : (
                      <video src={mediaUrl} controls className="w-full max-h-64 object-cover" />
                    )}
                    <button
                      onClick={removeMedia}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="p-2 text-xs text-gray-500 dark:text-gray-400 truncate">{mediaName}</p>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 cursor-pointer transition-colors">
                    {uploading ? (
                      <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
                    ) : (
                      <>
                        <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
                          <Upload className="h-6 w-6 text-gray-400" />
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Click to upload an image or video
                        </span>
                        <span className="text-xs text-gray-400">Max 50MB — JPEG, PNG, WebP, GIF, MP4, WebM</span>
                      </>
                    )}
                    <input type="file" accept="image/*,video/*" onChange={handleUpload} className="hidden" disabled={uploading} />
                  </label>
                )}
              </div>

              <Textarea
                label="Caption"
                placeholder="Write your caption here..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={6}
              />
            </CardBody>
          </Card>
        </div>

        {/* Right panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platforms</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2">
              {PLATFORMS.map((p) => {
                const checked = selectedPlatforms.has(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                      checked
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-600/10'
                        : 'border-transparent bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePlatform(p.id)}
                      className="sr-only"
                    />
                    <div className={`flex items-center justify-center h-5 w-5 rounded-md border-2 transition-all ${
                      checked ? 'bg-primary-600 border-primary-600' : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {checked && <CheckCircle2 className="h-4 w-4 text-white" />}
                    </div>
                    <PlatformIcon platform={p.id} size={20} />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</span>
                  </label>
                );
              })}
              {platformError && (
                <p className="text-sm text-error-600 dark:text-error-500 mt-2">{platformError}</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={handleSaveDraft} loading={saving}>
                <Save className="h-4 w-4" /> Save Draft
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => validate() && setShowPreview(true)}>
                <Eye className="h-4 w-4" /> Preview
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => { if (validate()) setShowSchedule(true); }}>
                <CalendarClock className="h-4 w-4" /> Schedule
              </Button>
              <Button className="w-full justify-start" onClick={handlePublish} loading={publishing}>
                <Send className="h-4 w-4" /> Publish Now
              </Button>
            </CardBody>
          </Card>

          <div className="rounded-xl bg-amber-50 dark:bg-amber-600/10 border border-amber-100 dark:border-amber-600/20 p-3">
            <p className="text-xs text-amber-700 dark:text-amber-500">
              Publishing and scheduling are simulated for demo purposes. No real social media APIs are called.
            </p>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal open={showPreview} onClose={() => setShowPreview(false)} title="Post Preview" size="lg">
        <div className="space-y-4">
          {selectedPlatforms.size === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Select at least one platform to preview.</p>
          ) : (
            [...selectedPlatforms].map((p) => (
              <div key={p} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50">
                  <PlatformIcon platform={p} size={18} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {PLATFORMS.find((x) => x.id === p)?.name}
                  </span>
                </div>
                <div className="p-4">
                  {mediaUrl && mediaType === 'image' && (
                    <img src={mediaUrl} alt="" className="w-full rounded-lg mb-3" />
                  )}
                  {mediaUrl && mediaType === 'video' && (
                    <video src={mediaUrl} controls className="w-full rounded-lg mb-3" />
                  )}
                  {title && <p className="font-semibold text-gray-900 dark:text-gray-50 mb-1">{title}</p>}
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{caption}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Publish Modal */}
      <Modal open={showPublish} onClose={() => {}} title="Publishing Post" size="md">
        <div className="py-4 space-y-4">
          <div className="rounded-xl bg-primary-50 dark:bg-primary-600/10 p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary-600 flex-shrink-0" />
            <p className="text-xs text-primary-700 dark:text-primary-400">
              This is demo publishing. No real social media APIs are called.
            </p>
          </div>
          {publishResults.map((r) => (
            <div key={r.platform} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <PlatformIcon platform={r.platform} size={20} />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1">
                {PLATFORMS.find((p) => p.id === r.platform)?.name}
              </span>
              {r.status === 'publishing' ? (
                <Loader2 className="h-5 w-5 text-primary-600 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success-600" />
                  <span className="text-sm text-success-600 dark:text-success-500 font-medium">Published</span>
                </div>
              )}
            </div>
          ))}
          {!publishing && publishResults.length > 0 && publishResults.every((r) => r.status === 'published') && (
            <Button className="w-full" onClick={() => navigate('/post-history')}>
              View in Post History
            </Button>
          )}
        </div>
      </Modal>

      {/* Schedule Modal */}
      <Modal open={showSchedule} onClose={() => setShowSchedule(false)} title="Schedule Post">
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose when your post should go live. This is demo scheduling — posts will not auto-publish to real platforms.
          </p>
          <Input
            type="date"
            label="Date"
            min={minDate}
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
          />
          <Input
            type="time"
            label="Time"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
          />
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div className="flex gap-1">
              {[...selectedPlatforms].map((p) => (
                <PlatformIcon key={p} platform={p} size={16} />
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {selectedPlatforms.size} platform(s) selected
            </span>
          </div>
          <Button className="w-full" onClick={handleSchedule} loading={saving}>
            Schedule Post
          </Button>
        </div>
      </Modal>
    </div>
  );
}
