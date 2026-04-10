import { ActivityIndicator, Pressable, Text } from 'react-native';

interface Props {
  onPress: () => void;
  label: string;
  loading?: boolean;
  disabled?: boolean;
}

export function PrimaryButton({ onPress, label, loading, disabled }: Props) {
  const isDisabled = loading || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`h-12 items-center justify-center rounded-md ${
        isDisabled ? 'bg-slate-400' : 'bg-slate-900 active:bg-slate-800'
      }`}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text className="text-base font-medium text-white">{label}</Text>
      )}
    </Pressable>
  );
}
