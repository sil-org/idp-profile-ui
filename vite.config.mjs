import path from 'path'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // https://stackoverflow.com/questions/66389043/how-can-i-use-vite-env-variables-in-vite-config-js
  const env = loadEnv(mode, process.cwd(), '')
  console.log(`Version: ${env.UI_VERSION}, Project: ${env.VITE_PROJECT_NAME}`)
  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            compatConfig: {
              MODE: 2,
            },
          },
        },
      }),
      vuetify({ autoImport: true }),
      sentryVitePlugin({
        org: 'itse',
        project: env.VITE_PROJECT_NAME,
        authToken: env.SENTRY_AUTH_TOKEN,
      }),
    ],
    server: {
      host: '0.0.0.0',
      port: 8000,
      hmr: {
        clientPort: 443,
        host: 'profile.gtis.guru',
      },
      headers: {
        'X-Frame-Options': 'DENY',
      },
    },
    preview: {
      headers: {
        'X-Frame-Options': 'DENY',
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(env.UI_VERSION),
    },
    //resolve @/ to src/
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
    },
    build: {
      sourcemap: true,
    },
  }
})
