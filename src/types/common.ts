export type Timestamp = number;

export const EMOTION_KEYS = [
	// Joy
	'contentment',
	'amusement',
	'happiness',
	'delight',
	'euphoria',
	'ecstasy',
	// Sadness
	'disappointment',
	'melancholy',
	'sorrow',
	'heartache',
	'grief',
	'despair',
	// Anger
	'annoyance',
	'irritation',
	'frustration',
	'anger',
	'fury',
	'rage',
	// Fear
	'unease',
	'apprehension',
	'anxiety',
	'fear',
	'panic',
	'terror',
	// Surprise
	'curiosity',
	'interest',
	'surprise',
	'amazement',
	'astonishment',
	'shock',
	// Disgust
	'discomfort',
	'distaste',
	'aversion',
	'disgust',
	'revulsion',
	'loathing',
	// Love
	'fondness',
	'affection',
	'tenderness',
	'love',
	'devotion',
	'adoration',
	// Shame
	'self-consciousness',
	'embarrassment',
	'shame',
	'disgrace',
	'humiliation',
	'mortification',
	// Guilt
	'regret',
	'guilt',
	'remorse',
	'anguish',
	'self-loathing',
	// Envy
	'wistfulness',
	'longing',
	'envy',
	'jealousy',
	'covetousness',
	'resentment',
	// Pride
	'satisfaction',
	'confidence',
	'pride',
	'triumph',
	'hubris',
	'grandiosity',
	// Trust
	'openness',
	'acceptance',
	'trust',
	'reliance',
	'faith',
	'dependence',
	// Contempt
	'dismissiveness',
	'scorn',
	'contempt',
	'disdain',
	// Awe
	'wonder',
	'awe',
	'reverence',
	// Nostalgia
	'reminiscence',
	'nostalgia',
	'homesickness',
	'yearning',
	// Empathy
	'sympathy',
	'compassion',
	'overwhelm',
	// Ambivalence
	'indecision',
	'conflict',
	'paralysis',
	// Ennui
	'boredom',
	'apathy',
	// Schadenfreude
	'smugness',
	'vindictive-pleasure',
] as const;

export type EmotionCategory = (typeof EMOTION_KEYS)[number];

export type EmotionIntensity = 1 | 2 | 3 | 4 | 5;

const EMOTION_CATEGORIES_SET: ReadonlySet<string> = new Set<string>(EMOTION_KEYS);

const EMOTION_INTENSITIES_SET: ReadonlySet<number> = new Set<EmotionIntensity>([1, 2, 3, 4, 5]);

export function isEmotionCategory(value: string): value is EmotionCategory {
	return EMOTION_CATEGORIES_SET.has(value);
}

export function isEmotionIntensity(value: number): value is EmotionIntensity {
	return EMOTION_INTENSITIES_SET.has(value);
}
