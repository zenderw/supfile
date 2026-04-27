import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';

interface Props {
  visible: boolean;
  initial: string;
  title?: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

export function RenamePrompt({ visible, initial, title = 'Renommer', onSubmit, onCancel }: Props) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    if (visible) setValue(initial);
  }, [visible, initial]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/40 items-center justify-center px-6">
        <View className="bg-white rounded-xl w-full p-5">
          <Text className="text-base font-semibold text-slate-900 mb-3">{title}</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            autoFocus
            className="h-10 border border-slate-300 rounded px-3 text-base text-slate-900"
          />
          <View className="flex-row justify-end gap-2 mt-4">
            <Pressable onPress={onCancel} className="px-4 py-2">
              <Text className="text-slate-500">Annuler</Text>
            </Pressable>
            <Pressable
              onPress={() => value.trim() && onSubmit(value.trim())}
              className="px-4 py-2 bg-slate-900 rounded"
            >
              <Text className="text-white">OK</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
