import * as Clipboard from 'expo-clipboard';
import { ListGroup } from 'heroui-native';
import { Check, Copy } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useThemeColors } from '@/hooks/use-theme-colors';

const COPIED_DURATION_MS = 1500;

interface CopyableListGroupItemProps {
	readonly label: string;
	readonly value: string;
}

export function CopyableListGroupItem({
	label,
	value,
}: CopyableListGroupItemProps): React.JSX.Element {
	const { muted, accent } = useThemeColors();
	const [isCopied, setIsCopied] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleCopy = useCallback(async () => {
		await Clipboard.setStringAsync(value);
		setIsCopied(true);
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => setIsCopied(false), COPIED_DURATION_MS);
	}, [value]);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, []);

	return (
		<ListGroup.Item onPress={handleCopy}>
			<ListGroup.ItemContent>
				<ListGroup.ItemTitle>{label}</ListGroup.ItemTitle>
				<ListGroup.ItemDescription numberOfLines={1}>{value}</ListGroup.ItemDescription>
			</ListGroup.ItemContent>
			<ListGroup.ItemSuffix>
				{isCopied ? <Check size={16} color={accent} /> : <Copy size={16} color={muted} />}
			</ListGroup.ItemSuffix>
		</ListGroup.Item>
	);
}
