import React from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '@/components/layout/screen';
import { AboutSection } from '@/components/settings/sections/about';
import { AppearanceSection } from '@/components/settings/sections/appearance';
import { GeneralSection } from '@/components/settings/sections/general';
import { PermissionsSection } from '@/components/settings/sections/permissions';

export default function SettingsScreen(): React.JSX.Element {
	const { bottom } = useSafeAreaInsets();

	return (
		<Screen title="Settings">
			<ScrollView
				className="rounded-t-4xl overflow-hidden"
				contentContainerClassName="px-6 gap-6"
				contentContainerStyle={{ paddingBottom: bottom }}
			>
				<AppearanceSection />
				<GeneralSection />
				<PermissionsSection />
				<AboutSection />
			</ScrollView>
		</Screen>
	);
}
