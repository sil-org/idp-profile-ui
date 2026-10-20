import { test, expect, action } from './fixtures.js'
import { anonymousState } from './mocks/data.js'

// Runs only in the `subpath` project, against a build with VITE_BASE_PATH=/profile/ (see playwright.config.js).
// Navigate with relative URLs like '#/profile': a leading '/' would resolve to the domain root, not the app.
const APP_URL = 'http://localhost:4174/profile/'

test.describe('served from a subdirectory', () => {
  test('the app loads and the logo links to the app root', async ({ page }) => {
    await page.goto('#/profile')

    await expect(page).toHaveTitle('My Acme Identity Profile')
    await expect(page.getByText('Testy Testerson')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Logo' })).toHaveAttribute('href', '/profile/')
  })

  test('log out returns to the app root', async ({ page }) => {
    await page.goto('#/profile')

    await action(page, 'Log out').click()

    await page.waitForURL('**/api/auth/logout?**')
    expect(new URL(page.url()).searchParams.get('ReturnTo')).toBe(APP_URL)
  })

  test.describe('logged out', () => {
    test.beforeEach(({ api }) => {
      api.use(anonymousState())
    })

    test('login returns to the requested page under the subdirectory', async ({ page }) => {
      await page.goto('#/profile')

      await page.waitForURL('**/api/auth/login?**')
      expect(new URL(page.url()).searchParams.get('ReturnTo')).toBe(`${APP_URL}#/profile`)
    })

    test('an invite link returns to the expired-invite page under the subdirectory', async ({ page }) => {
      await page.goto('#/profile/intro?invite=abc-123')

      await page.waitForURL('**/api/auth/login?**')
      const params = new URL(page.url()).searchParams
      expect(params.get('ReturnTo')).toBe(`${APP_URL}#/profile/intro`)
      expect(params.get('ReturnToOnError')).toBe(`${APP_URL}#/profile/invite/expired`)
    })
  })
})
