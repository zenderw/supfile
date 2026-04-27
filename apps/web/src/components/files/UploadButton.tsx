import { Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useUploadFile } from '@/hooks/use-folders';

interface Props {
  parentId: string | null;
}

export function UploadButton({ parentId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const upload = useUploadFile(parentId);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProgress(0);
    upload.mutate(
      { file, onProgress: (pct) => setProgress(pct) },
      {
        onSettled: () => {
          setProgress(null);
          if (inputRef.current) inputRef.current.value = '';
        },
      },
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input ref={inputRef} type="file" className="hidden" onChange={handleChange} />
      <Button onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
        <Upload className="h-4 w-4 mr-2" />
        {upload.isPending && progress !== null ? `Upload ${progress}%` : 'Envoyer un fichier'}
      </Button>
    </div>
  );
}
