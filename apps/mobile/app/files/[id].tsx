import { useLocalSearchParams } from 'expo-router';

import { FilesScreen } from '@/components/files/FilesScreen';

export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FilesScreen folderId={id ?? null} />;
}
