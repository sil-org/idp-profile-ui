import { test, expect, action } from './fixtures.js'
import { anonymousState } from './mocks/data.js'

test.describe('authentication', () => {
  test.beforeEach(({ api }) => {
    api.use(anonymousState())
  })

  test('a protected page redirects to login and returns to that page', async ({ page }) => {
    await page.goto('/#/profile')

    await page.waitForURL('**/api/auth/login?**')
    const params = new URL(page.url()).searchParams
    expect(params.get('ReturnTo')).toBe('http://localhost:4173/#/profile')
    expect(params.has('invite')).toBe(false)
  })

  test('an invite link passes the invite code and an expired-invite return URL', async ({ page }) => {
    await page.goto('/#/profile/intro?invite=abc-123')

    await page.waitForURL('**/api/auth/login?**')
    const params = new URL(page.url()).searchParams
    expect(params.get('ReturnTo')).toBe('http://localhost:4173/#/profile/intro')
    expect(params.get('invite')).toBe('abc-123')
    expect(params.get('ReturnToOnError')).toBe('http://localhost:4173/#/profile/invite/expired')
  })

  test('public pages do not require login', async ({ page, api }) => {
    await page.goto('/#/password/forgot')

    await expect(page).toHaveTitle('Forgot my password Profile')
    await expect(action(page, 'Log in')).toBeVisible()
    expect(api.callsTo('GET', 'user/me')).toHaveLength(0)
  })
})
