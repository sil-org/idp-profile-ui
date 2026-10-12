import { test, expect, action } from '../fixtures.js'
import { alternateEmail, newUserState, primaryEmail } from '../mocks/data.js'

test.describe('profile home', () => {
  test('shows account details and every 2SV method for an established user', async ({ page }) => {
    await page.goto('/#/profile')

    await expect(page).toHaveTitle('My Acme Identity Profile')
    await expect(page.getByText('Testy Testerson')).toBeVisible()
    await expect(page.getByText('Username: testy_testerson')).toBeVisible()
    await expect(page.getByText('Email: testy@example.org')).toBeVisible()
    await expect(page.getByText('Last login: Sunday, June 14th 2026')).toBeVisible()
    await expect(page.getByText('Recovery contact: manager@example.org')).toBeVisible()

    // Password card
    await expect(page.getByText('Saturday, January 10th 2026')).toBeVisible()
    await expect(page.getByText('Sunday, January 10th 2027')).toBeVisible()

    // Recovery, TOTP, security key and backup code cards
    await expect(page.getByText('testy.home@example.com')).toBeVisible()
    await expect(page.getByText('My phone')).toBeVisible()
    await expect(page.getByText('Blue key')).toBeVisible()
    await expect(page.getByText('Remaining: 8')).toBeVisible()

    // A complete profile has no "add ..." suggestions.
    await expect(page.getByText('Add an authenticator app (2SV)')).toBeHidden()
  })

  test('suggests what is missing for a user without recovery or 2SV', async ({ page, api }) => {
    const state = newUserState()
    state.user.password_meta = { last_changed: '2026-01-10T08:00:00Z', expires: '2027-01-10T08:00:00Z' }
    api.use(state)

    await page.goto('/#/profile')

    await expect(page.getByText('No authenticator app at this time, please add one.')).toBeVisible()
    await expect(page.getByText('No security key at this time, please add one.')).toBeVisible()
    await expect(page.getByText('No backup codes at this time, please create some.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Add a recovery method' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Add an authenticator app (2SV)' })).toBeVisible()
  })

  test('warns about an unverified alternate email and can resend verification', async ({ page, api }) => {
    api.state.methods = [primaryEmail(), alternateEmail({ id: 'alt-9', value: 'new@example.com', verified: false })]

    await page.goto('/#/profile')

    await expect(page.getByText('You have unverified email addresses, please log into those accounts')).toBeVisible()
    await action(page, 'resend').click()

    await expect.poll(() => api.callsTo('PUT', 'method/alt-9/resend')).toHaveLength(1)
    await expect(action(page, 'resend')).toBeHidden()
  })

  test('the password card offers an early change when expiry is within 30 days', async ({ page, api }) => {
    api.state.user.password_meta = { last_changed: '2025-06-20T08:00:00Z', expires: '2026-07-01T08:00:00Z' }

    await page.goto('/#/profile')

    await expect(action(page, 'Expiring soon, change now')).toBeVisible()
  })

  test('shows support contacts from the IdP config', async ({ page }) => {
    await page.goto('/#/profile')

    await action(page, 'Help').click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Support contacts')).toBeVisible()
    await expect(dialog.getByText('+1 555 0100')).toBeVisible()
    await expect(dialog.getByText('help@example.org')).toBeVisible()
    await dialog.getByRole('button', { name: 'Ok' }).click()
    await expect(dialog).toBeHidden()
  })

  test('log out goes to the IdP logout endpoint', async ({ page }) => {
    await page.goto('/#/profile')

    await action(page, 'Log out').click()

    await page.waitForURL('**/api/auth/logout?**')
    expect(new URL(page.url()).searchParams.get('ReturnTo')).toBe('http://localhost:4173')
  })
})
