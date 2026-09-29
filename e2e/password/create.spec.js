import { test, expect, action } from '../fixtures.js'

const GOOD_PASSWORD = 'Plume-Harbor-7-Quartz'

const passwordField = (page) => page.getByLabel('Your new password', { exact: true })
const confirmField = (page) => page.getByLabel('Confirm your new password', { exact: true })

test.describe('create password', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/password/create')
    await expect(page.getByText('Create a password for your Acme Identity')).toBeVisible()
  })

  test('enforces the configured password rules as the user types', async ({ page }) => {
    await passwordField(page).fill('short1')
    await expect(page.getByText('Your new password must be at least 10 characters')).toBeVisible()

    await passwordField(page).fill('passwordpassword')
    await expect(page.getByText('Your new password must be stronger')).toBeVisible()

    await passwordField(page).fill('correct-horse-battery-staple')
    await expect(page.getByText('Your new password must include both a letter and a number')).toBeVisible()

    await passwordField(page).fill(GOOD_PASSWORD)
    // Count rather than visibility: an outgoing message lingers briefly during its leave transition.
    await expect(page.getByText(/^Your new password must/)).toHaveCount(0)
  })

  test('shows strength feedback for a common password', async ({ page }) => {
    await passwordField(page).fill('password1')

    await expect(page.getByRole('link', { name: 'learn more' })).toBeVisible()
  })

  test('requires the confirmation to match', async ({ page }) => {
    await passwordField(page).fill(GOOD_PASSWORD)
    await confirmField(page).fill(`${GOOD_PASSWORD}x`)

    await expect(page.getByText('That password does not match your previous one')).toBeVisible()
  })

  test('does not praise a password whose confirmation does not match', async ({ page }) => {
    await passwordField(page).fill(GOOD_PASSWORD)
    await confirmField(page).fill(`${GOOD_PASSWORD}x`)
    await expect(page.getByText('That password does not match your previous one')).toBeVisible()

    await expect(page.getByText('That is beginning to look like a great password')).toBeHidden()
  })

  test('clears the mismatch error when the first password is changed to match', async ({ page }) => {
    await passwordField(page).fill(`${GOOD_PASSWORD}x`)
    await confirmField(page).fill(GOOD_PASSWORD)
    await expect(page.getByText('That password does not match your previous one')).toBeVisible()

    await passwordField(page).fill(GOOD_PASSWORD)

    await expect(page.getByText('That password does not match your previous one')).toHaveCount(0)
    await expect(page.getByText('That is beginning to look like a great password')).toBeVisible()
  })

  test('can continue after correcting a mismatched confirmation', async ({ page, api }) => {
    await passwordField(page).fill(GOOD_PASSWORD)
    await confirmField(page).fill(`${GOOD_PASSWORD}x`)
    await action(page, 'Continue').click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('That password does not match your previous one')).toBeVisible()
    await dialog.getByRole('button', { name: 'Close' }).click()
    await expect(dialog).toBeHidden()

    await confirmField(page).fill(GOOD_PASSWORD)
    await action(page, 'Continue').click()

    await expect(page).toHaveURL(/#\/password\/saved$/)
    expect(api.callsTo('PUT', 'password')).toHaveLength(1)
  })

  test('does not submit an invalid password', async ({ page, api }) => {
    // Fill both so the only failing field is the password (the error dialog shows the last error reported).
    await passwordField(page).fill('short1')
    await confirmField(page).fill('short1')
    await action(page, 'Continue').click()

    await expect(page.getByRole('dialog').getByText('Your new password must be at least 10 characters')).toBeVisible()
    expect(api.callsTo('PUT', 'password')).toHaveLength(0)
  })

  test('saves a good password after the API assesses it', async ({ page, api }) => {
    await passwordField(page).fill(GOOD_PASSWORD)
    await confirmField(page).fill(GOOD_PASSWORD)
    await expect(page.getByText('That is beginning to look like a great password')).toBeVisible()

    await action(page, 'Continue').click()

    await expect(page).toHaveURL(/#\/password\/saved$/)
    expect(api.calls.filter((c) => c.path.startsWith('password')).map((c) => c.path)).toEqual([
      'password/assess',
      'password',
    ])
  })

  test('rejects a compromised password reported by the API', async ({ page, api }) => {
    api.fail('PUT', 'password/assess', { status: 400, code: 1554734183, message: 'Password has been pwned' })

    await passwordField(page).fill(GOOD_PASSWORD)
    await confirmField(page).fill(GOOD_PASSWORD)
    await action(page, 'Continue').click()

    await expect(page.getByText('Unfortunately, it looks like that one is not going to work')).toBeVisible()
    await expect(passwordField(page)).toHaveValue('')
    expect(api.callsTo('PUT', 'password')).toHaveLength(0)

    const pwnedEvents = await page.evaluate(() => window.dataLayer.filter((args) => args[1] === 'pwned').length)
    expect(pwnedEvents).toBe(1)

    // Typing a new attempt clears the rejection so it can be submitted.
    await passwordField(page).fill(`${GOOD_PASSWORD}!`)
    await expect(page.getByText('Unfortunately, it looks like that one is not going to work')).toHaveCount(0)
  })
})
