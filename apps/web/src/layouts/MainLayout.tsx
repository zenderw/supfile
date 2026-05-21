import {
  FolderIcon,
  HomeIcon,
  SearchIcon,
  SettingsIcon,
  ShareIcon,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { toast } from 'sonner';

import { ThemeToggle } from '@/components/ThemeToggle';
import { UserMenu } from '@/components/UserMenu';
import { DND_MIME, type DnDPayload } from '@/components/files/FileRow';
import { useDeleteFile, useDeleteFolder } from '@/hooks/use-folders';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Accueil', icon: HomeIcon },
  { to: '/files', label: 'Mes fichiers', icon: FolderIcon },
  { to: '/shared', label: 'Partagés', icon: ShareIcon },
  { to: '/search', label: 'Recherche', icon: SearchIcon },
  { to: '/trash', label: 'Corbeille', icon: Trash2 },
  { to: '/pricing', label: 'Abonnement', icon: Sparkles },
  { to: '/settings', label: 'Paramètres', icon: SettingsIcon },
];

export function MainLayout() {
  const deleteFile = useDeleteFile(null);
  const deleteFolder = useDeleteFolder(null);
  const [trashHover, setTrashHover] = useState(false);

  function handleTrashDragOver(e: React.DragEvent<HTMLAnchorElement>) {
    if (!e.dataTransfer.types.includes(DND_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setTrashHover(true);
  }

  function handleTrashDrop(e: React.DragEvent<HTMLAnchorElement>) {
    const raw = e.dataTransfer.getData(DND_MIME);
    if (!raw) return;
    e.preventDefault();
    setTrashHover(false);
    try {
      const payload = JSON.parse(raw) as DnDPayload;
      if (payload.type === 'file') {
        deleteFile.mutate(payload.id);
      } else {
        deleteFolder.mutate(payload.id);
      }
      toast.message(`${payload.name} déplacé dans la corbeille`);
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-64 border-r bg-muted/30 p-4 flex flex-col">
        <div className="text-2xl font-bold mb-8">SUPFile</div>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isTrash = to === '/trash';
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onDragOver={isTrash ? handleTrashDragOver : undefined}
                onDragLeave={isTrash ? () => setTrashHover(false) : undefined}
                onDrop={isTrash ? handleTrashDrop : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50 text-muted-foreground',
                    isTrash && trashHover && 'ring-2 ring-destructive bg-destructive/10',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="border-b px-8 py-3 flex justify-end items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </header>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
