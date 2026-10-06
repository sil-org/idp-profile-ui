import { test, expect, action } from '../fixtures.js'

const renameButtons = (page) => page.getByRole('button', { name: 'Rename' })

// The card holding `text`: the innermost element that contains both that text and a Remove button.
const cardFor = (page, text) =>
  page
    .locator('div')
    .filter({ has: page.getByText(text, { exact: true }) })
    .filter({ has: page.getByRole('button', { name: 'Remove' }) })
    .last()

test.describe('2SV card labels and removal', () => {
  test('renames the authenticator app', async ({ page, api }) => {
    await page.goto('/#/profile')

    await renameButtons(page).first().click()
    const input = page.getByRole('textbox')
    await expect(input).toHaveValue('My phone')
    await input.fill('Work phone')
    await input.press('Enter')

    await expect(page.getByText('Work phone', { exact: true })).toBeVisible()
    expect(api.callsTo('PUT', 'mfa/101')[0].body).toEqual({ label: 'Work phone' })
  })

  test('renames a security key', async ({ page, api }) => {
    await page.goto('/#/profile')

    await renameButtons(page).nth(1).click()
    const input = page.getByRole('textbox')
    await expect(input).toHaveValue('Blue key')
    await input.fill('Keychain key')
    await input.press('Enter')

    await expect(page.getByText('Keychain key', { exact: true })).toBeVisible()
    expect(api.callsTo('PUT', 'mfa/102/webauthn/201')[0].body).toEqual({ label: 'Keychain key' })
  })

  test('rejects a label longer than 64 characters', async ({ page, api }) => {
    await page.goto('/#/profile')

    await renameButtons(page).first().click()
    const input = page.getByRole('textbox')
    await input.fill('x'.repeat(65))

    await expect(page.getByText('The label should contain at most 64 characters')).toBeVisible()
    await input.press('Enter')

    await expect(page.getByRole('dialog').getByText('The label should contain at most 64 characters')).toBeVisible()
    expect(api.callsTo('PUT', 'mfa/101')).toHaveLength(0)
  })

  test('removes a security key after confirmation', async ({ page, api }) => {
    await page.goto('/#/profile')

    let confirmation = ''
    page.once('dialog', (dialog) => {
      confirmation = dialog.message()
      return dialog.accept()
    })
    await cardFor(page, 'Blue key').getByRole('button', { name: 'Remove' }).click()

    await expect.poll(() => api.callsTo('DELETE', 'mfa/102/webauthn/201')).toHaveLength(1)
    expect(confirmation).toBe('Are you sure?')
    await expect(page.getByText('No security key at this time, please add one.')).toBeVisible()
  })

  test('keeps the method when removal is cancelled', async ({ page, api }) => {
    await page.goto('/#/profile')

    page.once('dialog', (dialog) => dialog.dismiss())
    await cardFor(page, 'My phone').getByRole('button', { name: 'Remove' }).click()

    await expect(page.getByText('My phone', { exact: true })).toBeVisible()
    expect(api.callsTo('DELETE', 'mfa/101')).toHaveLength(0)
  })
})
