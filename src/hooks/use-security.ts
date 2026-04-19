import { useContext } from 'react';

import { SecurityContext, type SecurityContextValue } from '@/providers/security-provider';

export function useSecurity(): SecurityContextValue {
	const context = useContext(SecurityContext);
	if (!context) {
		throw new Error('useSecurity must be used within a SecurityProvider');
	}
	return context;
}
