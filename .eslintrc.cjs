module.exports = {
  root: true,
  env: {
    node: true,
    'vue/setup-compiler-macros': true
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended'
  ],
  parserOptions: {
    parser: '@babel/eslint-parser',
    requireConfigFile: false
  },
  rules: {
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'vue/no-unused-components': 'warn',
    'vue/multi-word-component-names': 'off',
    'vue/no-deprecated-slot-attribute': 'error',
    'vue/no-deprecated-v-on-native-modifier': 'error',
    'vue/valid-v-slot': 'error',
    'vue/no-unused-vars': 'warn'
  }
}
