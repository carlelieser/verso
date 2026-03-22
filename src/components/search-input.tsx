import { Search } from 'lucide-react-native';
import React from 'react';
import { TextInput, View } from 'react-native';

import { useThemeColors } from '@/hooks/use-theme-colors';

interface SearchInputProps {
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly placeholder?: string;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search...',
}: SearchInputProps): React.JSX.Element {
  const { muted, surface, foreground, border } = useThemeColors();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: border,
        gap: 8,
      }}
    >
      <Search size={16} color={muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={muted}
        style={{ flex: 1, fontSize: 15, color: foreground, padding: 0 }}
      />
    </View>
  );
}
