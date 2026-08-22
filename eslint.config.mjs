import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'scripts/sprite.json',
      'custom-elements.json',
      'test-results/**',
      'playwright-report/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // The plugin still ships `plugins` as an array of strings, which flat config
  // rejects — so take its rules and register it in the shape flat config wants.
  {
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs['recommended-latest'].rules,
  },

  {
    languageOptions: {
      parserOptions: {
        // tsconfig covers src, e2e and the *.config.ts files, so the project
        // service finds everything it needs on its own.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // The sprite is data. `!` on a bounds-checked grid lookup is clearer than
      // a guard that can never fire.
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Plain JS outside the TypeScript project — no type information to lint with.
  // Two entries, not one: spreading the preset alongside a `rules` key would
  // overwrite the very rules it exists to switch off.
  {
    files: ['**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['**/*.mjs'],
    languageOptions: { globals: { console: 'readonly', process: 'readonly' } },
    rules: { 'no-console': 'off' },
  },

  // Prettier owns formatting; ESLint owns everything else. Last, so it wins.
  prettier,
);
