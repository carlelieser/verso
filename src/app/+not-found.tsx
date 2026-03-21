import { Link, Stack } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

export default function NotFoundScreen(): React.JSX.Element {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-xl font-semibold text-foreground">This screen doesn't exist.</Text>
        <Link href="/" className="mt-4 py-4">
          <Text className="text-sm text-accent">Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}
