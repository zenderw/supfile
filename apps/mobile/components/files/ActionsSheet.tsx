import { Modal, Pressable, Text, View } from 'react-native';

interface Action {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  actions: Action[];
}

export function ActionsSheet({ visible, onClose, title, actions }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 bg-black/40 justify-end">
        <Pressable onPress={(e) => e.stopPropagation()} className="bg-white rounded-t-2xl">
          <View className="py-4 px-4 border-b border-slate-100">
            <Text className="text-sm font-medium text-slate-500" numberOfLines={1}>
              {title}
            </Text>
          </View>
          {actions.map((a, i) => (
            <Pressable
              key={i}
              onPress={() => {
                a.onPress();
                onClose();
              }}
              className="px-4 py-4 border-b border-slate-100 active:bg-slate-50"
            >
              <Text className={`text-base ${a.destructive ? 'text-red-600' : 'text-slate-900'}`}>
                {a.label}
              </Text>
            </Pressable>
          ))}
          <Pressable onPress={onClose} className="py-4 active:bg-slate-50">
            <Text className="text-center text-base font-medium text-slate-500">Annuler</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
