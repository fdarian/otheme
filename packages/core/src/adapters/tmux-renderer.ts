import { Effect } from 'effect';
import { AdapterError } from '../errors.ts';
import type { Theme, TmuxTarget } from '../theme-schema.ts';

export const tmuxTemplate = `# {{theme_name}} Theme for tmux

# Status bar styling
set -g status-style 'bg=default fg={{muted}}'

# Window status
setw -g window-status-style 'fg={{muted}} bg=default'

# Active window status
setw -g window-status-current-style 'fg={{accent}} bg=default bold'
setw -g window-status-current-format '#[fg={{accent}},bold] #I:#W#F #[default]'

# Pane borders
set -g pane-border-style 'fg={{border}}'
set -g pane-active-border-style 'fg={{border}}'

# Message styling
set -g message-style 'fg={{bg}} bg={{accent}} bold'

# Clock mode
set -g clock-mode-colour '{{accent}}'

# Copy mode highlighting
setw -g mode-style 'bg={{accent}} fg={{bg}} bold'

# Copy mode selection highlighting (tmux 3.6+)
setw -g copy-mode-selection-style 'bg={{accent}} fg={{bg}} bold'

# Search matches styling
setw -g copy-mode-match-style 'bg={{cyan}} fg={{bg}}'
setw -g copy-mode-current-match-style 'bg={{purple}} fg={{bg}} bold'

# Bell
set -g window-status-bell-style 'fg={{red}} bg=default bold'

# Activity
setw -g window-status-activity-style 'fg={{accent}} bg=default bold'

# Command prompt styling
set -g message-command-style 'bg=default fg={{accent}}'

# Pane number display
set -g display-panes-active-colour '{{accent}}'
set -g display-panes-colour '{{muted}}'

# Dim foreground for inactive pane
set -g window-style 'fg={{inactive_fg}},bg=default'
set -g window-active-style 'fg={{fg}},bg=default'

# Status bar formats with prefix indicator
set-option -g status-right "#[fg={{muted}}]#{?client_prefix,,#(~/.config/tmux/tools/format-session/target/release/format-session '#{session_name}') }#[bg={{accent}},fg={{accent_fg}},bold]#{?client_prefix,#(~/.config/tmux/tools/format-session/target/release/format-session '#{session_name}') ,}"

set-option -g window-status-format " #I:#W #{?window_zoomed_flag,󰊓,}"
set-option -g window-status-current-format "#[fg={{accent}}] #W #[fg={{accent}}]#{?window_zoomed_flag,󰊓 ,}#[fg={{accent}},bg=default]"
`;

const placeholders = (
  theme: Theme,
  target: TmuxTarget,
): Record<string, string> => ({
  accent: theme.ui.accent,
  accent_fg: theme.ui.accentFg,
  bg: theme.ui.bg,
  border: theme.ui.border,
  cyan: target.searchMatch,
  fg: theme.ui.fg,
  inactive_fg: target.inactiveFg,
  muted: target.muted,
  purple: target.searchCurrent,
  red: theme.ui.error,
  theme_name: theme.name,
});

export const renderTmux = (
  template: string,
  theme: Theme,
  target: TmuxTarget,
) =>
  Effect.gen(function* () {
    const values = placeholders(theme, target);
    let rendered = template;

    for (const match of template.matchAll(/\{\{(\w+)\}\}/g)) {
      const key = match[1];

      if (key === undefined || values[key] === undefined) {
        return yield* Effect.fail(
          new AdapterError({
            adapterId: 'tmux',
            message: `tmux template references unknown placeholder {{${key}}}`,
          }),
        );
      }
    }

    for (const key of Object.keys(values)) {
      const value = values[key];

      if (value === undefined) {
        return yield* Effect.fail(
          new AdapterError({
            adapterId: 'tmux',
            message: `tmux placeholder ${key} did not resolve to a value`,
          }),
        );
      }

      rendered = rendered.replaceAll(`{{${key}}}`, value);
    }

    return rendered;
  });
