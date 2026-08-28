import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'assets/**', 'graphify-out/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts', '*.config.ts'],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error'
    }
  }
)
