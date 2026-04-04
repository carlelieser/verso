import type { MenuItem } from '@/hooks/use-menu-dial-navigation';
import type { EmotionCategory } from '@/types/common';

interface ItemOptions {
	readonly color?: string;
	readonly children?: MenuItem[];
}

function item(value: EmotionCategory, label: string, options?: ItemOptions): MenuItem {
	return { value, label, color: options?.color, children: options?.children };
}

/** Propagate parent color to children that don't have their own. */
function withColor(color: string, children: MenuItem[]): MenuItem[] {
	return children.map((child) => ({
		...child,
		color: child.color ?? color,
		children: child.children ? withColor(child.color ?? color, child.children) : undefined,
	}));
}

// Colors sampled from the feelings wheel
const FEARFUL_COLOR = '#E91E8C';
const ANGRY_COLOR = '#E53935';
const DISGUSTED_COLOR = '#8D6E4C';
const SAD_COLOR = '#3F51B5';
const HAPPY_COLOR = '#F57C00';
const SURPRISED_COLOR = '#43A047';
const BAD_COLOR = '#7B1FA2';

export const FEELING_WHEEL: MenuItem[] = [
	item('fearful', 'Fearful', {
		color: FEARFUL_COLOR,
		children: withColor(FEARFUL_COLOR, [
			item('scared', 'Scared', {
				children: [item('helpless', 'Helpless'), item('frightened', 'Frightened')],
			}),
			item('anxious', 'Anxious', {
				children: [item('overwhelmed', 'Overwhelmed'), item('worried', 'Worried')],
			}),
			item('insecure', 'Insecure', {
				children: [item('inadequate', 'Inadequate'), item('worthless', 'Worthless')],
			}),
			item('weak', 'Weak', {
				children: [item('insignificant', 'Insignificant'), item('excluded', 'Excluded')],
			}),
			item('rejected', 'Rejected', {
				children: [item('persecuted', 'Persecuted'), item('nervous', 'Nervous')],
			}),
			item('threatened', 'Threatened', {
				children: [item('exposed', 'Exposed'), item('betrayed', 'Betrayed')],
			}),
		]),
	}),
	item('angry', 'Angry', {
		color: ANGRY_COLOR,
		children: withColor(ANGRY_COLOR, [
			item('let-down', 'Let Down', {
				children: [item('resentful', 'Resentful'), item('disrespected', 'Disrespected')],
			}),
			item('humiliated', 'Humiliated', {
				children: [item('ridiculed', 'Ridiculed'), item('indignant', 'Indignant')],
			}),
			item('bitter', 'Bitter', {
				children: [item('violated', 'Violated'), item('furious', 'Furious')],
			}),
			item('mad', 'Mad', {
				children: [item('jealous', 'Jealous'), item('provoked', 'Provoked')],
			}),
			item('aggressive', 'Aggressive', {
				children: [item('hostile', 'Hostile'), item('infuriated', 'Infuriated')],
			}),
			item('frustrated', 'Frustrated', {
				children: [item('annoyed', 'Annoyed'), item('withdrawn', 'Withdrawn')],
			}),
			item('distant', 'Distant', {
				children: [item('numb', 'Numb'), item('skeptical', 'Skeptical')],
			}),
			item('critical', 'Critical', {
				children: [item('dismissive', 'Dismissive'), item('judgmental', 'Judgmental')],
			}),
		]),
	}),
	item('disgusted', 'Disgusted', {
		color: DISGUSTED_COLOR,
		children: withColor(DISGUSTED_COLOR, [
			item('disapproving', 'Disapproving', {
				children: [item('disappointed', 'Disappointed'), item('appalled', 'Appalled')],
			}),
			item('hurt', 'Hurt', {
				children: [item('embarrassed', 'Embarrassed'), item('revolted', 'Revolted')],
			}),
			item('repelled', 'Repelled', {
				children: [item('disgusted-deep', 'Disgusted'), item('hesitant', 'Hesitant')],
			}),
		]),
	}),
	item('sad', 'Sad', {
		color: SAD_COLOR,
		children: withColor(SAD_COLOR, [
			item('guilty', 'Guilty', {
				children: [item('remorseful', 'Remorseful'), item('ashamed', 'Ashamed')],
			}),
			item('depressed', 'Depressed', {
				children: [item('inferior', 'Inferior'), item('empty', 'Empty')],
			}),
			item('lonely', 'Lonely', {
				children: [item('abandoned', 'Abandoned'), item('ignored', 'Ignored')],
			}),
			item('vulnerable', 'Vulnerable', {
				children: [item('fragile', 'Fragile'), item('powerless', 'Powerless')],
			}),
			item('despair', 'Despair', {
				children: [item('grief', 'Grief'), item('distraught', 'Distraught')],
			}),
		]),
	}),
	item('happy', 'Happy', {
		color: HAPPY_COLOR,
		children: withColor(HAPPY_COLOR, [
			item('proud', 'Proud', {
				children: [item('accepted', 'Accepted'), item('respected', 'Respected')],
			}),
			item('content', 'Content', {
				children: [item('joyful', 'Joyful'), item('satisfied', 'Satisfied')],
			}),
			item('interested', 'Interested', {
				children: [item('inquisitive', 'Inquisitive'), item('successful', 'Successful')],
			}),
			item('playful', 'Playful', {
				children: [item('aroused', 'Aroused'), item('curious', 'Curious')],
			}),
			item('confident', 'Confident', {
				children: [
					item('courageous', 'Courageous'),
					item('compassionate', 'Compassionate'),
				],
			}),
		]),
	}),
	item('surprised', 'Surprised', {
		color: SURPRISED_COLOR,
		children: withColor(SURPRISED_COLOR, [
			item('amazed', 'Amazed', {
				children: [item('awe', 'Awe'), item('energetic', 'Energetic')],
			}),
			item('confused', 'Confused', {
				children: [item('startled', 'Startled'), item('stunned', 'Stunned')],
			}),
			item('excited', 'Excited', {
				children: [item('eager', 'Eager'), item('free', 'Free')],
			}),
		]),
	}),
	item('bad', 'Bad', {
		color: BAD_COLOR,
		children: withColor(BAD_COLOR, [
			item('bored', 'Bored', { children: [item('busy', 'Busy'), item('tired', 'Tired')] }),
			item('apathetic', 'Apathetic', {
				children: [item('indifferent', 'Indifferent'), item('pressured', 'Pressured')],
			}),
			item('out-of-control', 'Out of Control', {
				children: [item('stressed', 'Stressed'), item('rushed', 'Rushed')],
			}),
		]),
	}),
];

/** Flat label lookup built by walking the feelings wheel tree. */
function buildLabelMap(items: MenuItem[]): Record<string, string> {
	const map: Record<string, string> = {};
	for (const node of items) {
		map[node.value] = node.label;
		if (node.children) {
			Object.assign(map, buildLabelMap(node.children));
		}
	}
	return map;
}

export const EMOTION_LABELS: Record<EmotionCategory, string> = buildLabelMap(
	FEELING_WHEEL,
) as Record<EmotionCategory, string>;
