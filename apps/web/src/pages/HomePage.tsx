import { useQuery } from '@tanstack/react-query';
import { FileIcon, FileText, Film, FolderIcon, ImageIcon, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { StorageDonut } from '@/components/StorageDonut';
import { formatBytes } from '@/components/files/FileRow';
import type { SearchCategory } from '@/lib/api/search';
import { statsApi } from '@/lib/api/stats';

function pct(used: string, quota: string): number {
  const u = Number(used);
  const q = Number(quota);
  if (!q) return 0;
  return Math.min(100, (u / q) * 100);
}

export function HomePage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => statsApi.me(),
  });

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Chargement...</p>;
  }

  const usedPct = pct(data.usedSpace, data.quota);

  const categoryIcons: {
    key: SearchCategory;
    label: string;
    icon: typeof FileIcon;
    count: number;
  }[] = [
    { key: 'image', label: 'Images', icon: ImageIcon, count: data.byCategory.image },
    { key: 'video', label: 'Vidéos', icon: Film, count: data.byCategory.video },
    { key: 'audio', label: 'Audio', icon: Music, count: data.byCategory.audio },
    { key: 'pdf', label: 'PDF', icon: FileText, count: data.byCategory.pdf },
    { key: 'document', label: 'Documents', icon: FileText, count: data.byCategory.document },
    { key: 'other', label: 'Autres', icon: FileIcon, count: data.byCategory.other },
  ];

  function openCategory(category: SearchCategory) {
    navigate(`/search?category=${category}`);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Tableau de bord</h1>

      {/* bloc espace */}
      <section className="border rounded-lg p-6 space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase">Espace utilisé</h2>
          <span className="text-sm">
            {formatBytes(data.usedSpace)} / {formatBytes(data.quota)}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${usedPct}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">{usedPct.toFixed(1)}% utilisé</p>
      </section>

      {/* tuiles totaux */}
      <section className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => navigate('/files')}
          className="border rounded-lg p-6 text-left hover:bg-muted/30"
        >
          <FolderIcon className="h-6 w-6 text-muted-foreground mb-2" />
          <div className="text-3xl font-bold">{data.totalFolders}</div>
          <div className="text-sm text-muted-foreground">dossiers</div>
        </button>
        <button
          type="button"
          onClick={() => navigate('/files')}
          className="border rounded-lg p-6 text-left hover:bg-muted/30"
        >
          <FileIcon className="h-6 w-6 text-muted-foreground mb-2" />
          <div className="text-3xl font-bold">{data.totalFiles}</div>
          <div className="text-sm text-muted-foreground">fichiers</div>
        </button>
      </section>

      {/* repartition par categorie - graphique */}
      <section className="border rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase">
          Répartition de l'espace
        </h2>
        <StorageDonut sizes={data.sizeByCategory} onCategoryClick={openCategory} />
      </section>

      {/* nombre de fichiers par categorie */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
          Par catégorie (nombre)
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {categoryIcons.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => openCategory(key)}
              disabled={count === 0}
              className="border rounded-lg p-3 flex items-center gap-3 text-left hover:bg-muted/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <Icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-lg font-semibold leading-tight">{count}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* recents */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
          Fichiers récents
        </h2>
        {data.recentFiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun fichier pour l'instant.</p>
        ) : (
          <div className="border rounded-lg divide-y">
            {data.recentFiles.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => navigate(`/preview/${f.id}`)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/40"
              >
                <FileIcon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">{f.name}</span>
                <span className="text-xs text-muted-foreground">{formatBytes(f.size)}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
