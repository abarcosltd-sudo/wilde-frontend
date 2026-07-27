/**
 * The `lint` script has existed since the project was set up but had no config
 * to run against, so it has never actually reported anything.
 *
 * Deliberately type-unaware (no `parserOptions.project`): `npm run build` runs
 * `tsc` first, so type errors are already caught there, and a type-aware lint
 * pass costs a full program build for rules that would largely duplicate it.
 */
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'node_modules', 'scripts', '*.config.js', '*.cjs'],
  rules: {
    // `tsc` resolves every identifier already, and the base rule can't see
    // type-only names — it reports `React.FC` and friends as undefined.
    'no-undef': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    }],
    // Firebase and Ionic both hand back values this codebase narrows by hand;
    // flagging every one of them would bury the findings that matter.
    '@typescript-eslint/no-explicit-any': 'warn',
    // The one that catches a real class of bug rather than a style preference.
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    eqeqeq: ['error', 'always', { null: 'ignore' }],
  },
  overrides: [
    {
      files: ['tests/**/*.{ts,tsx}'],
      env: { node: true },
      // Vitest globals, enabled via `test.globals` in vite.config.ts.
      globals: { describe: 'readonly', it: 'readonly', expect: 'readonly', vi: 'readonly' },
    },
  ],
};
