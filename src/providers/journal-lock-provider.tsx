import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { AppState } from 'react-native';

export interface JournalLockContextValue {
	readonly isJournalUnlocked: (journalId: string) => boolean;
	readonly unlockJournal: (journalId: string) => void;
	readonly lockJournal: (journalId: string) => void;
	readonly lockAllJournals: () => void;
}

const JournalLockContext = createContext<JournalLockContextValue | null>(null);

export function useJournalLock(): JournalLockContextValue {
	const context = useContext(JournalLockContext);
	if (!context) {
		throw new Error('useJournalLock must be used within a JournalLockProvider');
	}
	return context;
}

interface JournalLockProviderProps {
	readonly children: React.ReactNode;
}

export function JournalLockProvider({ children }: JournalLockProviderProps): React.JSX.Element {
	const [unlockedIds, setUnlockedIds] = useState<ReadonlySet<string>>(() => new Set());
	const unlockedRef = useRef(unlockedIds);
	unlockedRef.current = unlockedIds;

	const isJournalUnlocked = useCallback((journalId: string): boolean => {
		return unlockedRef.current.has(journalId);
	}, []);

	const unlockJournal = useCallback((journalId: string) => {
		setUnlockedIds((prev) => {
			if (prev.has(journalId)) return prev;
			const next = new Set(prev);
			next.add(journalId);
			return next;
		});
	}, []);

	const lockJournal = useCallback((journalId: string) => {
		setUnlockedIds((prev) => {
			if (!prev.has(journalId)) return prev;
			const next = new Set(prev);
			next.delete(journalId);
			return next;
		});
	}, []);

	const lockAllJournals = useCallback(() => {
		setUnlockedIds((prev) => (prev.size === 0 ? prev : new Set()));
	}, []);

	useEffect(() => {
		const sub = AppState.addEventListener('change', (state) => {
			if (state === 'active') lockAllJournals();
		});
		return () => sub.remove();
	}, [lockAllJournals]);

	const value = useMemo<JournalLockContextValue>(
		() => ({ isJournalUnlocked, unlockJournal, lockJournal, lockAllJournals }),
		[isJournalUnlocked, unlockJournal, lockJournal, lockAllJournals],
	);

	return <JournalLockContext.Provider value={value}>{children}</JournalLockContext.Provider>;
}
