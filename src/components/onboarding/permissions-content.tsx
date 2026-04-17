import { Check } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import type { Permission } from '@/hooks/use-permissions';
import { useThemeColors } from '@/hooks/use-theme-colors';

export interface PermissionItem {
	readonly label: string;
	readonly description: string;
	readonly icon: React.ComponentType<{ size: number; color: string }>;
	readonly permission: Permission;
}

interface PermissionsContentProps {
	readonly items: readonly PermissionItem[];
}

export function PermissionsContent({ items }: PermissionsContentProps): React.JSX.Element {
	const { background, muted } = useThemeColors();

	return (
		<View className="flex-1 justify-center px-8">
			<Text className="text-3xl font-heading text-foreground mb-2">Set up permissions</Text>
			<Text className="text-base text-muted mb-8">
				These are optional. You can change them later in Settings.
			</Text>

			<View className="gap-4">
				{items.map((item) => {
					const isGranted = item.permission.status === 'granted';
					const IconComponent = item.icon;

					return (
						<Pressable
							key={item.label}
							onPress={() => !isGranted && item.permission.request()}
							className={`flex-row items-center gap-4 rounded-xl px-4 py-4 ${
								isGranted ? 'bg-foreground' : 'bg-surface'
							}`}
						>
							<View
								className={`size-10 rounded-full items-center justify-center ${
									isGranted ? 'bg-background/5' : 'bg-foreground/5'
								}`}
							>
								<IconComponent size={20} color={isGranted ? background : muted} />
							</View>
							<View className="flex-1">
								<Text
									className={`text-base font-medium ${
										isGranted ? 'text-background' : 'text-foreground'
									}`}
								>
									{item.label}
								</Text>
								<Text
									className={`text-sm ${
										isGranted ? 'text-background/60' : 'text-muted'
									}`}
								>
									{item.description}
								</Text>
							</View>
							{isGranted ? <Check size={20} color={background} /> : null}
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}
