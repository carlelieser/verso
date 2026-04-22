import { LinearGradient } from 'expo-linear-gradient';
import { Button } from 'heroui-native';
import {
	Bold,
	ChevronDown,
	Code,
	Heading1,
	Heading2,
	Italic,
	List,
	ListOrdered,
	Quote,
	Strikethrough,
	Underline,
} from 'lucide-react-native';
import React, {
	forwardRef,
	memo,
	useCallback,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import {
	EnrichedTextInput,
	type EnrichedTextInputInstance,
	type OnChangeStateEvent,
} from 'react-native-enriched';
import Animated, {
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import {
	TranscriptionButton,
	TranscriptionLiveText,
	useEditorTranscription,
} from '@/components/entry/transcription-button';
import { buildHtmlStyle } from '@/constants/editor-styles';
import { useKeyboardVisible } from '@/hooks/use-keyboard-visible';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { appendHtmlParagraph } from '@/utils/html';

interface FormatAction {
	readonly key: string;
	readonly icon: React.ComponentType<{ size: number; color: string }>;
	readonly stateKey: keyof OnChangeStateEvent;
	readonly toggle: (ref: EnrichedTextInputInstance) => void;
}

const FORMAT_ACTIONS: readonly FormatAction[] = [
	{ key: 'bold', icon: Bold, stateKey: 'bold', toggle: (r) => r.toggleBold() },
	{ key: 'italic', icon: Italic, stateKey: 'italic', toggle: (r) => r.toggleItalic() },
	{
		key: 'underline',
		icon: Underline,
		stateKey: 'underline',
		toggle: (r) => r.toggleUnderline(),
	},
	{
		key: 'strikethrough',
		icon: Strikethrough,
		stateKey: 'strikeThrough',
		toggle: (r) => r.toggleStrikeThrough(),
	},
	{ key: 'h1', icon: Heading1, stateKey: 'h1', toggle: (r) => r.toggleH1() },
	{ key: 'h2', icon: Heading2, stateKey: 'h2', toggle: (r) => r.toggleH2() },
	{ key: 'ul', icon: List, stateKey: 'unorderedList', toggle: (r) => r.toggleUnorderedList() },
	{ key: 'ol', icon: ListOrdered, stateKey: 'orderedList', toggle: (r) => r.toggleOrderedList() },
	{ key: 'quote', icon: Quote, stateKey: 'blockQuote', toggle: (r) => r.toggleBlockQuote() },
	{ key: 'code', icon: Code, stateKey: 'inlineCode', toggle: (r) => r.toggleInlineCode() },
];

export interface EditorHandle {
	clear: () => void;
	focus: () => void;
	blur: () => void;
	appendText: (text: string) => Promise<void>;
}

interface EditorProps {
	readonly defaultValue?: string;
	readonly placeholder?: string;
	readonly onChangeHtml?: (html: string) => void;
	readonly onChangeText?: (text: string) => void;
}

export const Editor = forwardRef<EditorHandle, EditorProps>(function Editor(
	{ defaultValue, placeholder, onChangeHtml, onChangeText },
	forwardedRef,
) {
	const ref = useRef<EnrichedTextInputInstance>(null);
	const [styleState, setStyleState] = useState<OnChangeStateEvent | null>(null);
	const keyboardProgress = useKeyboardVisible();

	const scrollY = useSharedValue(0);
	const contentHeight = useSharedValue(0);
	const layoutHeight = useSharedValue(0);

	const topGradientOpacity = useDerivedValue(() =>
		withTiming(scrollY.value > 0 ? 1 : 0, { duration: 200 }),
	);
	const bottomGradientOpacity = useDerivedValue(() =>
		withTiming(
			contentHeight.value > 0 && scrollY.value + layoutHeight.value < contentHeight.value - 1
				? 1
				: 0,
			{ duration: 200 },
		),
	);
	const topGradientStyle = useAnimatedStyle(() => ({
		opacity: topGradientOpacity.value,
	}));
	const bottomGradientStyle = useAnimatedStyle(() => ({
		opacity: bottomGradientOpacity.value,
	}));

	const { foreground, accent, muted, selection, surface, editorFont, background } =
		useThemeColors();
	const transcription = useEditorTranscription({ editorRef: ref });
	const htmlStyle = useMemo(
		() => buildHtmlStyle({ foreground, accent, muted, surface }),
		[foreground, accent, muted, surface],
	);

	const formatBarAnimatedStyle = useAnimatedStyle(() => ({
		opacity: keyboardProgress.value,
		transform: [{ translateY: (1 - keyboardProgress.value) * 10 }],
		height: keyboardProgress.value === 0 ? 0 : 'auto',
		overflow: 'hidden' as const,
	}));

	useImperativeHandle(forwardedRef, () => ({
		clear: () => ref.current?.setValue(''),
		focus: () => ref.current?.focus(),
		blur: () => ref.current?.blur(),
		appendText: async (text: string) => {
			if (!ref.current) return;
			const html = await ref.current.getHTML();
			ref.current.setValue(appendHtmlParagraph(html, text));
		},
	}));

	const handleStateChange = useCallback((e: NativeSyntheticEvent<OnChangeStateEvent>): void => {
		setStyleState(e.nativeEvent);
	}, []);

	const handleChangeHtml = useCallback(
		(e: NativeSyntheticEvent<{ value: string }>): void => {
			onChangeHtml?.(e.nativeEvent.value);
		},
		[onChangeHtml],
	);

	const handleChangeText = useCallback(
		(e: NativeSyntheticEvent<{ value: string }>): void => {
			onChangeText?.(e.nativeEvent.value);
		},
		[onChangeText],
	);

	const handleScroll = useCallback(
		(
			e: NativeSyntheticEvent<{
				scrollY: number;
				contentHeight: number;
				layoutHeight: number;
			}>,
		): void => {
			scrollY.value = e.nativeEvent.scrollY;
			contentHeight.value = e.nativeEvent.contentHeight;
			layoutHeight.value = e.nativeEvent.layoutHeight;
		},
		[scrollY, contentHeight, layoutHeight],
	);

	const inputStyle = useMemo(
		() => ({
			flex: 1,
			fontFamily: editorFont,
			color: foreground,
			lineHeight: 28,
			padding: 24,
			paddingTop: 0,
		}),
		[editorFont, foreground],
	);

	const handleBlur = useCallback(() => {
		ref.current?.blur();
	}, []);

	return (
		<KeyboardAvoidingView className="flex-1" behavior={'padding'}>
			<View className="flex-1 relative">
				<EnrichedTextInput
					ref={ref}
					defaultValue={defaultValue}
					placeholder={placeholder ?? `What's on your mind?`}
					placeholderTextColor={muted}
					cursorColor={accent}
					selectionColor={selection}
					onChangeState={handleStateChange}
					onChangeHtml={handleChangeHtml}
					onChangeText={handleChangeText}
					onScroll={handleScroll}
					style={inputStyle}
					htmlStyle={htmlStyle}
				/>

				<Animated.View
					pointerEvents="none"
					style={[
						{ position: 'absolute', top: 0, left: 0, right: 0, height: 48 },
						topGradientStyle,
					]}
				>
					<LinearGradient colors={[background, `${background}00`]} style={{ flex: 1 }} />
				</Animated.View>
				<Animated.View
					pointerEvents="none"
					style={[
						// bottom: 23 (not 24) compensates for a rendering issue where font shows under the gradient
						{ position: 'absolute', bottom: 23, left: 0, right: 0, height: 48 },
						bottomGradientStyle,
					]}
				>
					<LinearGradient colors={[`${background}00`, background]} style={{ flex: 1 }} />
				</Animated.View>
			</View>

			<TranscriptionLiveText transcription={transcription} />

			<Animated.View
				className="flex-row items-center border-t border-border"
				style={formatBarAnimatedStyle}
			>
				<FormatToolbar
					styleState={styleState}
					editorRef={ref}
					accent={accent}
					muted={muted}
					surface={surface}
				/>
				<View className={'flex-row items-center border-l border-border bg-background'}>
					<TranscriptionButton transcription={transcription} />
					<Button variant="ghost" isIconOnly onPress={handleBlur}>
						<ChevronDown size={18} color={muted} />
					</Button>
				</View>
			</Animated.View>
		</KeyboardAvoidingView>
	);
});

interface FormatToolbarProps {
	readonly styleState: OnChangeStateEvent | null;
	readonly editorRef: React.RefObject<EnrichedTextInputInstance | null>;
	readonly accent: string;
	readonly muted: string;
	readonly surface: string;
}

const FormatToolbar = memo(function FormatToolbar({
	styleState,
	editorRef,
	accent,
	muted,
	surface,
}: FormatToolbarProps): React.JSX.Element {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			keyboardShouldPersistTaps="always"
			contentContainerStyle={FORMAT_BAR_CONTENT_STYLE}
			className="flex-1"
		>
			{FORMAT_ACTIONS.map((action) => {
				const isActive = styleState?.[action.stateKey]?.isActive ?? false;
				return (
					<FormatButton
						key={action.key}
						action={action}
						isActive={isActive}
						editorRef={editorRef}
						accent={accent}
						muted={muted}
						surface={surface}
					/>
				);
			})}
		</ScrollView>
	);
});

const FORMAT_BAR_CONTENT_STYLE = {
	paddingHorizontal: 8,
	paddingVertical: 6,
	gap: 2,
} as const;

const ACTIVE_BUTTON_STYLE_CACHE = new Map<string, { backgroundColor: string }>();
const getActiveButtonStyle = (surface: string): { backgroundColor: string } => {
	const cached = ACTIVE_BUTTON_STYLE_CACHE.get(surface);
	if (cached) return cached;
	const style = { backgroundColor: surface };
	ACTIVE_BUTTON_STYLE_CACHE.set(surface, style);
	return style;
};

interface FormatButtonProps {
	readonly action: FormatAction;
	readonly isActive: boolean;
	readonly editorRef: React.RefObject<EnrichedTextInputInstance | null>;
	readonly accent: string;
	readonly muted: string;
	readonly surface: string;
}

const FormatButton = memo(function FormatButton({
	action,
	isActive,
	editorRef,
	accent,
	muted,
	surface,
}: FormatButtonProps): React.JSX.Element {
	const handlePress = useCallback(() => {
		if (editorRef.current) {
			action.toggle(editorRef.current);
		}
	}, [action, editorRef]);

	const IconComponent = action.icon;
	const style = isActive ? getActiveButtonStyle(surface) : undefined;

	return (
		<Button variant="ghost" isIconOnly onPress={handlePress} style={style}>
			<IconComponent size={18} color={isActive ? accent : muted} />
		</Button>
	);
});
