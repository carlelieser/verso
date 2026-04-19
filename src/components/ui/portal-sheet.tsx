import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import React from 'react';

import { SheetContent } from '@/components/ui/sheet-content';
import type { useBottomSheet } from '@/hooks/use-bottom-sheet';

interface PortalSheetProps {
	readonly sheet: ReturnType<typeof useBottomSheet>;
	readonly title?: string | React.ReactNode;
	readonly footer?: React.ReactNode;
	readonly className?: string;
	readonly keyboardPersist?: boolean;
	readonly children: React.ReactNode;
}

export function PortalSheet({
	sheet,
	title,
	footer,
	className,
	keyboardPersist = false,
	children,
}: PortalSheetProps): React.JSX.Element {
	return (
		<Portal>
			<BottomSheet ref={sheet.ref} {...sheet.sheetProps}>
				<BottomSheetScrollView
					keyboardShouldPersistTaps={keyboardPersist ? 'handled' : undefined}
				>
					<SheetContent title={title} footer={footer} className={className}>
						{children}
					</SheetContent>
				</BottomSheetScrollView>
			</BottomSheet>
		</Portal>
	);
}
