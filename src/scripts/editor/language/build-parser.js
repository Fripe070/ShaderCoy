#!/usr/bin/env node

/* eslint-env node */
/* eslint no-console: "off" */

import { buildParserFile } from "@lezer/generator";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const grammarPath = join(__dirname, 'glsl.grammar');
const outputPath = join(__dirname, 'glsl.parser.ts');

try {
  const grammar = readFileSync(grammarPath, 'utf8');
  const result = buildParserFile(grammar, {
    fileName: 'glsl.grammar',
    moduleStyle: 'es',
    warn: (message) => console.warn(`Warning: ${message}`)
  });
  
  console.log('Result type:', typeof result);
  console.log('Result keys:', Object.keys(result));
  
  const parserCode = result.parser || result.toString();
  writeFileSync(outputPath, parserCode);
  console.log('GLSL parser generated successfully!');
} catch (error) {
  console.error('Error generating parser:', error);
  process.exit(1);
}