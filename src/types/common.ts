export type Timestamp = number;

export type EmotionCategory =
	// Joy
	| 'contentment'
	| 'amusement'
	| 'happiness'
	| 'delight'
	| 'euphoria'
	| 'ecstasy'
	// Sadness
	| 'disappointment'
	| 'melancholy'
	| 'sorrow'
	| 'heartache'
	| 'grief'
	| 'despair'
	// Anger
	| 'annoyance'
	| 'irritation'
	| 'frustration'
	| 'anger'
	| 'fury'
	| 'rage'
	// Fear
	| 'unease'
	| 'apprehension'
	| 'anxiety'
	| 'fear'
	| 'panic'
	| 'terror'
	// Surprise
	| 'curiosity'
	| 'interest'
	| 'surprise'
	| 'amazement'
	| 'astonishment'
	| 'shock'
	// Disgust
	| 'discomfort'
	| 'distaste'
	| 'aversion'
	| 'disgust'
	| 'revulsion'
	| 'loathing'
	// Love
	| 'fondness'
	| 'affection'
	| 'tenderness'
	| 'love'
	| 'devotion'
	| 'adoration'
	// Shame
	| 'self-consciousness'
	| 'embarrassment'
	| 'shame'
	| 'disgrace'
	| 'humiliation'
	| 'mortification'
	// Guilt
	| 'regret'
	| 'guilt'
	| 'remorse'
	| 'anguish'
	| 'self-loathing'
	// Envy
	| 'wistfulness'
	| 'longing'
	| 'envy'
	| 'jealousy'
	| 'covetousness'
	| 'resentment'
	// Pride
	| 'satisfaction'
	| 'confidence'
	| 'pride'
	| 'triumph'
	| 'hubris'
	| 'grandiosity'
	// Trust
	| 'openness'
	| 'acceptance'
	| 'trust'
	| 'reliance'
	| 'faith'
	| 'dependence'
	// Contempt
	| 'dismissiveness'
	| 'scorn'
	| 'contempt'
	| 'disdain'
	// Awe
	| 'wonder'
	| 'awe'
	| 'reverence'
	// Nostalgia
	| 'reminiscence'
	| 'nostalgia'
	| 'homesickness'
	| 'yearning'
	// Empathy
	| 'sympathy'
	| 'compassion'
	| 'overwhelm'
	// Ambivalence
	| 'indecision'
	| 'conflict'
	| 'paralysis'
	// Ennui
	| 'boredom'
	| 'apathy'
	// Schadenfreude
	| 'smugness'
	| 'vindictive-pleasure';

export type EmotionIntensity = 1 | 2 | 3 | 4 | 5;

const EMOTION_CATEGORIES_SET: ReadonlySet<string> = new Set<EmotionCategory>([
	'contentment',
	'amusement',
	'happiness',
	'delight',
	'euphoria',
	'ecstasy',
	'disappointment',
	'melancholy',
	'sorrow',
	'heartache',
	'grief',
	'despair',
	'annoyance',
	'irritation',
	'frustration',
	'anger',
	'fury',
	'rage',
	'unease',
	'apprehension',
	'anxiety',
	'fear',
	'panic',
	'terror',
	'curiosity',
	'interest',
	'surprise',
	'amazement',
	'astonishment',
	'shock',
	'discomfort',
	'distaste',
	'aversion',
	'disgust',
	'revulsion',
	'loathing',
	'fondness',
	'affection',
	'tenderness',
	'love',
	'devotion',
	'adoration',
	'self-consciousness',
	'embarrassment',
	'shame',
	'disgrace',
	'humiliation',
	'mortification',
	'regret',
	'guilt',
	'remorse',
	'anguish',
	'self-loathing',
	'wistfulness',
	'longing',
	'envy',
	'jealousy',
	'covetousness',
	'resentment',
	'satisfaction',
	'confidence',
	'pride',
	'triumph',
	'hubris',
	'grandiosity',
	'openness',
	'acceptance',
	'trust',
	'reliance',
	'faith',
	'dependence',
	'dismissiveness',
	'scorn',
	'contempt',
	'disdain',
	'wonder',
	'awe',
	'reverence',
	'reminiscence',
	'nostalgia',
	'homesickness',
	'yearning',
	'sympathy',
	'compassion',
	'overwhelm',
	'indecision',
	'conflict',
	'paralysis',
	'boredom',
	'apathy',
	'smugness',
	'vindictive-pleasure',
]);

const EMOTION_INTENSITIES_SET: ReadonlySet<number> = new Set<EmotionIntensity>([1, 2, 3, 4, 5]);

export function isEmotionCategory(value: string): value is EmotionCategory {
	return EMOTION_CATEGORIES_SET.has(value);
}

export function isEmotionIntensity(value: number): value is EmotionIntensity {
	return EMOTION_INTENSITIES_SET.has(value);
}
