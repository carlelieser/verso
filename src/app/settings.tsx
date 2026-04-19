import React from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '@/components/layout/screen';
import { DonationBanner } from '@/components/settings/donation-banner';
import { AboutSection } from '@/components/settings/sections/about';
import { AppearanceSection } from '@/components/settings/sections/appearance';
import { GeneralSection } from '@/components/settings/sections/general';
import { PermissionsSection } from '@/components/settings/sections/permissions';
import { SecuritySection } from '@/components/settings/sections/security';
import { useSettings } from '@/hooks/use-settings';

export default function SettingsScreen(): React.JSX.Element {
	const { bottom } = useSafeAreaInsets();
	const { shouldShowDonationBanner } = useSettings();

	return (
		<Screen title="Settings">
			<ScrollView
				className="rounded-t-4xl overflow-hidden"
				contentContainerClassName="px-6 gap-6"
				contentContainerStyle={{ paddingBottom: bottom }}
			>
				{shouldShowDonationBanner ? <DonationBanner /> : null}
				<AppearanceSection />
				<GeneralSection />
				<SecuritySection />
				<PermissionsSection />
				<AboutSection />
			</ScrollView>
		</Screen>
	);
}
