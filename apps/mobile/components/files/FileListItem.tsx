import { Pressable, Text, View } from 'react-native';

import { formatBytes } from '@/lib/api/files';

interface Props {
  type: 'folder' | 'file';
  name: string;
  size?: string;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function FileListItem({ type, name, size, onPress, onLongPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      className="flex-row items-center px-4 py-3 border-b border-slate-100 active:bg-slate-50"
    >
      <View className="h-9 w-9 items-center justify-center rounded bg-slate-100 mr-3">
        <Text className="text-base">{type === 'folder' ? '📁' : '📄'}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-slate-900" numberOfLines={1}>
          {name}
        </Text>
        {size && <Text className="text-xs text-slate-400 mt-0.5">{formatBytes(size)}</Text>}
      </View>
      <Text className="text-slate-300 text-lg px-2">›</Text>
    </Pressable>
  );
}
