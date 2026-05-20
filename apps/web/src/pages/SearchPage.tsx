import { useQuery } from '@tanstack/react-query';
import { FileIcon, Folder, Search as SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { formatBytes } from '@/components/files/FileRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDebounced } from '@/hooks/use-debounced';
import { searchApi, type SearchCategory } from '@/lib/api/search';

type DateRange = 'all' | '7d' | '30d' | '90d' | 'year';

function rangeToDates(range: DateRange): { from?: string; to?: string } {
  if (range === 'all') return {};
  const now = new Date();
  const past = new Date(now);
  if (range === '7d') past.setDate(now.getDate() - 7);
  if (range === '30d') past.setDate(now.getDate() - 30);
  if (range === '90d') past.setDate(now.getDate() - 90);
  if (range === 'year') past.setFullYear(now.getFullYear() - 1);
  return { from: past.toISOString(), to: now.toISOString() };
}

const CATEGORIES: { value: SearchCategory; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Vidéos' },
  { value: 'audio', label: 'Audio' },
  { value: 'pdf', label: 'PDF' },
  { value: 'document', label: 'Documents' },
  { value: 'other', label: 'Autres' },
];

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: 'all', label: 'Toute date' },
  { value: '7d', label: 'Cette semaine' },
  { value: '30d', label: 'Ce mois-ci' },
  { value: '90d', label: 'Trois derniers mois' },
  { value: 'year', label: 'Cette année' },
];

export function SearchPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const dq = useDebounced(q, 300);

  const enabled = dq.trim().length >= 2;

  const { data, isFetching } = useQuery({
    queryKey: ['search', dq, category, dateRange],
    queryFn: () => {
      const dates = rangeToDates(dateRange);
      return searchApi.run(dq.trim(), {
        category,
        from: dates.from,
        to: dates.to,
      });
    },
    enabled,
    placeholderData: (prev) => prev,
  });

  function resetFilters() {
    setCategory('all');
    setDateRange('all');
  }

  const hasActiveFilter = category !== 'all' || dateRange !== 'all';

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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="search-category" className="text-xs">
            Type
          </Label>
          <select
            id="search-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as SearchCategory)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="search-date" className="text-xs">
            Date de modification
          </Label>
          <select
            id="search-date"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {DATE_RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilter && (
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          Réinitialiser les filtres
        </Button>
      )}

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
