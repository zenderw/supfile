import { FolderIcon, HomeIcon, SearchIcon, SettingsIcon, ShareIcon } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

import { UserMenu } from '@/components/UserMenu';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Accueil', icon: HomeIcon },
  { to: '/files', label: 'Mes fichiers', icon: FolderIcon },
  { to: '/shared', label: 'Partagés', icon: ShareIcon },
  { to: '/search', label: 'Recherche', icon: SearchIcon },
  { to: '/settings', label: 'Paramètres', icon: SettingsIcon },
];

export function MainLayout() {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-64 border-r bg-muted/30 p-4 flex flex-col">
        <div className="text-2xl font-bold mb-8">SUPFile</div>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50 text-muted-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="border-b px-8 py-3 flex justify-end">
          <UserMenu />
        </header>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
