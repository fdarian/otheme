import { withPreset } from '@fdarian/blume-preset';
import { defineConfig } from 'blume';
import { posthog } from 'blume/analytics';

const ph = process.env.POSTHOG_KEY;

export default defineConfig(
  withPreset({
    title: 'otheme',
    ...(ph ? { analytics: [posthog({ key: ph })] } : {}),
    description:
      'End-user guide for applying one theme consistently across supported tools.',
    github: {
      owner: 'fdarian',
      repo: 'otheme',
      branch: 'main',
      dir: 'apps/docs',
    },
    deployment: { site: 'https://otheme.fdarian.com' },
    navigation: {
      repo: false,
      actions: [
        { label: 'Playground', href: 'https://otheme-playground.vercel.app/' },
      ],
    },
  }),
);
