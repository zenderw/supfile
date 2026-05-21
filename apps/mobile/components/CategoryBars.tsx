import { Pressable, Text, View } from 'react-native';

import { formatBytes, type SearchCategory } from '@/lib/api/files';

type CategorySizes = {
  image: string;
  video: string;
  audio: string;
  pdf: string;
  document: string;
  other: string;
};

interface Props {
  sizeByCategory: CategorySizes;
  onPress?: (cat: SearchCategory) => void;
}

interface Row {
  key: keyof CategorySizes;
  label: string;
  color: string;
  bytes: number;
}

const PALETTE: Record<keyof CategorySizes, { label: string; color: string }> = {
  image: { label: 'Images', color: '#3b82f6' },
  video: { label: 'Vidéos', color: '#ef4444' },
  audio: { label: 'Audio', color: '#8b5cf6' },
  pdf: { label: 'PDF', color: '#f59e0b' },
  document: { label: 'Documents', color: '#10b981' },
  other: { label: 'Autres', color: '#6b7280' },
};

export function CategoryBars({ sizeByCategory, onPress }: Props) {
  const rows: Row[] = (Object.keys(PALETTE) as (keyof CategorySizes)[])
    .map((k) => ({
      key: k,
      label: PALETTE[k].label,
      color: PALETTE[k].color,
      bytes: Number(sizeByCategory[k]),
    }))
    .filter((r) => r.bytes > 0)
    .sort((a, b) => b.bytes - a.bytes);

  if (rows.length === 0) {
    return <Text className="text-xs text-slate-400">Aucun fichier pour l'instant.</Text>;
  }

  const max = rows[0].bytes;

  return (
    <View>
      {rows.map((r) => {
        const widthPct = max > 0 ? (r.bytes / max) * 100 : 0;
        const content = (
          <View className="py-2">
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center gap-2">
                <View style={{ backgroundColor: r.color }} className="h-3 w-3 rounded-sm" />
                <Text className="text-xs text-slate-700">{r.label}</Text>
              </View>
              <Text className="text-xs font-medium text-slate-900">
                {formatBytes(String(r.bytes))}
              </Text>
            </View>
            <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <View
                style={{ backgroundColor: r.color, width: `${widthPct}%` }}
                className="h-full"
              />
            </View>
          </View>
        );
        return onPress ? (
          <Pressable key={r.key} onPress={() => onPress(r.key)} className="active:opacity-60">
            {content}
          </Pressable>
        ) : (
          <View key={r.key}>{content}</View>
        );
      })}
    </View>
  );
}
