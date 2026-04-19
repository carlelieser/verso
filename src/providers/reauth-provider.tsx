import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { PinSheet } from '@/components/security/pin-sheet';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useSecurity } from '@/hooks/use-security';
import { authenticateBiometric } from '@/services/biometric-service';
import { log } from '@/utils/log';

interface ReauthContextValue {
	readonly requireAuth: (reason: string) => Promise<boolean>;
}

const ReauthContext = createContext<ReauthContextValue | null>(null);

export function useReauth(): ReauthContextValue {
	const context = useContext(ReauthContext);
	if (!context) {
		throw new Error('useReauth must be used within a ReauthProvider');
	}
	return context;
}

interface ReauthProviderProps {
	readonly children: React.ReactNode;
}

export function ReauthProvider({ children }: ReauthProviderProps): React.JSX.Element {
	const { hasPin, isBiometricsEnabled, biometric } = useSecurity();
	const sheet = useBottomSheet();
	const resolveRef = useRef<((value: boolean) => void) | null>(null);
	const [isSheetMounted, setIsSheetMounted] = useState(false);

	const resolve = useCallback(
		(value: boolean) => {
			const fn = resolveRef.current;
			resolveRef.current = null;
			if (fn) fn(value);
		},
		[],
	);

	const openSheet = useCallback(() => {
		setIsSheetMounted(true);
		sheet.open();
	}, [sheet]);

	const handleSheetClose = useCallback(() => {
		setIsSheetMounted(false);
		resolve(false);
	}, [resolve]);

	const handleSuccess = useCallback(() => {
		resolve(true);
	}, [resolve]);

	const requireAuth = useCallback(
		async (reason: string): Promise<boolean> => {
			if (!hasPin) return true;
			if (resolveRef.current !== null) return false;
			if (isBiometricsEnabled && biometric.isAvailable) {
				try {
					const ok = await authenticateBiometric(reason);
					if (ok) return true;
				} catch (err: unknown) {
					log.warn('reauth', 'Biometric auth failed', err);
				}
			}
			return new Promise<boolean>((res) => {
				resolveRef.current = res;
				openSheet();
			});
		},
		[hasPin, isBiometricsEnabled, biometric.isAvailable, openSheet],
	);

	const contextValue = useMemo<ReauthContextValue>(() => ({ requireAuth }), [requireAuth]);

	const sheetWithClose = useMemo(
		() => ({ ...sheet, sheetProps: { ...sheet.sheetProps, onClose: handleSheetClose } }),
		[sheet, handleSheetClose],
	);

	return (
		<ReauthContext.Provider value={contextValue}>
			{children}
			{isSheetMounted ? (
				<PinSheet sheet={sheetWithClose} mode="verify" onSuccess={handleSuccess} />
			) : null}
		</ReauthContext.Provider>
	);
}
