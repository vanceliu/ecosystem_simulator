import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Layer dependency direction: ui → game → engine → generation → content. */
const LAYER_RULES = [
  { layer: 'content', forbidden: ['generation', 'engine', 'game', 'persistence', 'worker', 'ui'] },
  { layer: 'generation', forbidden: ['engine', 'game', 'persistence', 'worker', 'ui'] },
  { layer: 'engine', forbidden: ['game', 'persistence', 'worker', 'ui'] },
  { layer: 'game', forbidden: ['persistence', 'worker', 'ui'] },
  { layer: 'persistence', forbidden: ['worker', 'ui'] },
  { layer: 'worker', forbidden: ['ui'] },
  { layer: 'ui', forbidden: ['content', 'generation', 'engine', 'game', 'persistence', 'worker'] },
];

const PURE_LAYER_FILES = [
  'src/content/**/*.{ts,tsx}',
  'src/generation/**/*.{ts,tsx}',
  'src/engine/**/*.{ts,tsx}',
];

const IMPURE_GLOBALS = [
  'Date',
  'performance',
  'crypto',
  'setTimeout',
  'setInterval',
  'setImmediate',
  'queueMicrotask',
  'requestAnimationFrame',
  'fetch',
  'window',
  'document',
  'self',
  'navigator',
  'localStorage',
  'sessionStorage',
  'indexedDB',
].map((name) => ({ name, message: 'Simulation layers must be pure and deterministic.' }));

const layerImportRules = LAYER_RULES.map(({ layer, forbidden }) => ({
  files: [`src/${layer}/**/*.{ts,tsx}`],
  rules: {
    '@typescript-eslint/no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            regex: `(^|/)(${forbidden.join('|')})(/|$)`,
            allowTypeImports: true,
            message: `Layer "${layer}" must not import from: ${forbidden.join(', ')}.`,
          },
          ...(layer === 'ui'
            ? []
            : [
                {
                  regex: '^(preact|@preact/.+|preact/.+)$',
                  message: 'Only the ui layer may import Preact.',
                },
              ]),
          ...(['worker', 'persistence'].includes(layer)
            ? []
            : [
                {
                  regex: '^@sqlite\\.org/',
                  message: 'Only worker and persistence may import SQLite.',
                },
              ]),
        ],
      },
    ],
  },
}));

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'node_modules', 'db']),
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      eqeqeq: ['error', 'always'],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: { globals: globals.node },
    rules: { eqeqeq: ['error', 'always'] },
  },
  {
    files: ['vite.config.ts', 'vitest.config.ts', 'tools/**/*.ts', 'tests/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/ui/**/*.{ts,tsx}', 'src/main.tsx'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['src/worker/**/*.ts', 'src/persistence/**/*.ts'],
    languageOptions: { globals: globals.worker },
  },
  ...layerImportRules,
  {
    files: PURE_LAYER_FILES,
    rules: {
      'no-restricted-globals': ['error', ...IMPURE_GLOBALS],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Use the seeded Rng passed into the simulation.',
        },
        {
          object: 'globalThis',
          message: 'Simulation layers must not access globalThis.',
        },
      ],
    },
  },
  prettier,
]);
