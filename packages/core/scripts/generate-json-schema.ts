import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Schema } from 'effect';
import { Theme } from '../src/theme-schema.ts';

const doc = Schema.toJsonSchemaDocument(Theme);

const output = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  ...(Object.keys(doc.definitions).length > 0
    ? { $defs: doc.definitions }
    : {}),
  ...doc.schema,
};

const outputPath = join(import.meta.dir, '..', 'theme.schema.json');
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log('Generated theme.schema.json');
