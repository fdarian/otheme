# @otheme/core

## 0.1.1

### Patch Changes

- 688890e: Stop painting opaque backgrounds behind unchanged diff lines in the `git-delta` and `hunk` targets

## 0.1.0

### Minor Changes

- ad9b7fe: Add a `pi` theme target for the earendil-works/pi coding-agent CLI

  New `pi` target that writes a full-render theme JSON to `~/.pi/agent/themes/<theme-id>.json` and sets `theme` in `~/.pi/agent/settings.json`. Supports author and map modes, mirroring the claude-code adapter. Authors vesper, atom-one-light, and claude in author mode.

### Patch Changes

- 2964e29: Author tmux-palette theme for vesper, atom-one-light, and claude.
