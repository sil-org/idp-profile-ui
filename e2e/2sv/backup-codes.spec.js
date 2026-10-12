import { test, expect, action } from '../fixtures.js'
import { backupCodes, generatedCodes, totp, webauthn } from '../mocks/data.js'

test.describe('printable backup codes', () => {
  test.beforeEach(({ api }) => {
    api.state.mfa = [totp(), webauthn()]
  })

  test('generates codes, requires keeping a copy, then finishes the wizard', async ({ page, api }) => {
    await page.goto('/#/2sv/printable-backup-codes/intro')
    await expect(page.getByText('There may be times when you do not have your authenticator app')).toBeVisible()

    await action(page, 'Create new codes').click()

    for (const code of generatedCodes) {
      await expect(page.getByText(code, { exact: true })).toBeVisible()
    }
    expect(api.callsTo('POST', 'mfa')[0].body).toEqual({ type: 'backupcode' })

    const finish = action(page, 'Finish')
    await expect(finish).toBeDisabled()

    const downloadPromise = page.waitForEvent('download')
    await action(page, 'Download', { exact: false }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('Acme--printable-codes.txt')

    await expect(finish).toBeEnabled()
    await finish.click()

    await expect(page).toHaveURL(/#\/profile\/complete$/)
    await expect(page.getByText("That's it!")).toBeVisible()
  })

  test('replacing codes from the profile goes straight to new codes', async ({ page, api }) => {
    api.state.mfa.push(backupCodes())
    await page.goto('/#/profile')

    await action(page, 'Replace').click()

    await expect(page).toHaveURL(/#\/2sv\/printable-backup-codes\/new$/)
  })
})
