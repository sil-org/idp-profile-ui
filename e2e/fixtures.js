import { test as base, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { MockApi } from './mocks/api.js'
import { NOW, establishedState } from './mocks/data.js'

const require = createRequire(import.meta.url)
const fontsourceDir = path.dirname(require.resolve('@fontsource/roboto/package.json'))
const mdiDir = path.dirname(require.resolve('@mdi/font/package.json'))

// Matches the weights index.html requests from Google Fonts.
const ROBOTO_WEIGHTS = [100, 300, 400, 500, 700, 900]

// Replaces https://www.google.com/recaptcha/api.js: clicking the bound element "solves" the captcha immediately.
const RECAPTCHA_STUB = `
window.grecaptcha = {
  render(el, options) {
    el.addEventListener('click', () => options.callback('test-token'))
    return 0
  },
  reset() {},
}
window.recaptchaLoaded && window.recaptchaLoaded()
`

/**
 * Keeps tests offline and deterministic: fonts and icons come from node_modules instead of the CDNs in index.html,
 * reCAPTCHA is stubbed, and everything else external (analytics, YouTube, Sentry) gets an empty response.
 */
async function routeExternalRequests(context) {
  await context.route(
    (url) => url.hostname !== 'localhost',
    async (route) => {
      const url = new URL(route.request().url())

      if (url.hostname === 'fonts.googleapis.com' && url.pathname === '/css') {
        const css = await Promise.all(ROBOTO_WEIGHTS.map((w) => readFile(path.join(fontsourceDir, `${w}.css`), 'utf8')))
        return route.fulfill({ contentType: 'text/css', body: css.join('\n') })
      }

      // fontsource CSS references ./files/<font>, which resolves against the stylesheet URL.
      if (url.hostname === 'fonts.googleapis.com' && url.pathname.startsWith('/files/')) {
        return route.fulfill({ path: path.join(fontsourceDir, url.pathname) })
      }

      const mdiPrefix = '/npm/@mdi/font@4.x/'
      if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.startsWith(mdiPrefix)) {
        return route.fulfill({ path: path.join(mdiDir, url.pathname.slice(mdiPrefix.length)) })
      }

      if (url.hostname === 'www.google.com' && url.pathname === '/recaptcha/api.js') {
        return route.fulfill({ contentType: 'application/javascript', body: RECAPTCHA_STUB })
      }

      return route.fulfill({ status: 200, body: '' })
    },
  )
}

export const test = base.extend({
  page: async ({ page }, use) => {
    // Start the clock at NOW but let it run: with a frozen Date.now(), Vue ignores a second listener for the same
    // event on an element (it compares event and attach timestamps), which silently breaks `@click.once` on v-btn.
    await page.clock.setSystemTime(NOW)
    await routeExternalRequests(page.context())
    await use(page)
  },

  // Every test gets the fake API with an established user; call `api.use(newUserState())` etc. before navigating.
  api: [
    async ({ page }, use) => {
      const api = new MockApi(establishedState())
      await api.attach(page)
      await use(api)
    },
    { auto: true },
  ],
})

export { expect }

/**
 * Something the user clicks, by its visible name. Vuetify renders `to`/`href` buttons as links and the rest as
 * buttons; accepting either keeps tests independent of how a given UI framework marks them up.
 */
export const action = (page, name, { exact = true } = {}) =>
  page.getByRole('button', { name, exact }).or(page.getByRole('link', { name, exact }))
