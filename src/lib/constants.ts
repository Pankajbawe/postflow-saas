export const TONES = [
  'Professional',
  'Casual',
  'Educational',
  'Friendly',
  'Bold',
  'Funny',
  'Storytelling',
  'Promotional',
] as const;

export const GOALS = [
  'Engagement',
  'Education',
  'Brand Awareness',
  'Lead Generation',
  'Sales',
  'Followers',
] as const;

export const LANGUAGES = ['English', 'Hindi', 'Hinglish'] as const;

export const DEMO_ACCOUNTS: Record<string, { name: string; username: string }> = {
  instagram: { name: 'Pankaj', username: 'pankajxd' },
  facebook: { name: 'Pankaj Studio', username: 'PankajStudio' },
  youtube: { name: 'Pankaj Studio', username: 'PankajStudio' },
  linkedin: { name: 'Pankaj Meena', username: 'pankaj-meena' },
};
