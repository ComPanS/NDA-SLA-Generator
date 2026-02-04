// Bridge legacy .eslintrc.cjs to ESLint 9 flat config
const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

// Reuse existing .eslintrc.cjs settings under flat config
module.exports = compat.config(require('./.eslintrc.cjs')).map((config) => ({
  ...config,
  files: config.files ?? ['**/*.{js,ts,tsx}'],
  ignores: ['dist', 'node_modules'],
  languageOptions: {
    ...(config.languageOptions || {}),
    parserOptions: {
      ...(config.languageOptions?.parserOptions || {}),
      project: ['./tsconfig.json'],
      tsconfigRootDir: __dirname,
    },
  },
}));
