import { Button, Dialog, ListGroup } from 'heroui-native';
import React from 'react';
import { Linking, ScrollView, View } from 'react-native';

interface Library {
	readonly name: string;
	readonly url: string;
}

const LIBRARIES: readonly Library[] = [
	{ name: 'Expo', url: 'https://expo.dev' },
	{ name: 'React Native', url: 'https://reactnative.dev' },
	{ name: 'HeroUI Native', url: 'https://heroui.com' },
	{ name: 'Drizzle ORM', url: 'https://orm.drizzle.team' },
	{ name: 'Whisper.rn', url: 'https://github.com/mybigday/whisper.rn' },
	{ name: 'Lucide Icons', url: 'https://lucide.dev' },
	{ name: 'Reanimated', url: 'https://docs.swmansion.com/react-native-reanimated' },
];

interface LibrariesDialogProps {
	readonly isOpen: boolean;
	readonly onClose: () => void;
}

export function LibrariesDialog({ isOpen, onClose }: LibrariesDialogProps): React.JSX.Element {
	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<Dialog.Portal>
				<Dialog.Overlay className="bg-background/50" />
				<Dialog.Content isSwipeable={false}>
					<Dialog.Title>Open Source Libraries</Dialog.Title>
					<Dialog.Description>
						Verso is built with the following libraries
					</Dialog.Description>
					<View className="h-[300px] -mx-3">
						<ScrollView className={'my-2 rounded-2xl'}>
							<ListGroup variant={"transparent"}>
								{LIBRARIES.map((lib) => (
									<ListGroup.Item
										key={lib.name}
										onPress={() => Linking.openURL(lib.url)}
									>
										<ListGroup.ItemContent>
											<ListGroup.ItemTitle>{lib.name}</ListGroup.ItemTitle>
										</ListGroup.ItemContent>
										<ListGroup.ItemSuffix />
									</ListGroup.Item>
								))}
							</ListGroup>
						</ScrollView>
					</View>
					<View className={'flex-row items-center justify-end'}>
						<Button onPress={() => onClose()}>Sounds good</Button>
					</View>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog>
	);
}
