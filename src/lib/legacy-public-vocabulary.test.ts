import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const scannedRoots = ['src/app', 'src/components', 'src/lib', 'messages', 'README.md'];
const forbidden = [
  '/api/mihad/intent',
  'MihadScout',
  'mihad-scout',
  'AI property scout',
  'كشاف عقاري',
  'property scout for serious buyers',
  'concierge search',
];

function listFiles(target: string): string[] {
  const absolute = join(repoRoot, target);
  if (!existsSync(absolute)) return [];
  const stat = statSync(absolute);
  if (stat.isFile()) return [absolute];
  return readdirSync(absolute).flatMap((entry) => listFiles(join(target, entry)));
}

describe('legacy public vocabulary', () => {
  it('keeps removed scout language out of public web surfaces', () => {
    const offenders = scannedRoots
      .flatMap((root) => listFiles(root))
      .filter((file) => !file.endsWith('legacy-public-vocabulary.test.ts'))
      .filter((file) => /\.(ts|tsx|json|md)$/.test(file))
      .flatMap((file) => {
        const source = readFileSync(file, 'utf8');
        return forbidden
          .filter((term) => source.includes(term))
          .map((term) => `${file.replace(`${repoRoot}/`, '')}: ${term}`);
      });

    expect(offenders).toEqual([]);
  });
});
