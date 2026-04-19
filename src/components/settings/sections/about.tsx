import { router } from 'expo-router';
import { ListGroup, Separator } from 'heroui-native';
import { BookOpen, Code, Hash, RotateCcw } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Linking } from 'react-native';

import { Section } from '@/components/layout/section';
import { LibrariesDialog } from '@/components/settings/libraries-dialog';
import { SETTINGS_ONBOARDING_COMPLETE_KEY } from '@/constants/settings';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { storage } from '@/services/storage';
import { log } from '@/utils/log';

import packageJson from '../../../../package.json';

function restartOnboarding(): void {
	storage
		.remove(SETTINGS_ONBOARDING_COMPLETE_KEY)
		.then(() => {
			router.replace('/onboarding');
		})
		.catch((err: unknown) => {
			log.error('about', 'Failed to restart onboarding', err);
		});
}

export function AboutSection(): React.JSX.Element {
	const { muted } = useThemeColors();
	const [isLibrariesOpen, setIsLibrariesOpen] = useState(false);

	const handleOpenDeveloper = useCallback(() => {
		Linking.openURL(packageJson.author.url);
	}, []);

	return (
		<>
			<Section label="About">
				<ListGroup>
					<ListGroup.Item>
						<ListGroup.ItemPrefix>
							<Hash size={20} color={muted} />
						</ListGroup.ItemPrefix>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Version</ListGroup.ItemTitle>
							<ListGroup.ItemDescription>
								{packageJson.version}
							</ListGroup.ItemDescription>
						</ListGroup.ItemContent>
					</ListGroup.Item>
					<Separator className="mx-4" />
					<ListGroup.Item onPress={handleOpenDeveloper}>
						<ListGroup.ItemPrefix>
							<Code size={20} color={muted} />
						</ListGroup.ItemPrefix>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Developer</ListGroup.ItemTitle>
							<ListGroup.ItemDescription>
								{packageJson.author.name}
							</ListGroup.ItemDescription>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix />
					</ListGroup.Item>
					<Separator className="mx-4" />
					<ListGroup.Item onPress={() => setIsLibrariesOpen(true)}>
						<ListGroup.ItemPrefix>
							<BookOpen size={20} color={muted} />
						</ListGroup.ItemPrefix>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Open source libraries</ListGroup.ItemTitle>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix />
					</ListGroup.Item>
					<Separator className="mx-4" />
					<ListGroup.Item onPress={restartOnboarding}>
						<ListGroup.ItemPrefix>
							<RotateCcw size={20} color={muted} />
						</ListGroup.ItemPrefix>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Restart onboarding</ListGroup.ItemTitle>
							<ListGroup.ItemDescription>
								Go through the welcome flow again
							</ListGroup.ItemDescription>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix />
					</ListGroup.Item>
				</ListGroup>
			</Section>

			<LibrariesDialog isOpen={isLibrariesOpen} onClose={() => setIsLibrariesOpen(false)} />
		</>
	);
}
