import { test, expect, snapshot } from '../fixtures.js'
import { newUserState } from '../mocks/data.js'

test.describe('profile screenshots', { tag: '@visual' }, () => {
  test('profile home', async ({ page }) => {
    await page.goto('/#/profile')
    await expect(page.getByText('Remaining: 8')).toBeVisible()

    await snapshot(page, 'profile-home')
  })

  test('profile home with nothing set up', async ({ page, api }) => {
    const state = newUserState()
    state.user.password_meta = { last_changed: '2026-01-10T08:00:00Z', expires: '2026-07-01T08:00:00Z' }
    api.use(state)

    await page.goto('/#/profile')
    await expect(page.getByText('No backup codes at this time, please create some.')).toBeVisible()

    await snapshot(page, 'profile-home-empty')
  })

  test('welcome', async ({ page, api }) => {
    api.use(newUserState())

    await page.goto('/#/profile/intro')
    await expect(page.getByText('Welcome to your Acme identity profile Testy!')).toBeVisible()

    await snapshot(page, 'profile-intro')
  })

  test('wizard complete', async ({ page }) => {
    await page.goto('/#/profile/complete')
    await expect(page.getByText("That's it!")).toBeVisible()

    await snapshot(page, 'profile-complete')
  })

  test('page not found', async ({ page }) => {
    await page.goto('/#/no-such-page')
    await expect(page.getByText('Not found')).toBeVisible()

    await snapshot(page, 'not-found')
  })
})
