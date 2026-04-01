import { ControlField, ListGroup, Separator } from 'heroui-native';
import { Moon, Smartphone } from 'lucide-react-native';
import React from 'react';

import { Section } from '@/components/layout/section';
import { useSettings } from '@/hooks/use-settings';
import { useThemeColors } from '@/hooks/use-theme-colors';

export function AppearanceSection(): React.JSX.Element {
	const { muted } = useThemeColors();
	const { theme, setTheme } = useSettings();
	const isSystemTheme = theme === 'system';
	const isDark = theme === 'dark';

	return (
		<Section label="Appearance">
			<ListGroup>
				<ControlField
					isSelected={isSystemTheme}
					onSelectedChange={(v) => setTheme(v ? 'system' : 'light')}
				>
					<ListGroup.Item>
						<ListGroup.ItemPrefix>
							<Smartphone size={20} color={muted} />
						</ListGroup.ItemPrefix>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Follow system theme</ListGroup.ItemTitle>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<ControlField.Indicator />
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
				</ControlField>
				<Separator className="mx-4" />
				<ControlField
					isDisabled={isSystemTheme}
					isSelected={isDark}
					onSelectedChange={(v) => setTheme(v ? 'dark' : 'light')}
				>
					<ListGroup.Item>
						<ListGroup.ItemPrefix>
							<Moon size={20} color={muted} />
						</ListGroup.ItemPrefix>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Dark mode</ListGroup.ItemTitle>
							<ListGroup.ItemDescription>
								Switch between light and dark theme
							</ListGroup.ItemDescription>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<ControlField.Indicator />
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
				</ControlField>
			</ListGroup>
		</Section>
	);
}
