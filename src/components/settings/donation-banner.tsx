import { Accordion, Card, ListGroup, Separator } from 'heroui-native';
import React from 'react';
import { Text, View } from 'react-native';

import { CopyableListGroupItem } from '@/components/ui/copyable-list-group-item';
import { LinkButton } from '@/components/ui/link-button';
import { CRYPTO_ADDRESSES, DONATION_LINKS } from '@/constants/donations';

export function DonationBanner(): React.JSX.Element {
	return (
		<Card>
			<Card.Body>
				<Card.Title>Donate</Card.Title>
				<Card.Description>
					Like Verso and want to support development? Show some love by donating below.
				</Card.Description>
				<View className="flex-row gap-1 flex-wrap mt-2">
					{DONATION_LINKS.map((link) => (
						<LinkButton key={link.id} href={link.href}>
							{link.label}
						</LinkButton>
					))}
				</View>
				<Accordion selectionMode="single" className="-mx-2 mt-2">
					<Accordion.Item value="crypto">
						<Accordion.Trigger>
							<View className="flex-row items-center gap-2">
								<Text className="text-foreground text-sm font-medium">
									More options
								</Text>
							</View>
							<Accordion.Indicator />
						</Accordion.Trigger>
						<Accordion.Content className="pb-0">
							<ListGroup variant="transparent" className="-mx-4">
								{CRYPTO_ADDRESSES.map((crypto, index) => (
									<React.Fragment key={crypto.id}>
										{index > 0 ? <Separator className="mx-4" /> : null}
										<CopyableListGroupItem
											label={crypto.label}
											value={crypto.address}
										/>
									</React.Fragment>
								))}
							</ListGroup>
						</Accordion.Content>
					</Accordion.Item>
				</Accordion>
			</Card.Body>
		</Card>
	);
}
