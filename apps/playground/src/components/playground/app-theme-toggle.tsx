import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Button } from '#/components/ui/button';
import { Menu, MenuItem, MenuPopup, MenuTrigger } from '#/components/ui/menu';

type AppTheme = 'dark' | 'light' | 'system';

const THEME_OPTIONS: {
  icon: typeof Sun;
  label: string;
  value: AppTheme;
}[] = [
  { icon: Sun, label: 'Light', value: 'light' },
  { icon: Moon, label: 'Dark', value: 'dark' },
  { icon: Monitor, label: 'System', value: 'system' },
];

function isAppTheme(value: string | undefined): value is AppTheme {
  return value === 'dark' || value === 'light' || value === 'system';
}

function formatThemeLabel(theme: AppTheme) {
  return theme.charAt(0).toUpperCase() + theme.slice(1);
}

export function AppThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const selectedTheme = isMounted && isAppTheme(theme) ? theme : 'dark';
  const activeTheme = isMounted && resolvedTheme === 'light' ? 'light' : 'dark';
  const TriggerIcon = activeTheme === 'light' ? Sun : Moon;
  const tooltipLabel =
    selectedTheme === 'system'
      ? `App theme: System (${formatThemeLabel(activeTheme)})`
      : `App theme: ${formatThemeLabel(selectedTheme)}`;

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            size="icon"
            variant="outline"
            aria-label={tooltipLabel}
            className="h-9 w-9 shrink-0"
            title={tooltipLabel}
          />
        }
      >
        <TriggerIcon className="size-4" />
      </MenuTrigger>
      <MenuPopup align="end">
        {THEME_OPTIONS.map(({ icon: Icon, label, value }) => (
          <MenuItem
            key={value}
            className="justify-between gap-4"
            onClick={() => setTheme(value)}
          >
            <span className="flex items-center gap-2">
              <Icon className="size-4" />
              {label}
            </span>
            {selectedTheme === value ? (
              <Check className="size-4" />
            ) : (
              <span className="size-4" />
            )}
          </MenuItem>
        ))}
      </MenuPopup>
    </Menu>
  );
}
