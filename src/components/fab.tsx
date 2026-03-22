import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from 'heroui-native';

interface FabProps {
  readonly icon: React.ReactNode;
  readonly onPress: () => void;
}

export function Fab({ icon, onPress }: FabProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <Button
      variant="primary"
      size="lg"
      isIconOnly
      onPress={onPress}
      className="absolute bottom-8 right-5 w-14 h-14 rounded-full shadow-2xl"
      style={{ bottom: insets.bottom + 16 }}
    >
      {icon}
    </Button>
  );
}
