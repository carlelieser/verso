import type { EmotionCategory } from '@/types/common';

interface EmotionEntry {
	readonly key: EmotionCategory;
	readonly label: string;
}

export const EMOTIONS: readonly EmotionEntry[] = [
	// Joy
	{ key: 'contentment', label: 'Contentment' },
	{ key: 'amusement', label: 'Amusement' },
	{ key: 'happiness', label: 'Happiness' },
	{ key: 'delight', label: 'Delight' },
	{ key: 'euphoria', label: 'Euphoria' },
	{ key: 'ecstasy', label: 'Ecstasy' },
	// Sadness
	{ key: 'disappointment', label: 'Disappointment' },
	{ key: 'melancholy', label: 'Melancholy' },
	{ key: 'sorrow', label: 'Sorrow' },
	{ key: 'heartache', label: 'Heartache' },
	{ key: 'grief', label: 'Grief' },
	{ key: 'despair', label: 'Despair' },
	// Anger
	{ key: 'annoyance', label: 'Annoyance' },
	{ key: 'irritation', label: 'Irritation' },
	{ key: 'frustration', label: 'Frustration' },
	{ key: 'anger', label: 'Anger' },
	{ key: 'fury', label: 'Fury' },
	{ key: 'rage', label: 'Rage' },
	// Fear
	{ key: 'unease', label: 'Unease' },
	{ key: 'apprehension', label: 'Apprehension' },
	{ key: 'anxiety', label: 'Anxiety' },
	{ key: 'fear', label: 'Fear' },
	{ key: 'panic', label: 'Panic' },
	{ key: 'terror', label: 'Terror' },
	// Surprise
	{ key: 'curiosity', label: 'Curiosity' },
	{ key: 'interest', label: 'Interest' },
	{ key: 'surprise', label: 'Surprise' },
	{ key: 'amazement', label: 'Amazement' },
	{ key: 'astonishment', label: 'Astonishment' },
	{ key: 'shock', label: 'Shock' },
	// Disgust
	{ key: 'discomfort', label: 'Discomfort' },
	{ key: 'distaste', label: 'Distaste' },
	{ key: 'aversion', label: 'Aversion' },
	{ key: 'disgust', label: 'Disgust' },
	{ key: 'revulsion', label: 'Revulsion' },
	{ key: 'loathing', label: 'Loathing' },
	// Love
	{ key: 'fondness', label: 'Fondness' },
	{ key: 'affection', label: 'Affection' },
	{ key: 'tenderness', label: 'Tenderness' },
	{ key: 'love', label: 'Love' },
	{ key: 'devotion', label: 'Devotion' },
	{ key: 'adoration', label: 'Adoration' },
	// Shame
	{ key: 'self-consciousness', label: 'Self-consciousness' },
	{ key: 'embarrassment', label: 'Embarrassment' },
	{ key: 'shame', label: 'Shame' },
	{ key: 'disgrace', label: 'Disgrace' },
	{ key: 'humiliation', label: 'Humiliation' },
	{ key: 'mortification', label: 'Mortification' },
	// Guilt
	{ key: 'regret', label: 'Regret' },
	{ key: 'guilt', label: 'Guilt' },
	{ key: 'remorse', label: 'Remorse' },
	{ key: 'anguish', label: 'Anguish' },
	{ key: 'self-loathing', label: 'Self-loathing' },
	// Envy
	{ key: 'wistfulness', label: 'Wistfulness' },
	{ key: 'longing', label: 'Longing' },
	{ key: 'envy', label: 'Envy' },
	{ key: 'jealousy', label: 'Jealousy' },
	{ key: 'covetousness', label: 'Covetousness' },
	{ key: 'resentment', label: 'Resentment' },
	// Pride
	{ key: 'satisfaction', label: 'Satisfaction' },
	{ key: 'confidence', label: 'Confidence' },
	{ key: 'pride', label: 'Pride' },
	{ key: 'triumph', label: 'Triumph' },
	{ key: 'hubris', label: 'Hubris' },
	{ key: 'grandiosity', label: 'Grandiosity' },
	// Trust
	{ key: 'openness', label: 'Openness' },
	{ key: 'acceptance', label: 'Acceptance' },
	{ key: 'trust', label: 'Trust' },
	{ key: 'reliance', label: 'Reliance' },
	{ key: 'faith', label: 'Faith' },
	{ key: 'dependence', label: 'Dependence' },
	// Contempt
	{ key: 'dismissiveness', label: 'Dismissiveness' },
	{ key: 'scorn', label: 'Scorn' },
	{ key: 'contempt', label: 'Contempt' },
	{ key: 'disdain', label: 'Disdain' },
	// Awe
	{ key: 'wonder', label: 'Wonder' },
	{ key: 'awe', label: 'Awe' },
	{ key: 'reverence', label: 'Reverence' },
	// Nostalgia
	{ key: 'reminiscence', label: 'Reminiscence' },
	{ key: 'nostalgia', label: 'Nostalgia' },
	{ key: 'homesickness', label: 'Homesickness' },
	{ key: 'yearning', label: 'Yearning' },
	// Empathy
	{ key: 'sympathy', label: 'Sympathy' },
	{ key: 'compassion', label: 'Compassion' },
	{ key: 'overwhelm', label: 'Overwhelm' },
	// Ambivalence
	{ key: 'indecision', label: 'Indecision' },
	{ key: 'conflict', label: 'Conflict' },
	{ key: 'paralysis', label: 'Paralysis' },
	// Ennui
	{ key: 'boredom', label: 'Boredom' },
	{ key: 'apathy', label: 'Apathy' },
	// Schadenfreude
	{ key: 'smugness', label: 'Smugness' },
	{ key: 'vindictive-pleasure', label: 'Vindictive pleasure' },
];

/** Flat label lookup derived from EMOTIONS. */
export const EMOTION_LABELS: Record<EmotionCategory, string> = Object.fromEntries(
	EMOTIONS.map((e) => [e.key, e.label]),
) as Record<EmotionCategory, string>;
