import { useCallback, useMemo, useRef, useState } from 'react';
import type BottomSheet from '@gorhom/bottom-sheet';
import { BottomSheetBackdrop, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

import { BOTTOM_SHEET_ANIMATION_CONFIG } from '@/constants/animation';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface UseBottomSheetOptions {
  readonly maxDynamicContentSize?: number;
}

interface UseBottomSheetResult {
  readonly ref: React.MutableRefObject<BottomSheet | null>;
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
  readonly sheetProps: {
    readonly index: number;
    readonly enablePanDownToClose: boolean;
    readonly enableDynamicSizing: boolean;
    readonly animationConfigs: Record<string, never>;
    readonly onClose: () => void;
    readonly backdropComponent: (props: BottomSheetBackdropProps) => React.JSX.Element;
    readonly backgroundStyle: { readonly backgroundColor: string };
    readonly handleIndicatorStyle: { readonly backgroundColor: string };
    readonly maxDynamicContentSize?: number;
  };
}

export function useBottomSheet(options?: UseBottomSheetOptions): UseBottomSheetResult {
  const ref = useRef<BottomSheet>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { surface, muted } = useThemeColors();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
    ),
    [],
  );

  const sheetProps = useMemo(
    () => ({
      index: 0,
      enablePanDownToClose: true,
      enableDynamicSizing: true,
      animationConfigs: BOTTOM_SHEET_ANIMATION_CONFIG,
      onClose: close,
      backdropComponent: renderBackdrop,
      backgroundStyle: { backgroundColor: surface },
      handleIndicatorStyle: { backgroundColor: muted },
      ...(options?.maxDynamicContentSize !== undefined && {
        maxDynamicContentSize: options.maxDynamicContentSize,
      }),
    }),
    [close, renderBackdrop, surface, muted, options?.maxDynamicContentSize],
  );

  return { ref, isOpen, open, close, sheetProps };
}
