import { useEffect, useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
  Edit2,
  CalendarClock,
  Trash2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNotifications } from '@/context/NotificationContext';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PlatformIcon, StatusBadge } from '@/components/ui/Platform';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { PLATFORMS, type Post, type PostPlatform } from '@/lib/types';

interface CalendarPost extends Post {
  post_platforms: PostPlatform[];
}

export function CalendarPage() {
  const { addNotification } = useNotifications();
  const [current, setCurrent] = useState(new Date());
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [editingPost, setEditingPost] = useState<CalendarPost | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [saving, setSaving] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('posts')
      .select('*, post_platforms(*)')
      .in('status', ['scheduled', 'published'])
      .order('scheduled_at', { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setPosts(data as CalendarPost[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const year = current.getFullYear();
  const month = current.getMonth();

  const monthData = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    return days;
  }, [year, month]);

  const postsByDay = useMemo(() => {
    const map = new Map<string, CalendarPost[]>();
    for (const post of posts) {
      if (!post.scheduled_at) continue;
      const d = new Date(post.scheduled_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(post);
    }
    return map;
  }, [posts]);

  const today = new Date();
  const isToday = (d: Date) =>
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  const monthName = current.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrent(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1));
  const goToday = () => setCurrent(new Date());

  const dayPosts = selectedDay
    ? postsByDay.get(`${selectedDay.getFullYear()}-${selectedDay.getMonth()}-${selectedDay.getDate()}`) ?? []
    : [];

  const handleReschedule = (post: CalendarPost) => {
    setEditingPost(post);
    const d = new Date(post.scheduled_at!);
    setEditDate(d.toISOString().split('T')[0]);
    setEditTime(d.toTimeString().slice(0, 5));
  };

  const handleSaveReschedule = async () => {
    if (!editingPost || !editDate || !editTime) return;
    setSaving(true);
    const scheduledAt = new Date(`${editDate}T${editTime}`).toISOString();
    const { error } = await supabase
      .from('posts')
      .update({ scheduled_at: scheduledAt })
      .eq('id', editingPost.id);
    if (!error) {
      await supabase.from('scheduled_posts').update({ scheduled_at: scheduledAt }).eq('post_id', editingPost.id);
      addNotification({ title: 'Post rescheduled', message: `Moved to ${new Date(scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`, type: 'success' });
      setEditingPost(null);
      loadPosts();
    }
    setSaving(false);
  };

  const handleCancel = async (post: CalendarPost) => {
    const { error } = await supabase.from('posts').update({ status: 'draft', scheduled_at: null }).eq('id', post.id);
    if (!error) {
      await supabase.from('scheduled_posts').update({ status: 'cancelled' }).eq('post_id', post.id);
      addNotification({ title: 'Post cancelled', message: 'Scheduled post has been cancelled.', type: 'info' });
      loadPosts();
    }
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and manage your scheduled and published posts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold min-w-[140px] text-center text-gray-900 dark:text-gray-100">{monthName}</span>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={goToday}>
            Today
          </Button>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={loadPosts} />}

      <Card>
        <CardBody className="p-3 sm:p-4">
          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {weekdays.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {loading ? (
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {[...Array(35)].map((_, i) => (
                <Skeleton key={i} className="h-20 sm:h-28" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {monthData.map((date, i) => {
                if (!date) return <div key={i} className="min-h-[60px] sm:min-h-[100px]" />;
                const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                const dayPostsList = postsByDay.get(key) ?? [];
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(date)}
                    className={`min-h-[60px] sm:min-h-[100px] p-1.5 rounded-lg text-left border transition-all hover:border-primary-400 hover:shadow-sm ${
                      isToday(date)
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-600/5'
                        : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                    }`}
                  >
                    <span className={`text-xs font-medium ${isToday(date) ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400'}`}>
                      {date.getDate()}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayPostsList.slice(0, 2).map((post) => (
                        <div
                          key={post.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${
                            post.status === 'published'
                              ? 'bg-success-100 text-success-700 dark:bg-success-600/15 dark:text-success-500'
                              : 'bg-warning-100 text-warning-700 dark:bg-warning-600/15 dark:text-warning-500'
                          }`}
                        >
                          {post.title || 'Post'}
                        </div>
                      ))}
                      {dayPostsList.length > 2 && (
                        <div className="text-[10px] text-gray-400 px-1">+{dayPostsList.length - 2} more</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Day detail modal */}
      <Modal
        open={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
        size="md"
      >
        {dayPosts.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon className="h-6 w-6" />}
            title="No posts on this day"
            description="Schedule a post for this date."
          />
        ) : (
          <div className="space-y-3">
            {dayPosts.map((post) => (
              <div key={post.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {post.title || 'Untitled post'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(post.scheduled_at!).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                  <StatusBadge status={post.status} />
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {post.post_platforms?.map((pp) => (
                    <PlatformIcon key={pp.id} platform={pp.platform} size={14} />
                  ))}
                </div>
                {post.status === 'scheduled' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleReschedule(post)}>
                      <Edit2 className="h-3.5 w-3.5" /> Reschedule
                    </Button>
                    <Button size="sm" variant="ghost" className="text-error-600" onClick={() => handleCancel(post)}>
                      <X className="h-3.5 w-3.5" /> Cancel
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Reschedule modal */}
      <Modal open={editingPost !== null} onClose={() => setEditingPost(null)} title="Reschedule Post" size="sm">
        {editingPost && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {editingPost.title || 'Untitled post'}
            </p>
            <Input type="date" label="Date" min={new Date().toISOString().split('T')[0]} value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            <Input type="time" label="Time" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
            <Button className="w-full" onClick={handleSaveReschedule} loading={saving}>
              <CalendarClock className="h-4 w-4" /> Save
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
