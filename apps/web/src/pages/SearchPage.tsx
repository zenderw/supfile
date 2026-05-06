import { useQuery } from '@tanstack/react-query';
import { FileIcon, Folder, Search as SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { formatBytes } from '@/components/files/FileRow';
import { Input } from '@/components/ui/input';
import { useDebounced } from '@/hooks/use-debounced';
import { searchApi } from '@/lib/api/search';

export function SearchPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 300);

  const enabled = dq.trim().length >= 2;

  const { data, isFetching } = useQuery({
    queryKey: ['search', dq],
    queryFn: () => searchApi.run(dq.trim()),
    enabled,
    placeholderData: (prev) => prev,
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Recherche</h1>

      <div className="relative">
        <SearchIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          placeholder="Rechercher un fichier ou un dossier..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      {!enabled && <p className="text-sm text-muted-foreground">Tapez au moins 2 caractères.</p>}

      {enabled && isFetching && <p className="text-sm text-muted-foreground">Recherche...</p>}

      {enabled && data && (
        <div className="space-y-6">
          {data.folders.length === 0 && data.files.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun résultat pour « {dq} ».</p>
          )}

          {data.folders.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Dossiers ({data.folders.length})
              </h2>
              <div className="border rounded-lg divide-y">
                {data.folders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => navigate(`/files/${f.id}`)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/40"
                  >
                    <Folder className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">{f.name}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {data.files.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Fichiers ({data.files.length})
              </h2>
              <div className="border rounded-lg divide-y">
                {data.files.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => navigate(`/preview/${f.id}`)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/40"
                  >
                    <FileIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm flex-1">{f.name}</span>
                    <span className="text-xs text-muted-foreground">{formatBytes(f.size)}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
