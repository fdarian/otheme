import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

import appCss from '../globals.css?url';

const DEFAULT_THEME = 'dark';
const THEME_STORAGE_KEY = 'theme';
const THEME_CLASS_VALUES = ['light', 'dark'] as const;
const THEME_INIT_SCRIPT = `
(() => {
  const root = document.documentElement;
  const themeValues = ${JSON.stringify(THEME_CLASS_VALUES)};

  function applyTheme(nextTheme) {
    root.classList.remove(...themeValues);
    root.classList.add(nextTheme);
    root.style.colorScheme = nextTheme;
  }

  function resolveSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  try {
    const savedTheme = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    const nextTheme =
      savedTheme === 'system'
        ? resolveSystemTheme()
        : savedTheme ?? ${JSON.stringify(DEFAULT_THEME)};

    applyTheme(nextTheme);
  } catch {
    applyTheme(${JSON.stringify(DEFAULT_THEME)});
  }
})();
`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'otheme playground' },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
    ],
    scripts: [
      {
        id: 'theme-init',
        children: THEME_INIT_SCRIPT,
      },
    ],
  }),

  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={DEFAULT_THEME}
      style={{ colorScheme: DEFAULT_THEME }}
      suppressHydrationWarning
    >
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme={DEFAULT_THEME}
          disableTransitionOnChange
          enableSystem
        >
          {children}
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
