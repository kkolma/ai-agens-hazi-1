import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.nx/**', '**/*.d.ts'],
  },
  ...tseslint.configs.recommended,
);
