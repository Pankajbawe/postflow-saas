import type { Platform, PlatformContent } from './types';
import { platformName } from './types';
import type { TONES, GOALS, LANGUAGES } from './constants';

type Tone = (typeof TONES)[number];
type Goal = (typeof GOALS)[number];
type Language = (typeof LANGUAGES)[number];

interface AnalyzeInput {
  sourceText?: string;
  sourceType: 'text' | 'image' | 'video';
  tone: Tone;
  goal: Goal;
  language: Language;
  brandVoice?: string;
}

interface RepurposeInput extends AnalyzeInput {
  platforms: Platform[];
}

const HOOK_BANK: Record<Tone, string[]> = {
  Professional: [
    'Here is what most people get wrong about {topic}.',
    'A quick framework for mastering {topic}.',
    'After 5 years in this space, this is the lesson I keep coming back to.',
  ],
  Casual: [
    'Okay, can we talk about {topic} for a sec?',
    'Nobody warned me about this side of {topic}...',
    "Real talk: {topic} changed how I work this year.",
  ],
  Educational: [
    '{topic}, explained in 60 seconds.',
    '3 things you need to know about {topic}.',
    'A simple breakdown of {topic} anyone can use.',
  ],
  Friendly: [
    "Hey friends! Let's dive into {topic} today.",
    'You asked about {topic} — here is my honest take.',
    "So glad you are here. Let's explore {topic} together.",
  ],
  Bold: [
    'Stop scrolling. {topic} is about to change your strategy.',
    'Everyone is sleeping on {topic}. Not you.',
    'This is the {topic} take nobody wants to hear.',
  ],
  Funny: [
    'Me, 2 AM: what if {topic} but make it chaotic?',
    'POV: you tried {topic} and it actually worked (shocking).',
    "{topic}? In THIS economy? Let's go.",
  ],
  Storytelling: [
    'Two years ago I knew nothing about {topic}. Here is what happened.',
    'It started with one small experiment with {topic}...',
    'I almost gave up on {topic}. Then this happened.',
  ],
  Promotional: [
    'Looking for the best way to handle {topic}? This is it.',
    'We just dropped something for {topic} you will love.',
    'Your {topic} workflow is about to get a major upgrade.',
  ],
};

const CTA_BANK: Record<Goal, string[]> = {
  Engagement: [
    'Drop your thoughts in the comments — I read every one.',
    'Which part resonated most? Let me know below.',
    'Tag someone who needs to see this.',
  ],
  Education: [
    'Save this post for later — you will need it.',
    'Follow for more breakdowns like this.',
    'Share this with someone learning the ropes.',
  ],
  'Brand Awareness': [
    'Follow us for more on {topic}.',
    'Hit follow so you never miss an update.',
    'Share this to spread the word.',
  ],
  'Lead Generation': [
    'DM us "GROW" to get started.',
    'Click the link in bio to book a free call.',
    'Comment "INFO" and we will send you the details.',
  ],
  Sales: [
    'Limited spots — link in bio to grab yours.',
    'Shop now while it is still available.',
    'Use code POSTFLOW10 for 10% off this week.',
  ],
  Followers: [
    'Follow for daily tips on {topic}.',
    'Hit follow and turn on notifications.',
    'Join 10k+ others following this journey.',
  ],
};

const HASHTAG_BANK = [
  'contentcreation', 'socialmedia', 'marketing', 'creators', 'digitalmarketing',
  'branding', 'growth', 'strategy', 'smallbusiness', 'contentstrategy',
  'socialmediatips', 'creatorlife', 'postflow', 'trending', 'viral',
  'engagement', 'community', 'storytelling', 'videocontent', 'reels',
];

const TAG_BANK = [
  'content creation', 'social media marketing', 'digital marketing',
  'brand growth', 'creator economy', 'postflow', 'content strategy',
  'audience engagement', 'social media tips', 'video marketing',
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function topicFrom(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'your content';
  if (words.length <= 3) return words.join(' ');
  return words.slice(0, 4).join(' ') + '...';
}

function adjustLanguage(text: string, language: Language): string {
  if (language === 'Hindi') {
    return text.replace(/Here is|Let's|Let us/gi, 'Bilkul').replace(/\.$/, '।');
  }
  if (language === 'Hinglish') {
    return text.replace('Here is what', 'Dekho yeh baat').replace('Let us', 'Chalo');
  }
  return text;
}

export const DemoAIProvider = {
  analyzeContent(input: AnalyzeInput): {
    topic: string;
    summary: string;
    keywords: string[];
    sentiment: string;
  } {
    const raw = input.sourceText ?? '';
    const topic = topicFrom(raw);
    const keywords = raw
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 5);
    const summary = `This ${input.sourceType} centers on "${topic}". Tone: ${input.tone}. Goal: ${input.goal}. ${
      keywords.length ? `Key themes: ${keywords.join(', ')}.` : ''
    }`;
    return {
      topic,
      summary,
      keywords: keywords.length ? keywords : ['content', 'growth', 'strategy'],
      sentiment: 'Positive / Actionable',
    };
  },

  generateHooks(topic: string, tone: Tone, seed = 0): string[] {
    const bank = HOOK_BANK[tone];
    return bank.map((h, i) => adjustLanguage(h.replace('{topic}', topic), 'English')).slice(0, 3);
  },

  generateCTA(goal: Goal, seed = 0): string {
    return pick(CTA_BANK[goal], seed);
  },

  generateHashtags(topic: string, seed = 0): string[] {
    const base = topic
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 4)
      .map((w) => w.replace(/\s/g, ''));
    const pool = [...base, ...HASHTAG_BANK];
    const unique = [...new Set(pool)];
    return unique.slice(0, 10);
  },

  generatePlatformContent(
    platform: Platform,
    input: AnalyzeInput,
    seed = 0,
  ): PlatformContent {
    const analysis = this.analyzeContent(input);
    const topic = analysis.topic;
    const hook = pick(this.generateHooks(topic, input.tone), seed);
    const cta = this.generateCTA(input.goal, seed);
    const hashtags = this.generateHashtags(topic, seed);
    const brand = input.brandVoice ? ` Voice: ${input.brandVoice}.` : '';

    const baseCaption = `${hook}\n\n${input.sourceText ? input.sourceText.slice(0, 400) : `Here is my take on ${topic}.`}${brand}\n\n${cta}`;

    const score = this.scoreContent({ hook, caption: baseCaption, cta, hashtags });

    switch (platform) {
      case 'instagram':
        return {
          hook,
          caption: baseCaption,
          hashtags,
          cta,
          score,
        };
      case 'facebook':
        return {
          hook,
          caption: `${hook}\n\n${input.sourceText ? input.sourceText.slice(0, 500) : `Sharing thoughts on ${topic}.`}${brand}\n\n${cta}`,
          cta,
          score,
        };
      case 'youtube':
        return {
          title: `${hook} | ${platformName(platform)}`,
          description: `${hook}\n\n${input.sourceText ? input.sourceText.slice(0, 600) : `Full breakdown of ${topic}.`}${brand}\n\n${cta}`,
          tags: [...HASHTAG_BANK.slice(0, 8), ...TAG_BANK.slice(0, 4)],
          cta,
          score,
        };
      case 'linkedin':
        return {
          professional_hook: `${input.tone === 'Professional' ? 'Insight' : 'Reflection'}: ${hook}`,
          post: `${hook}\n\n${input.sourceText ? input.sourceText.slice(0, 700) : `Here is what I learned about ${topic}.`}${brand}\n\nKey takeaway below.`,
          key_takeaway: `If there is one thing to remember about ${topic}, it is this: start small, stay consistent, and measure what matters.`,
          cta,
          hashtags: hashtags.slice(0, 5),
          score,
        };
    }
  },

  generateAll(input: RepurposeInput, seed = 0): Record<string, PlatformContent> {
    const result: Record<string, PlatformContent> = {};
    for (const platform of input.platforms) {
      result[platform] = this.generatePlatformContent(platform, input, seed + platform.length);
    }
    return result;
  },

  scoreContent(content: Partial<PlatformContent>): number {
    let score = 60;
    if (content.hook && content.hook.length > 10) score += 8;
    if (content.caption && content.caption.length > 50) score += 8;
    if (content.cta) score += 6;
    if (content.hashtags && content.hashtags.length >= 5) score += 6;
    if (content.title && content.title.length > 10) score += 6;
    if (content.key_takeaway) score += 6;
    return Math.min(score, 98);
  },
};
