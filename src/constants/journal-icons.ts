import {
	BookOpen,
	Briefcase,
	Coffee,
	Flame,
	Heart,
	Leaf,
	Lightbulb,
	Moon,
	Plane,
	Sparkles,
	Star,
	Sun,
} from 'lucide-react-native';
import type { ComponentType } from 'react';

interface IconDefinition {
	readonly key: string;
	readonly Icon: ComponentType<{ size?: number; color?: string }>;
}

export const DEFAULT_JOURNAL_COLOR = '#7A8A8C';

export const JOURNAL_ICONS: readonly IconDefinition[] = [
	{ key: 'book-open', Icon: BookOpen },
	{ key: 'heart', Icon: Heart },
	{ key: 'star', Icon: Star },
	{ key: 'lightbulb', Icon: Lightbulb },
	{ key: 'flame', Icon: Flame },
	{ key: 'leaf', Icon: Leaf },
	{ key: 'moon', Icon: Moon },
	{ key: 'sun', Icon: Sun },
	{ key: 'coffee', Icon: Coffee },
	{ key: 'plane', Icon: Plane },
	{ key: 'briefcase', Icon: Briefcase },
	{ key: 'sparkles', Icon: Sparkles },
] as const;

export const JOURNAL_ICON_MAP: Record<
	string,
	ComponentType<{ size?: number; color?: string }>
> = Object.fromEntries(JOURNAL_ICONS.map(({ key, Icon }) => [key, Icon]));

/**
 * Resolves an icon key to its Lucide component. Falls back to BookOpen.
 */
export function getJournalIcon(key: string): ComponentType<{ size?: number; color?: string }> {
	return JOURNAL_ICON_MAP[key] ?? BookOpen;
}
