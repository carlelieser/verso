import type { BiometricCapability } from '@/services/biometric-service';

export interface SecurityScopeLabels {
	readonly sectionTitle: string;
	readonly pinDescription: string;
	readonly requirePinLabel: string;
	readonly pinRemoveConfirmDescription: string;
	readonly requirePinEnableReason: string;
	readonly requirePinDisableReason: string;
	readonly biometricsEnableReason: string;
	readonly biometricsDisableReason: string;
}

export interface SecurityScope {
	readonly hasPin: boolean;
	readonly canRequirePin: boolean;
	readonly isRequirePin: boolean;
	readonly isBiometricsEnabled: boolean;
	readonly biometric: BiometricCapability;
	readonly setPin: (pin: string) => Promise<void>;
	readonly verifyPin: (pin: string) => Promise<boolean>;
	readonly clearPin: () => Promise<void>;
	readonly setRequirePin: (value: boolean) => Promise<void>;
	readonly setBiometricsEnabled: (value: boolean) => Promise<void>;
	readonly requireAuth: (reason: string) => Promise<boolean>;
	readonly confirmRemovePin: () => Promise<boolean>;
	readonly labels: SecurityScopeLabels;
}
