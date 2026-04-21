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
import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
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

	const handleStateChange = (e: NativeSyntheticEvent<OnChangeStateEvent>): void => {
		setStyleState(e.nativeEvent);
	};

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
					onChangeHtml={(e) => onChangeHtml?.(e.nativeEvent.value)}
					onChangeText={(e) => onChangeText?.(e.nativeEvent.value)}
					onScroll={(e) => {
						scrollY.value = e.nativeEvent.scrollY;
						contentHeight.value = e.nativeEvent.contentHeight;
						layoutHeight.value = e.nativeEvent.layoutHeight;
					}}
					style={{
						flex: 1,
						fontFamily: editorFont,
						color: foreground,
						lineHeight: 28,
						padding: 24,
						paddingTop: 0,
					}}
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
						{ position: 'absolute', bottom: 24, left: 0, right: 0, height: 48 },
						bottomGradientStyle,
					]}
				>
					<LinearGradient colors={[`${background}00`, background]} style={{ flex: 1 }} />
				</Animated.View>
			</View>

			{transcription && <TranscriptionLiveText transcription={transcription} />}

			<Animated.View
				className="flex-row items-center border-t border-border"
				style={formatBarAnimatedStyle}
			>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					keyboardShouldPersistTaps="always"
					contentContainerStyle={{
						paddingHorizontal: 8,
						paddingVertical: 6,
						gap: 2,
					}}
					className="flex-1"
				>
					{FORMAT_ACTIONS.map((action) => {
						const isActive = styleState?.[action.stateKey]?.isActive ?? false;
						const IconComponent = action.icon;

						return (
							<Button
								key={action.key}
								variant="ghost"
								isIconOnly
								onPress={() => {
									if (ref.current) {
										action.toggle(ref.current);
									}
								}}
								style={isActive ? { backgroundColor: surface } : undefined}
							>
								<IconComponent size={18} color={isActive ? accent : muted} />
							</Button>
						);
					})}
				</ScrollView>
				<View className={'flex-row items-center border-l border-border bg-background'}>
					<TranscriptionButton transcription={transcription} />
					<Button variant="ghost" isIconOnly onPress={() => ref.current?.blur()}>
						<ChevronDown size={18} color={muted} />
					</Button>
				</View>
			</Animated.View>
		</KeyboardAvoidingView>
	);
});
