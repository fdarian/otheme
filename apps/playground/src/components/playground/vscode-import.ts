/**
 * Browser-side VSCode theme importer.
 *
 * Searches the Open VSX registry, downloads a theme extension's `.vsix`
 * (a plain zip), extracts the contributed theme JSON, and maps it onto our
 * `Theme` schema. All network access is from the static site — Open VSX
 * serves `Access-Control-Allow-Origin: *`, so no proxy is needed.
 *
 * Functions are pure and individually testable; the only side effects are the
 * documented `fetch` calls.
 */

import { Theme } from '@otheme/core/schema';
import vesperJson from '@otheme/core/themes/vesper.json';
import { Schema } from 'effect';
import { unzipSync } from 'fflate';

import type { ThemeValue } from '#/components/playground/types';

const OPEN_VSX_API = 'https://open-vsx.org/api';

/** A theme extension surfaced by the Open VSX search. */
export type ThemeSearchResult = {
  namespace: string;
  name: string;
  displayName: string;
  version: string;
  downloadUrl: string;
  manifestUrl: string;
  downloadCount: number;
  iconUrl?: string;
};

/** The relevant subset of a VSCode theme JSON. */
export type VscodeTokenColor = {
  scope?: string | string[];
  settings: { foreground?: string; background?: string; fontStyle?: string };
};

export type VscodeTheme = {
  name?: string;
  type?: string;
  colors?: Record<string, string>;
  tokenColors?: VscodeTokenColor[] | string;
};

/** One theme contributed by an extension (an extension may ship several). */
export type ImportedTheme = {
  label: string;
  vscodeTheme: VscodeTheme;
};

/** The package.json shape we read from a theme extension. */
type ExtensionManifest = {
  contributes?: {
    themes?: { label?: string; uiTheme?: string; path: string }[];
  };
};

type ExtensionNlsMap = Record<string, string>;

/** Open VSX search response (only the fields we consume). */
type SearchResponse = {
  extensions?: {
    namespace: string;
    name: string;
    displayName?: string;
    version: string;
    downloadCount?: number;
    files?: { download?: string; icon?: string };
  }[];
};

/** Search Open VSX for theme extensions matching the query. */
export async function searchThemes(
  query: string,
): Promise<ThemeSearchResult[]> {
  const url = `${OPEN_VSX_API}/-/search?query=${encodeURIComponent(query)}&size=20&category=Themes&sortBy=relevance`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Open VSX search failed: ${response.status} ${response.statusText}`,
    );
  }
  const body = (await response.json()) as SearchResponse;
  const extensions = body.extensions ?? [];
  return extensions.flatMap((ext) => {
    const download = ext.files?.download;
    if (download === undefined) return [];
    // The Open VSX search response does not include a manifest URL, so build
    // the package.json file URL from the extension coordinates.
    const manifestUrl = `${OPEN_VSX_API}/${ext.namespace}/${ext.name}/${ext.version}/file/package.json`;
    return [
      {
        namespace: ext.namespace,
        name: ext.name,
        displayName: ext.displayName ?? ext.name,
        version: ext.version,
        downloadUrl: download,
        manifestUrl,
        downloadCount: ext.downloadCount ?? 0,
        iconUrl: ext.files?.icon,
      },
    ];
  });
}

/** Strip a leading `./` from a vsix-relative theme path. */
function normalizeThemePath(path: string) {
  return path.startsWith('./') ? path.slice(2) : path;
}

function packageNlsUrl(manifestUrl: string) {
  return manifestUrl.replace(/package\.json$/, 'package.nls.json');
}

function isNlsPlaceholder(value: string) {
  return /^%(.+)%$/.test(value);
}

function resolveNlsString(value: string | undefined, nlsMap: ExtensionNlsMap) {
  if (value === undefined) {
    return undefined;
  }

  const match = value.match(/^%(.+)%$/);
  if (match === null) {
    return value;
  }

  const key = match[1];
  if (key === undefined) {
    return value;
  }

  return nlsMap[key] ?? value;
}

async function fetchPackageNls(manifestUrl: string) {
  const response = await fetch(packageNlsUrl(manifestUrl));

  if (response.status === 404) {
    return {} as ExtensionNlsMap;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch extension localization: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as ExtensionNlsMap;
}

function pickThemeLabel(
  nlsMap: ExtensionNlsMap,
  ...candidates: Array<string | undefined>
) {
  for (const candidate of candidates) {
    const resolved = resolveNlsString(candidate, nlsMap)?.trim();

    if (
      resolved !== undefined &&
      resolved !== '' &&
      !isNlsPlaceholder(resolved)
    ) {
      return resolved;
    }
  }

  return undefined;
}

const textDecoder = new TextDecoder('utf-8');

/**
 * Download and unzip a theme extension, returning one `ImportedTheme` per
 * theme it contributes so the caller can let the user pick.
 */
export async function importTheme(
  result: ThemeSearchResult,
): Promise<ImportedTheme[]> {
  const manifestResponse = await fetch(result.manifestUrl);
  if (!manifestResponse.ok) {
    throw new Error(
      `Failed to fetch extension manifest: ${manifestResponse.status} ${manifestResponse.statusText}`,
    );
  }
  const manifest = (await manifestResponse.json()) as ExtensionManifest;
  const nlsMap = await fetchPackageNls(result.manifestUrl);
  const contributedThemes = manifest.contributes?.themes ?? [];
  if (contributedThemes.length === 0) {
    throw new Error('This extension does not contribute any themes.');
  }

  const vsixResponse = await fetch(result.downloadUrl);
  if (!vsixResponse.ok) {
    throw new Error(
      `Failed to download extension: ${vsixResponse.status} ${vsixResponse.statusText}`,
    );
  }
  const vsixBytes = new Uint8Array(await vsixResponse.arrayBuffer());
  const entries = unzipSync(vsixBytes);

  return contributedThemes.map((contributed, index) => {
    const entryPath = `extension/${normalizeThemePath(contributed.path)}`;
    const entry = entries[entryPath];
    if (entry === undefined) {
      throw new Error(`Theme file not found in extension: ${entryPath}`);
    }
    const vscodeTheme = JSON.parse(textDecoder.decode(entry)) as VscodeTheme;
    return {
      label:
        pickThemeLabel(
          nlsMap,
          contributed.label,
          vscodeTheme.name,
          result.displayName,
        ) ?? `Theme ${index + 1}`,
      vscodeTheme,
    };
  });
}

/** A parsed sRGB color with an alpha channel in 0..1. */
type Rgba = { r: number; g: number; b: number; a: number };

/** Expand `RGB`/`RGBA` shorthand to the full `RRGGBB`/`RRGGBBAA` form. */
function expandShorthand(hex: string) {
  if (hex.length !== 3 && hex.length !== 4) return hex;
  return hex
    .split('')
    .map((char) => char + char)
    .join('');
}

/** Parse `#RGB`, `#RRGGBB`, or `#RRGGBBAA` into channels; null on anything else. */
function parseHex(value: string): Rgba | null {
  const hex = expandShorthand(value.trim().replace(/^#/, ''));
  const byte = (start: number) =>
    Number.parseInt(hex.slice(start, start + 2), 16);
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return { r: byte(0), g: byte(2), b: byte(4), a: 1 };
  }
  if (/^[0-9a-fA-F]{8}$/.test(hex)) {
    return { r: byte(0), g: byte(2), b: byte(4), a: byte(6) / 255 };
  }
  return null;
}

function channelToHex(channel: number) {
  const clamped = Math.max(0, Math.min(255, Math.round(channel)));
  return clamped.toString(16).padStart(2, '0');
}

function toHex(rgb: { r: number; g: number; b: number }) {
  return `#${channelToHex(rgb.r)}${channelToHex(rgb.g)}${channelToHex(rgb.b)}`;
}

/** Composite a (possibly translucent) color over an opaque background. */
function flattenOver(color: Rgba, background: Rgba) {
  const blend = (top: number, bottom: number) =>
    top * color.a + bottom * (1 - color.a);
  return {
    r: blend(color.r, background.r),
    g: blend(color.g, background.g),
    b: blend(color.b, background.b),
  };
}

/** Linearly mix two opaque colors; `ratio` is the weight of `a`. */
function mix(a: Rgba, b: Rgba, ratio: number) {
  const lerp = (x: number, y: number) => x * ratio + y * (1 - ratio);
  return { r: lerp(a.r, b.r), g: lerp(a.g, b.g), b: lerp(a.b, b.b) };
}

/** Normalize a workbench color to opaque `#RRGGBB`, flattening alpha over bg. */
function normalize(value: string, background: Rgba) {
  const parsed = parseHex(value);
  if (parsed === null) return null;
  if (parsed.a >= 1) return toHex(parsed);
  return toHex(flattenOver(parsed, background));
}

/**
 * Resolve the first workbench color present among `keys`, normalized to
 * `#RRGGBB`. Returns null when none of the keys exist or parse.
 */
function resolveColor(
  colors: Record<string, string>,
  background: Rgba,
  keys: string[],
) {
  for (const key of keys) {
    const value = colors[key];
    if (value === undefined) continue;
    const normalized = normalize(value, background);
    if (normalized !== null) return normalized;
  }
  return null;
}

/** True when `ruleScope` matches `target` exactly or as a dotted prefix. */
function scopeMatches(ruleScope: string, target: string) {
  const trimmed = ruleScope.trim();
  return trimmed === target || target.startsWith(`${trimmed}.`);
}

/**
 * Find the `settings.foreground` of the first tokenColors rule whose scope
 * (string, comma-list, or array) matches any of `targetScopes`. Match is
 * exact or dotted-prefix, so a rule scope `string` matches `string.quoted`.
 */
export function resolveScope(
  tokenColors: VscodeTokenColor[],
  targetScopes: string[],
) {
  for (const target of targetScopes) {
    for (const rule of tokenColors) {
      const foreground = rule.settings.foreground;
      if (foreground === undefined || rule.scope === undefined) continue;
      const ruleScopes =
        typeof rule.scope === 'string' ? rule.scope.split(',') : rule.scope;
      const matched = ruleScopes.some((s) => scopeMatches(s, target));
      if (matched) return foreground;
    }
  }
  return null;
}

/** The editor default foreground: a tokenColors rule with no/empty scope. */
function defaultForeground(tokenColors: VscodeTokenColor[]) {
  for (const rule of tokenColors) {
    const scope = rule.scope;
    const isDefault =
      scope === undefined ||
      scope === '' ||
      (Array.isArray(scope) && scope.length === 0);
    if (isDefault && rule.settings.foreground !== undefined) {
      return rule.settings.foreground;
    }
  }
  return null;
}

/** Kebab-case a name into a schema-valid id. */
function toId(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length > 0 ? slug : 'imported-theme';
}

const SYNTAX_SCOPES: Record<keyof ThemeValue['syntax'], string[]> = {
  keyword: ['keyword.control', 'keyword'],
  func: ['entity.name.function', 'support.function'],
  type: [
    'entity.name.type',
    'entity.name.class',
    'support.type',
    'support.class',
  ],
  variable: ['variable.other', 'variable'],
  variableMember: [
    'variable.other.property',
    'variable.other.member',
    'support.variable.property',
  ],
  variableBuiltin: ['variable.language', 'support.variable'],
  constant: ['constant.language', 'variable.other.constant', 'constant.other'],
  number: ['constant.numeric'],
  string: ['string.quoted', 'string'],
  stringEscape: ['constant.character.escape'],
  stringSpecial: ['string.regexp', 'string.template', 'string.interpolated'],
  operator: ['keyword.operator'],
  punctuation: ['punctuation', 'meta.brace'],
  punctuationSpecial: [
    'punctuation.definition.template-expression',
    'punctuation.section.embedded',
    'meta.template.expression',
  ],
  tag: ['entity.name.tag'],
  attribute: ['entity.other.attribute-name'],
  markupHeading: ['markup.heading', 'entity.name.section'],
  markupLink: ['markup.underline.link', 'markup.link', 'markup.underline'],
  markupList: ['markup.list', 'punctuation.definition.list'],
};

/** Resolve the 19 syntax colors, falling back to the editor default fg. */
function mapSyntax(
  tokenColors: VscodeTokenColor[],
  background: Rgba,
  fallbackFg: string,
) {
  const keys = Object.keys(SYNTAX_SCOPES) as (keyof ThemeValue['syntax'])[];
  const entries = keys.map((key) => {
    const resolved = resolveScope(tokenColors, SYNTAX_SCOPES[key]);
    const value =
      resolved !== null
        ? (normalize(resolved, background) ?? fallbackFg)
        : fallbackFg;
    return [key, value] as const;
  });
  return Object.fromEntries(entries) as ThemeValue['syntax'];
}

const decodeTheme = Schema.decodeUnknownSync(Theme);

/**
 * Map a VSCode theme JSON onto our `Theme`. Workbench `colors` drive the ui
 * palette; `tokenColors` scopes drive the syntax palette. Fields with no clean
 * workbench/scope source are derived (computed) — never faked. The result is
 * validated against our schema and throws with the decode error on failure.
 */
export function mapVscodeTheme(vscodeTheme: VscodeTheme, name: string) {
  if (typeof vscodeTheme.tokenColors === 'string') {
    throw new Error(
      'This theme stores syntax colors as a .tmTheme file, which is not supported yet.',
    );
  }
  const colors = vscodeTheme.colors ?? {};
  const tokenColors = vscodeTheme.tokenColors ?? [];

  const bgHex = resolveColor(colors, { r: 0, g: 0, b: 0, a: 1 }, [
    'editor.background',
  ]);
  if (bgHex === null) {
    throw new Error('Theme has no editor.background color to anchor against.');
  }
  const background = parseHex(bgHex) ?? { r: 0, g: 0, b: 0, a: 1 };

  const fgHex =
    resolveColor(colors, background, ['editor.foreground']) ??
    (() => {
      const fallback = defaultForeground(tokenColors);
      const normalized =
        fallback !== null ? normalize(fallback, background) : null;
      return normalized;
    })();
  if (fgHex === null) {
    throw new Error('Theme has no editor.foreground color.');
  }
  const fg = parseHex(fgHex) ?? { r: 255, g: 255, b: 255, a: 1 };

  const pick = (keys: string[], fallback: string) =>
    resolveColor(colors, background, keys) ?? fallback;

  const error = pick(['editorError.foreground'], '#e06c75');
  const warning = pick(['editorWarning.foreground'], '#e5c07b');
  const info = pick(['editorInfo.foreground'], '#61afef');
  const diffAdd = pick(
    ['diffEditor.insertedTextBackground', 'diffEditor.insertedLineBackground'],
    toHex(mix(parseHex('#98c379') ?? fg, background, 0.4)),
  );
  const diffDel = pick(
    ['diffEditor.removedTextBackground', 'diffEditor.removedLineBackground'],
    toHex(mix(parseHex('#e06c75') ?? fg, background, 0.4)),
  );
  const success = pick(
    ['gitDecoration.addedResourceForeground', 'terminal.ansiGreen'],
    '#98c379',
  );

  const fgMuted = toHex(mix(fg, background, 0.5));
  const fgDim = toHex(mix(fg, background, 0.35));
  const commentScope = resolveScope(tokenColors, ['comment']);
  const comment =
    commentScope !== null
      ? (normalize(commentScope, background) ?? fgMuted)
      : fgMuted;
  const diffChg = toHex(
    mix(parseHex(diffAdd) ?? fg, parseHex(diffDel) ?? fg, 0.5),
  );

  const ui: ThemeValue['ui'] = {
    accent: pick(
      ['textLink.activeForeground', 'button.background', 'focusBorder'],
      info,
    ),
    accentFg: pick(['button.foreground'], '#ffffff'),
    bg: bgHex,
    bgFloat: pick(
      ['editorWidget.background', 'editorHoverWidget.background'],
      toHex(mix(fg, background, 0.06)),
    ),
    bgHover: pick(
      ['editor.lineHighlightBackground', 'list.hoverBackground'],
      toHex(mix(fg, background, 0.1)),
    ),
    bgVisual: pick(
      ['editor.selectionBackground'],
      toHex(mix(fg, background, 0.2)),
    ),
    border: pick(
      ['editorGroup.border', 'panel.border', 'widget.border'],
      toHex(mix(fg, background, 0.15)),
    ),
    comment,
    diffAdd,
    diffChg,
    diffDel,
    error,
    fg: fgHex,
    fgDim,
    fgMuted,
    hint: pick(['editorHint.foreground', 'editorInfo.foreground'], info),
    info,
    lineNr: pick(['editorLineNumber.foreground'], fgMuted),
    search: pick(
      ['editor.findMatchHighlightBackground', 'editor.findMatchBackground'],
      toHex(mix(parseHex(warning) ?? fg, background, 0.4)),
    ),
    success,
    warning,
  };

  const syntax = mapSyntax(tokenColors, background, fgHex);

  const appearance = vscodeTheme.type === 'light' ? 'light' : 'dark';
  const candidate = {
    appearance,
    id: toId(name),
    name,
    syntax,
    targets: structuredClone(vesperJson.targets),
    ui,
  };

  return decodeTheme(candidate);
}
