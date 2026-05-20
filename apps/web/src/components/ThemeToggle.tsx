import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/stores/theme.store';

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);

  const isDark = theme === 'dark';
  const label = isDark ? 'Passer en thème clair' : 'Passer en thème sombre';

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={label} title={label}>
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
