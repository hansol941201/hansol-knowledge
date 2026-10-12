import { fileURLToPath } from 'node:url';
import path from 'node:path';
export const root = process.env.HANSOL_TEST_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
