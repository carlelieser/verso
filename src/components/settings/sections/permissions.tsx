import { ControlField, ListGroup, Separator } from 'heroui-native';
import { Bell, MapPin, Mic } from 'lucide-react-native';
import type { ComponentType } from 'react';
import React from 'react';

import { Section } from '@/components/layout/section';
import { type Permission, type PermissionStatus, usePermissions } from '@/hooks/use-permissions';
import { useThemeColors } from '@/hooks/use-theme-colors';

function getPermissionDescription(
	status: PermissionStatus,
	grantedText: string,
	defaultText: string,
): string {
	switch (status) {
		case 'granted':
			return grantedText;
		case 'denied':
			return 'Denied';
		default:
			return defaultText;
	}
}

interface PermissionItemProps {
	readonly icon: ComponentType<{ size?: number; color?: string }>;
	readonly permission: Permission;
	readonly title: string;
	readonly grantedText: string;
	readonly defaultText: string;
}

function PermissionItem({
	icon: Icon,
	permission,
	title,
	grantedText,
	defaultText,
}: PermissionItemProps): React.JSX.Element {
	const { muted } = useThemeColors();

	return (
		<ControlField
			isSelected={permission.status === 'granted'}
			onSelectedChange={permission.action}
		>
			<ListGroup.Item>
				<ListGroup.ItemPrefix>
					<Icon size={20} color={muted} />
				</ListGroup.ItemPrefix>
				<ListGroup.ItemContent>
					<ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
					<ListGroup.ItemDescription>
						{getPermissionDescription(permission.status, grantedText, defaultText)}
					</ListGroup.ItemDescription>
				</ListGroup.ItemContent>
				<ListGroup.ItemSuffix>
					<ControlField.Indicator />
				</ListGroup.ItemSuffix>
			</ListGroup.Item>
		</ControlField>
	);
}

export function PermissionsSection(): React.JSX.Element {
	const { location, microphone, notification } = usePermissions();

	return (
		<Section label="Permissions">
			<ListGroup>
				<PermissionItem
					icon={MapPin}
					permission={location}
					title="Location"
					grantedText="Granted"
					defaultText="Required for location-tagging"
				/>
				<Separator className="mx-4" />
				<PermissionItem
					icon={Mic}
					permission={microphone}
					title="Microphone"
					grantedText="Granted"
					defaultText="Required for speech-to-text"
				/>
				<Separator className="mx-4" />
				<PermissionItem
					icon={Bell}
					permission={notification}
					title="Notifications"
					grantedText="Granted"
					defaultText="Required for reminders"
				/>
			</ListGroup>
		</Section>
	);
}
