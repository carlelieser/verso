export type Timestamp = number;

export const EMOTION_KEYS = [
	// Inner ring
	'fearful',
	'angry',
	'disgusted',
	'sad',
	'happy',
	'surprised',
	'bad',
	// Fearful — middle
	'scared',
	'anxious',
	'insecure',
	'weak',
	'rejected',
	'threatened',
	// Fearful — outer
	'helpless',
	'frightened',
	'overwhelmed',
	'worried',
	'inadequate',
	'worthless',
	'insignificant',
	'excluded',
	'persecuted',
	'nervous',
	'exposed',
	'betrayed',
	// Angry — middle
	'let-down',
	'humiliated',
	'bitter',
	'mad',
	'aggressive',
	'frustrated',
	'distant',
	'critical',
	// Angry — outer
	'resentful',
	'disrespected',
	'ridiculed',
	'indignant',
	'violated',
	'furious',
	'jealous',
	'provoked',
	'hostile',
	'infuriated',
	'annoyed',
	'withdrawn',
	'numb',
	'skeptical',
	'dismissive',
	'judgmental',
	// Disgusted — middle
	'disapproving',
	'hurt',
	'repelled',
	// Disgusted — outer
	'disappointed',
	'appalled',
	'embarrassed',
	'revolted',
	'disgusted-deep',
	'hesitant',
	// Sad — middle
	'guilty',
	'depressed',
	'lonely',
	'vulnerable',
	'despair',
	// Sad — outer
	'remorseful',
	'ashamed',
	'inferior',
	'empty',
	'abandoned',
	'ignored',
	'fragile',
	'powerless',
	'grief',
	'distraught',
	// Happy — middle
	'proud',
	'content',
	'interested',
	'playful',
	'confident',
	// Happy — outer
	'accepted',
	'respected',
	'joyful',
	'satisfied',
	'inquisitive',
	'successful',
	'aroused',
	'curious',
	'courageous',
	'compassionate',
	// Surprised — middle
	'amazed',
	'confused',
	'excited',
	// Surprised — outer
	'awe',
	'energetic',
	'startled',
	'stunned',
	'eager',
	'free',
	// Bad — middle
	'bored',
	'apathetic',
	'out-of-control',
	// Bad — outer
	'busy',
	'tired',
	'indifferent',
	'pressured',
	'stressed',
	'rushed',
] as const;

export type EmotionCategory = (typeof EMOTION_KEYS)[number];

export type EmotionIntensity = 0 | 1 | 2 | 3 | 4 | 5;

const EMOTION_CATEGORIES_SET: ReadonlySet<string> = new Set<string>(EMOTION_KEYS);

const EMOTION_INTENSITIES_SET: ReadonlySet<number> = new Set<EmotionIntensity>([0, 1, 2, 3, 4, 5]);

export function isEmotionCategory(value: string): value is EmotionCategory {
	return EMOTION_CATEGORIES_SET.has(value);
}

export function isEmotionIntensity(value: number): value is EmotionIntensity {
	return EMOTION_INTENSITIES_SET.has(value);
}
