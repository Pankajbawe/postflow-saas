import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Upload,
  Type,
  Wand2,
  Copy,
  RefreshCw,
  Check,
  Rocket,
  Loader2,
  TrendingUp,
  Hash,
  MessageSquare,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { PlatformIcon } from '@/components/ui/Platform';
import { PLATFORMS, type Platform, type PlatformContent, AI_MONTHLY_LIMIT } from '@/lib/types';
import { TONES, GOALS, LANGUAGES } from '@/lib/constants';
import { DemoAIProvider } from '@/lib/demoAI';

type SourceType = 'text' | 'image' | 'video';

export function AIRepurposePage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const [sourceType, setSourceType] = useState<SourceType>('text');
  const [sourceText, setSourceText] = useState('');
  const [sourceMediaUrl, setSourceMediaUrl] = useState<string | null>(null);
  const [mediaName, setMediaName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [platforms, setPlatforms] = useState<Set<Platform>>(new Set(['instagram', 'facebook']));
  const [tone, setTone] = useState<(typeof TONES)[number]>('Professional');
  const [goal, setGoal] = useState<(typeof GOALS)[number]>('Engagement');
  const [language, setLanguage] = useState<(typeof LANGUAGES)[number]>('English');
  const [brandVoice, setBrandVoice] = useState('');

  const [generated, setGenerated] = useState<Record<string, PlatformContent> | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Platform>('instagram');
  const [copied, setCopied] = useState<string | null>(null);

  const [usage, setUsage] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const loadUsage = async () => {
    const { data } = await supabase
      .from('ai_usage')
      .select('*')
      .eq('user_id', user!.id)
      .eq('month', currentMonth)
      .maybeSingle();
    setUsage(data?.generations_used ?? 0);
  };

  useEffect(() => {
    loadUsage();
  }, []);

  const remaining = AI_MONTHLY_LIMIT - usage;
  const limitReached = remaining <= 0;

  const togglePlatform = (p: Platform) => {
    setPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload an image or video.');
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
    const { error: uploadErr } = await supabase.storage.from('media').upload(path, file, { contentType: file.type });
    if (uploadErr) {
      setError(`Upload failed: ${uploadErr.message}`);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
    setSourceMediaUrl(urlData.publicUrl);
    setSourceType(file.type.startsWith('image/') ? 'image' : 'video');
    setMediaName(file.name);
    setUploading(false);
    addNotification({ title: 'Media uploaded', message: `${file.name} uploaded.`, type: 'success' });
  };

  const incrementUsage = async () => {
    const { data: existing } = await supabase
      .from('ai_usage')
      .select('*')
      .eq('user_id', user!.id)
      .eq('month', currentMonth)
      .maybeSingle();

    if (existing) {
      const { data } = await supabase
        .from('ai_usage')
        .update({ generations_used: existing.generations_used + 1 })
        .eq('id', existing.id)
        .select('*')
        .single();
      setUsage(data?.generations_used ?? existing.generations_used + 1);
    } else {
      const { data } = await supabase
        .from('ai_usage')
        .insert({ user_id: user!.id, month: currentMonth, generations_used: 1 })
        .select('*')
        .single();
      setUsage(data?.generations_used ?? 1);
    }
  };

  const handleRepurpose = async () => {
    if (limitReached) return;
    if (!sourceText.trim() && !sourceMediaUrl) {
      setError('Please add source content (text or media).');
      return;
    }
    if (platforms.size === 0) {
      setError('Please select at least one platform.');
      return;
    }

    setError(null);
    setAnalyzing(true);
    setGenerated(null);

    // Simulate AI processing
    await new Promise((r) => setTimeout(r, 2000));

    const platformList = [...platforms];
    const content = DemoAIProvider.generateAll(
      {
        sourceText,
        sourceType,
        tone,
        goal,
        language,
        brandVoice: brandVoice || undefined,
        platforms: platformList,
      },
      Date.now(),
    );

    setGenerated(content);
    setActiveTab(platformList[0]);
    setAnalyzing(false);
    await incrementUsage();

    // Save session
    const { data: session } = await supabase
      .from('repurpose_sessions')
      .insert({
        user_id: user!.id,
        source_media_url: sourceMediaUrl,
        source_text: sourceText,
        source_type: sourceType,
        platforms: platformList,
        tone,
        goal,
        language,
        brand_voice: brandVoice || null,
        generated_content: content,
      })
      .select('*')
      .single();

    if (session) setSessionId(session.id);

    addNotification({
      title: 'Content generated',
      message: `AI repurposed content for ${platformList.length} platform(s).`,
      type: 'success',
    });
  };

  const handleRegenerate = async (platform: Platform) => {
    if (!generated) return;
    setRegenerating(platform);
    await new Promise((r) => setTimeout(r, 1500));

    const newContent = DemoAIProvider.generatePlatformContent(
      platform,
      { sourceText, sourceType, tone, goal, language, brandVoice: brandVoice || undefined },
      Date.now(),
    );
    setGenerated({ ...generated, [platform]: newContent });
    setRegenerating(null);
    await incrementUsage();
    addNotification({ title: 'Content regenerated', message: `${platform} content updated.`, type: 'info' });
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleEditField = (platform: Platform, field: keyof PlatformContent, value: string | string[]) => {
    if (!generated) return;
    setGenerated({
      ...generated,
      [platform]: { ...generated[platform], [field]: value },
    });
  };

  const handleCreatePosts = () => {
    if (!generated) return;
    const platformList = [...platforms];
    // Navigate to create post with the first platform's content prefilled
    const firstContent = generated[platformList[0]];
    const caption = firstContent.caption || firstContent.post || firstContent.description || '';
    const postTitle = firstContent.title || firstContent.hook || firstContent.professional_hook || title || '';

    navigate('/create-post', {
      state: {
        prefill: {
          title: postTitle,
          caption,
          platforms: platformList,
        },
      },
    });
  };

  const renderContentField = (
    platform: Platform,
    field: keyof PlatformContent,
    label: string,
    value: string | string[] | undefined,
    multiline = false,
  ) => {
    if (!value) return null;
    const fieldKey = `${platform}-${field}`;
    const isCopied = copied === fieldKey;
    return (
      <div key={fieldKey} className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
          <button
            onClick={() => handleCopy(typeof value === 'string' ? value : value.join(' '), fieldKey)}
            className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
          >
            {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {isCopied ? 'Copied' : 'Copy'}
          </button>
        </div>
        {multiline ? (
          <textarea
            value={typeof value === 'string' ? value : value.join(', ')}
            onChange={(e) => handleEditField(platform, field, e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-y"
          />
        ) : (
          <input
            value={typeof value === 'string' ? value : value.join(', ')}
            onChange={(e) => handleEditField(platform, field, e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
        )}
      </div>
    );
  };

  const renderPlatformContent = (platform: Platform) => {
    const content = generated?.[platform];
    if (!content) return null;

    const fields: { field: keyof PlatformContent; label: string; multiline?: boolean }[] = [];

    switch (platform) {
      case 'instagram':
        fields.push(
          { field: 'hook', label: 'Hook' },
          { field: 'caption', label: 'Caption', multiline: true },
          { field: 'hashtags', label: 'Hashtags' },
          { field: 'cta', label: 'CTA' },
        );
        break;
      case 'facebook':
        fields.push(
          { field: 'hook', label: 'Hook' },
          { field: 'caption', label: 'Caption', multiline: true },
          { field: 'cta', label: 'CTA' },
        );
        break;
      case 'youtube':
        fields.push(
          { field: 'title', label: 'Title' },
          { field: 'description', label: 'Description', multiline: true },
          { field: 'tags', label: 'Tags' },
          { field: 'cta', label: 'CTA' },
        );
        break;
      case 'linkedin':
        fields.push(
          { field: 'professional_hook', label: 'Professional Hook' },
          { field: 'post', label: 'Post', multiline: true },
          { field: 'key_takeaway', label: 'Key Takeaway', multiline: true },
          { field: 'cta', label: 'CTA' },
          { field: 'hashtags', label: 'Hashtags' },
        );
        break;
    }

    return (
      <div className="space-y-4">
        {fields.map(({ field, label, multiline }) =>
          renderContentField(platform, field, label, content[field], multiline),
        )}
        {content.score !== undefined && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-600/10 dark:to-accent-600/10">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">AI Demo Content Score</p>
              <p className="text-lg font-bold text-primary-700 dark:text-primary-400">{content.score}/100</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const sourceTypes = [
    { id: 'text' as SourceType, label: 'Text / Script', icon: Type },
    { id: 'image' as SourceType, label: 'Image', icon: Upload },
    { id: 'video' as SourceType, label: 'Video', icon: Upload },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Content Repurposing</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Turn one piece of content into platform-ready posts in seconds.
        </p>
      </div>

      {/* Usage limit */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-600/10 dark:to-accent-600/10 border border-primary-100 dark:border-primary-600/20">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary-600" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              AI Generations: {usage} / {AI_MONTHLY_LIMIT} used
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {limitReached ? 'You have reached your monthly AI generation limit.' : `${remaining} generation(s) remaining`}
            </p>
          </div>
        </div>
        {limitReached && (
          <Button size="sm" variant="primary">
            Upgrade Plan
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-error-50 dark:bg-error-600/10 text-error-700 dark:text-error-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="space-y-6">
          {/* Source type tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Source Content</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex gap-2">
                {sourceTypes.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      setSourceType(st.id);
                      setSourceMediaUrl(null);
                      setMediaName(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      sourceType === st.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <st.icon className="h-4 w-4" /> {st.label}
                  </button>
                ))}
              </div>

              {sourceType === 'text' ? (
                <Textarea
                  placeholder="Paste your script, blog post, or any text content here..."
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  rows={8}
                />
              ) : (
                <div>
                  {sourceMediaUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                      {sourceType === 'image' ? (
                        <img src={sourceMediaUrl} alt="" className="w-full max-h-48 object-cover" />
                      ) : (
                        <video src={sourceMediaUrl} controls className="w-full max-h-48 object-cover" />
                      )}
                      <p className="p-2 text-xs text-gray-500 truncate">{mediaName}</p>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary-400 cursor-pointer transition-colors">
                      {uploading ? (
                        <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-gray-400" />
                          <span className="text-sm text-gray-500">Upload {sourceType}</span>
                        </>
                      )}
                      <input type="file" accept={sourceType === 'image' ? 'image/*' : 'video/*'} onChange={handleUpload} className="hidden" disabled={uploading} />
                    </label>
                  )}
                </div>
              )}

              {sourceType !== 'text' && (
                <Textarea
                  label="Additional context (optional)"
                  placeholder="Add any context about your media..."
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  rows={3}
                />
              )}
            </CardBody>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Platforms</label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map((p) => {
                    const checked = platforms.has(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all border-2 ${
                          checked
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-600/10'
                            : 'border-transparent bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100'
                        }`}
                      >
                        <input type="checkbox" checked={checked} onChange={() => togglePlatform(p.id)} className="sr-only" />
                        <PlatformIcon platform={p.id} size={18} />
                        <span className="text-sm font-medium">{p.name}</span>
                        {checked && <Check className="h-4 w-4 text-primary-600 ml-auto" />}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as typeof tone)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  >
                    {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Goal</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as typeof goal)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  >
                    {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as typeof language)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  >
                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <Input
                  label="Brand Voice"
                  placeholder="e.g. Bold, witty"
                  value={brandVoice}
                  onChange={(e) => setBrandVoice(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleRepurpose}
                loading={analyzing}
                disabled={limitReached}
              >
                <Wand2 className="h-5 w-5" /> Repurpose Content
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* Right: Output */}
        <div className="space-y-6">
          {analyzing ? (
            <Card>
              <CardBody className="py-16 flex flex-col items-center gap-4">
                <div className="relative">
                  <Sparkles className="h-12 w-12 text-primary-600 animate-pulse" />
                  <div className="absolute inset-0 animate-ping opacity-20">
                    <Sparkles className="h-12 w-12 text-primary-600" />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">AI is analyzing your content...</p>
                <div className="flex gap-2">
                  <Hash className="h-4 w-4 text-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <MessageSquare className="h-4 w-4 text-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <TrendingUp className="h-4 w-4 text-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </CardBody>
            </Card>
          ) : generated ? (
            <Card>
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between mb-3">
                  <CardTitle>Generated Content</CardTitle>
                  <Button size="sm" onClick={handleCreatePosts}>
                    <Rocket className="h-4 w-4" /> Create Posts
                  </Button>
                </div>
                <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1">
                  {[...platforms].map((p) => (
                    <button
                      key={p}
                      onClick={() => setActiveTab(p)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        activeTab === p
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <PlatformIcon platform={p} size={14} />
                      {PLATFORMS.find((x) => x.id === p)?.name}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardBody>
                {regenerating === activeTab ? (
                  <div className="py-12 flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
                    <p className="text-sm text-gray-500">Regenerating {PLATFORMS.find((p) => p.id === activeTab)?.name}...</p>
                  </div>
                ) : (
                  <>
                    {renderPlatformContent(activeTab)}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRegenerate(activeTab)}
                        disabled={limitReached}
                      >
                        <RefreshCw className="h-4 w-4" /> Regenerate
                      </Button>
                    </div>
                  </>
                )}
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody className="py-16 flex flex-col items-center gap-3 text-center">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-600/10 dark:to-accent-600/10">
                  <Wand2 className="h-10 w-10 text-primary-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Ready to repurpose</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                  Add your source content, choose platforms and settings, then click Repurpose to generate platform-specific posts.
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
