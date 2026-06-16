import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Schema } from 'effect';
import { OthemeConfig } from '../src/config-store.ts';
import { Theme } from '../src/theme-schema.ts';

const toJsonSchemaOutput = (schema: Schema.Schema.Any) => {
  const doc = Schema.toJsonSchemaDocument(schema);
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    ...(Object.keys(doc.definitions).length > 0
      ? { $defs: doc.definitions }
      : {}),
    ...doc.schema,
  };
};

const themeOutputPath = join(import.meta.dir, '..', 'theme.schema.json');
await writeFile(
  themeOutputPath,
  `${JSON.stringify(toJsonSchemaOutput(Theme), null, 2)}\n`,
);
console.log('Generated theme.schema.json');

const configOutputPath = join(import.meta.dir, '..', 'config.schema.json');
await writeFile(
  configOutputPath,
  `${JSON.stringify(toJsonSchemaOutput(OthemeConfig), null, 2)}\n`,
);
console.log('Generated config.schema.json');
