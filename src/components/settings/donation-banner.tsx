import { Accordion, Card, ListGroup, Separator } from 'heroui-native';
import React from 'react';
import { Text, View } from 'react-native';

import { CopyableListGroupItem } from '@/components/ui/copyable-list-group-item';
import { LinkButton } from '@/components/ui/link-button';

const DONATION_LINKS = [
	{ id: 'liberapay', label: 'Liberapay', href: process.env.EXPO_PUBLIC_DONATE_LIBERAPAY_URL },
	{ id: 'venmo', label: 'Venmo', href: process.env.EXPO_PUBLIC_DONATE_VENMO_URL },
	{ id: 'paypal', label: 'PayPal', href: process.env.EXPO_PUBLIC_DONATE_PAYPAL_URL },
] as const;

const CRYPTO_ADDRESSES = [
	{ id: 'eth', label: 'Ethereum', address: process.env.EXPO_PUBLIC_DONATE_ETH_ADDRESS },
	{ id: 'sol', label: 'Solana', address: process.env.EXPO_PUBLIC_DONATE_SOL_ADDRESS },
	{ id: 'btc', label: 'Bitcoin', address: process.env.EXPO_PUBLIC_DONATE_BTC_ADDRESS },
	{ id: 'doge', label: 'Dogecoin', address: process.env.EXPO_PUBLIC_DONATE_DOGE_ADDRESS },
] as const;

export function DonationBanner(): React.JSX.Element {
	return (
		<Card>
			<Card.Body>
				<Card.Title>Donate</Card.Title>
				<Card.Description>
					Like Verso and want to support development? Show some love by donating below.
				</Card.Description>
				<View className="flex-row gap-1 flex-wrap mt-2">
					{DONATION_LINKS.map((link) =>
						link.href ? (
							<LinkButton key={link.id} href={link.href}>
								{link.label}
							</LinkButton>
						) : null,
					)}
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
								{CRYPTO_ADDRESSES.map((crypto, index) =>
									crypto.address ? (
										<React.Fragment key={crypto.id}>
											{index > 0 ? <Separator className="mx-4" /> : null}
											<CopyableListGroupItem
												label={crypto.label}
												value={crypto.address}
											/>
										</React.Fragment>
									) : null,
								)}
							</ListGroup>
						</Accordion.Content>
					</Accordion.Item>
				</Accordion>
			</Card.Body>
		</Card>
	);
}
