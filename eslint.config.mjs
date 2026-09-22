import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['out', 'dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ['src/main/**/*.ts', 'src/preload/**/*.ts', 'electron.vite.config.ts'],
    languageOptions: { globals: { ...globals.node } }
  },
  {
    files: ['src/renderer/**/*.ts'],
    languageOptions: { globals: { ...globals.browser } }
  }
)
