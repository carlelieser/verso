import {
	Bold,
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
import React, {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import type {NativeSyntheticEvent} from 'react-native';
import {Pressable, View} from 'react-native';

import {
	EnrichedTextInput,
	type EnrichedTextInputInstance,
	type OnChangeStateEvent,
} from 'react-native-enriched';

import {useThemeColors} from '@/hooks/use-theme-colors';

interface FormatAction {
	readonly key: string;
	readonly icon: React.ComponentType<{ size: number; color: string }>;
	readonly stateKey: keyof OnChangeStateEvent;
	readonly toggle: (ref: EnrichedTextInputInstance) => void;
}

const FORMAT_ACTIONS: readonly FormatAction[] = [
	{key: 'bold', icon: Bold, stateKey: 'bold', toggle: (r) => r.toggleBold()},
	{key: 'italic', icon: Italic, stateKey: 'italic', toggle: (r) => r.toggleItalic()},
	{key: 'underline', icon: Underline, stateKey: 'underline', toggle: (r) => r.toggleUnderline()},
	{key: 'strikethrough', icon: Strikethrough, stateKey: 'strikeThrough', toggle: (r) => r.toggleStrikeThrough()},
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

	const {foreground, accent, muted, surface, border, editorFont} = useThemeColors();

	useImperativeHandle(forwardedRef, () => ({
		clear: () => ref.current?.setValue(''),
		focus: () => ref.current?.focus(),
	}));

	const handleStateChange = (e: NativeSyntheticEvent<OnChangeStateEvent>): void => {
		setStyleState(e.nativeEvent);
	};

	return (
		<View className="flex-1">
			<EnrichedTextInput
				ref={ref}
				defaultValue={defaultValue}
				placeholder={placeholder ?? 'Start writing...'}
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
					fontSize: 17,
					lineHeight: 28,
					paddingHorizontal: 20,
					paddingTop: 12,
					paddingBottom: 12,
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

			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					borderTopWidth: 1,
					borderTopColor: border,
					paddingHorizontal: 8,
					paddingVertical: 6,
					gap: 2,
				}}
			>
				{FORMAT_ACTIONS.map((action) => {
					const isActive = styleState?.[action.stateKey]?.isActive ?? false;
					const IconComponent = action.icon;

					return (
						<Pressable
							key={action.key}
							onPress={() => {
								if (ref.current) {
									action.toggle(ref.current);
								}
							}}
							style={{
								width: 36,
								height: 36,
								alignItems: 'center',
								justifyContent: 'center',
								borderRadius: 8,
								backgroundColor: isActive ? surface : 'transparent',
							}}
						>
							<IconComponent
								size={18}
								color={isActive ? accent : muted}
							/>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
});
