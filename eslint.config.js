import pluginVue from 'eslint-plugin-vue'
import vuetify from 'eslint-plugin-vuetify'
import prettier from 'eslint-plugin-prettier'

export default [
  ...pluginVue.configs['flat/recommended'],
  {
    plugins: {
      vuetify,
      prettier,
    },
    rules: {
      'vue/no-unused-vars': 'error',
      // Use Prettier's rules
      'prettier/prettier': 'error',
      // Disable formatting rules that might conflict with Prettier
      'vue/html-self-closing': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/max-attributes-per-line': 'off',
    },
  },
]
