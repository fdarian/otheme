import { defineConfig } from 'vocs/config';

export default defineConfig({
  colorScheme: 'light dark',
  description:
    'End-user guide for applying one theme consistently across supported tools.',
  renderStrategy: 'full-static',
  rootDir: '.',
  sidebar: [
    {
      text: 'Getting Started',
      items: [
        { text: 'What is otheme', link: '/' },
        { text: 'Installation', link: '/getting-started/installation' },
        { text: 'Usage', link: '/getting-started/usage' },
      ],
    },
    {
      text: 'Targets',
      items: [
        { text: 'nvim', link: '/targets/nvim' },
        { text: 'tmux', link: '/targets/tmux' },
        { text: 'ghostty', link: '/targets/ghostty' },
        { text: 'claude-code', link: '/targets/claude-code' },
        { text: 'macos', link: '/targets/macos' },
        { text: 'git-delta', link: '/targets/git-delta' },
        { text: 'bat', link: '/targets/bat' },
        { text: 'yazi', link: '/targets/yazi' },
        { text: 'hunk', link: '/targets/hunk' },
      ],
    },
  ],
  srcDir: '.',
  title: 'otheme',
  topNav: [
    { text: 'Guide', link: '/' },
    { text: 'Targets', link: '/targets/nvim' },
    { text: 'Playground', link: 'https://otheme-playground.vercel.app/' },
  ],
  socials: [{ icon: 'github', link: 'https://github.com/fdarian/otheme' }],
});
