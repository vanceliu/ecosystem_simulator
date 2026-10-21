import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint({ overrideConfig: [tseslint.configs.disableTypeChecked] });

async function ruleIds(code: string, filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? []).map((message) => message.ruleId ?? 'fatal');
}

const RESTRICTED_IMPORT = '@typescript-eslint/no-restricted-imports';

describe('simulation purity', () => {
  it.each([
    ['Math.random', 'export const r = Math.random();\n', 'no-restricted-properties'],
    ['Date.now', 'export const t = Date.now();\n', 'no-restricted-globals'],
    ['new Date', 'export const d = new Date();\n', 'no-restricted-globals'],
    [
      'crypto',
      'export const c = crypto.getRandomValues(new Uint8Array(1));\n',
      'no-restricted-globals',
    ],
    ['setTimeout', 'setTimeout(() => undefined, 0);\n', 'no-restricted-globals'],
  ])('rejects %s in src/engine', async (_label, code, rule) => {
    expect(await ruleIds(code, 'src/engine/sample.ts')).toContain(rule);
  });

  it('rejects Math.random in src/generation and src/content', async () => {
    const code = 'export const r = Math.random();\n';
    expect(await ruleIds(code, 'src/generation/sample.ts')).toContain('no-restricted-properties');
    expect(await ruleIds(code, 'src/content/sample.ts')).toContain('no-restricted-properties');
  });

  it('allows Math.random outside simulation layers', async () => {
    const ids = await ruleIds('export const r = Math.random();\n', 'src/ui/sample.ts');
    expect(ids).not.toContain('no-restricted-properties');
  });
});

describe('layer dependency direction', () => {
  it.each([
    ['src/content/a.ts', "import { x } from '../generation/x';\n"],
    ['src/generation/a.ts', "import { x } from '../engine/x';\n"],
    ['src/engine/a.ts', "import { x } from '../game/x';\n"],
    ['src/engine/a.ts', "import { x } from '../ui/x';\n"],
    ['src/game/a.ts', "import { x } from '../persistence/x';\n"],
    ['src/persistence/a.ts', "import { x } from '../ui/x';\n"],
    ['src/ui/a.ts', "import { x } from '../engine/x';\n"],
    ['src/ui/a.ts', "import { x } from '../persistence/x';\n"],
    ['src/engine/a.ts', "import { h } from 'preact';\n"],
    ['src/game/a.ts', "import init from '@sqlite.org/sqlite-wasm';\n"],
  ])('rejects %s → %s', async (filePath, code) => {
    expect(await ruleIds(`${code}export { };\n`, filePath)).toContain(RESTRICTED_IMPORT);
  });

  it.each([
    ['src/engine/a.ts', "import { x } from '../generation/x';\n"],
    ['src/game/a.ts', "import { x } from '../engine/x';\n"],
    ['src/ui/a.ts', "import type { X } from '../engine/x';\n"],
    ['src/ui/a.ts', "import { h } from 'preact';\n"],
    ['src/persistence/a.ts', "import init from '@sqlite.org/sqlite-wasm';\n"],
  ])('allows %s → %s', async (filePath, code) => {
    expect(await ruleIds(`${code}export { };\n`, filePath)).not.toContain(RESTRICTED_IMPORT);
  });
});
