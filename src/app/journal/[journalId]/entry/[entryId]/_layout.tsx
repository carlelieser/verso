import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

export default function EntryLayout(): React.JSX.Element {
	return (
		<>
			<StatusBar style="auto" />
			<Slot />
		</>
	);
}
