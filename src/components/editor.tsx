import {Button} from 'heroui-native';
import {
	Bold,
	ChevronDown,
	Code,
	Heading1,
	Heading2,
	Italic,
	List,
	ListOrdered,
	Mic,
	Quote,
	Strikethrough,
	Underline,
} from 'lucide-react-native';
import React, {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from 'react';
import type {NativeSyntheticEvent} from 'react-native';
import {Keyboard, KeyboardAvoidingView, ScrollView, Text, View} from 'react-native';
import {
	EnrichedTextInput,
	type EnrichedTextInputInstance,
	type OnChangeStateEvent,
} from 'react-native-enriched';

import {AttachmentButton} from '@/components/attachment-button';
import {useSettings} from '@/hooks/use-settings';
import {useThemeColors} from '@/hooks/use-theme-colors';
import {useWhisperTranscription} from '@/hooks/use-whisper-transcription';

interface FormatAction {
	readonly key: string;
	readonly icon: React.ComponentType<{ size: number; color: string }>;
	readonly stateKey: keyof OnChangeStateEvent;
	readonly toggle: (ref: EnrichedTextInputInstance) => void;
}

const FORMAT_ACTIONS: readonly FormatAction[] = [
	{key: 'bold', icon: Bold, stateKey: 'bold', toggle: (r) => r.toggleBold()},
	{key: 'italic', icon: Italic, stateKey: 'italic', toggle: (r) => r.toggleItalic()},
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
	{key: 'h1', icon: Heading1, stateKey: 'h1', toggle: (r) => r.toggleH1()},
	{key: 'h2', icon: Heading2, stateKey: 'h2', toggle: (r) => r.toggleH2()},
	{key: 'ul', icon: List, stateKey: 'unorderedList', toggle: (r) => r.toggleUnorderedList()},
	{key: 'ol', icon: ListOrdered, stateKey: 'orderedList', toggle: (r) => r.toggleOrderedList()},
	{key: 'quote', icon: Quote, stateKey: 'blockQuote', toggle: (r) => r.toggleBlockQuote()},
	{key: 'code', icon: Code, stateKey: 'inlineCode', toggle: (r) => r.toggleInlineCode()},
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
	{defaultValue, placeholder, onChangeHtml, onChangeText},
	forwardedRef,
) {
	const ref = useRef<EnrichedTextInputInstance>(null);
	const [styleState, setStyleState] = useState<OnChangeStateEvent | null>(null);
	const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
	const {isTranscriptionEnabled} = useSettings();

	const {foreground, accent, muted, surface, editorFont} = useThemeColors();

	const handleTranscriptionFinish = useCallback(async (text: string) => {
		if (!ref.current) return;
		const html = await ref.current.getHTML();
		const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		ref.current.setValue(html.replace(/<\/html>\s*$/, `<p>${escaped}</p>\n</html>`));
	}, []);

	const transcription = useWhisperTranscription(handleTranscriptionFinish);

	useEffect(() => {
		const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
		const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
		return () => {
			showSub.remove();
			hideSub.remove();
		};
	}, []);

	useImperativeHandle(forwardedRef, () => ({
		clear: () => ref.current?.setValue(''),
		focus: () => ref.current?.focus(),
		blur: () => ref.current?.blur(),
		appendText: handleTranscriptionFinish,
	}));

	const handleStateChange = (e: NativeSyntheticEvent<OnChangeStateEvent>): void => {
		setStyleState(e.nativeEvent);
	};

	return (
		<KeyboardAvoidingView className="flex-1" behavior={'padding'}>
			<EnrichedTextInput
				ref={ref}
				defaultValue={defaultValue}
				placeholder={placeholder ?? `What's on your mind?`}
				placeholderTextColor={muted}
				cursorColor={accent}
				selectionColor={accent}
				onChangeState={handleStateChange}
				onChangeHtml={(e) => onChangeHtml?.(e.nativeEvent.value)}
				onChangeText={(e) => onChangeText?.(e.nativeEvent.value)}
				style={{
					flex: 1,
					fontFamily: editorFont,
					color: foreground,
					lineHeight: 28,
					padding: 24,
					paddingTop: 0,
				}}
				htmlStyle={{
					h1: {fontSize: 28, bold: true},
					h2: {fontSize: 22, bold: true},
					blockquote: {
						borderColor: accent,
						borderWidth: 3,
						gapWidth: 12,
						color: muted,
					},
					codeblock: {
						backgroundColor: surface,
						borderRadius: 8,
						color: foreground,
					},
					code: {
						backgroundColor: surface,
						color: foreground,
					},
					ul: {
						bulletColor: foreground,
					},
					ol: {
						markerColor: foreground,
					},
					ulCheckbox: {
						boxColor: muted,
					},
					a: {
						color: accent,
						textDecorationLine: 'underline',
					},
				}}
			/>

			{isTranscriptionEnabled &&
			transcription.liveText.length > 0 &&
			transcription.isRecording ? (
				<View className="bg-background px-6 py-2">
					<Text className="text-sm text-muted italic">
						{transcription.liveText}
					</Text>
				</View>
			) : null}

			{isKeyboardVisible ? (
				<View className="flex-row items-center border-t border-border">
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
									style={isActive ? {backgroundColor: surface} : undefined}
								>
									<IconComponent size={18} color={isActive ? accent : muted}/>
								</Button>
							);
						})}
					</ScrollView>
					<View className={'flex-row items-center border-l border-border bg-background'}>
						<AttachmentButton />
						{isTranscriptionEnabled ? (
							<Button
								variant="ghost"
								isIconOnly
								isDisabled={transcription.status === 'loading'}
								onPress={transcription.toggle}
							>
								<Mic size={18} color={transcription.isRecording ? accent : muted}/>
							</Button>
						) : null}
						<Button variant="ghost" isIconOnly onPress={() => ref.current?.blur()}>
							<ChevronDown size={18} color={muted}/>
						</Button>
					</View>
				</View>
			) : null}
		</KeyboardAvoidingView>
	);
});
