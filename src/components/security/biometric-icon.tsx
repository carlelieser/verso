import * as LocalAuthentication from 'expo-local-authentication';
import { Fingerprint, ScanFace, ScanEye } from 'lucide-react-native';
import React from 'react';

import type { AuthenticationType } from '@/services/biometric-service';

interface BiometricIconProps {
	readonly type: AuthenticationType;
	readonly size?: number;
	readonly color: string;
}

export function BiometricIcon({ type, size = 20, color }: BiometricIconProps): React.JSX.Element {
	switch (type) {
		case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
			return <ScanFace size={size} color={color} />;
		case LocalAuthentication.AuthenticationType.IRIS:
			return <ScanEye size={size} color={color} />;
		default:
			return <Fingerprint size={size} color={color} />;
	}
}
