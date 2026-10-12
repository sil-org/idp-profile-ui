import { test, expect, action, snapshot } from '../fixtures.js'
import { totp, webauthn } from '../mocks/data.js'

test.describe('2SV screenshots', { tag: '@visual' }, () => {
  test.beforeEach(({ api }) => {
    api.state.mfa = []
  })

  test('2SV intro', async ({ page }) => {
    await page.goto('/#/2sv/intro')
    await expect(page.getByText('What is 2-Step Verification?')).toBeVisible()

    await snapshot(page, '2sv-intro')
  })

  test('authenticator QR code', async ({ page }) => {
    await page.goto('/#/2sv/authenticator/scan-qr')
    await expect(page.getByText('JBSWY3DPEHPK3PXP')).toBeVisible()

    await snapshot(page, '2sv-totp-scan-qr')
  })

  test('authenticator code entry', async ({ page }) => {
    await page.goto('/#/2sv/authenticator/scan-qr')
    await action(page, 'OK, my app is generating codes now').click()
    await expect(page.getByLabel('6-digit code')).toBeVisible()

    await snapshot(page, '2sv-totp-verify')
  })

  test('security key naming', async ({ page }) => {
    await page.goto('/#/2sv/usb-security-key/insert')
    await action(page, 'OK, I inserted it').click()
    await expect(page.getByLabel('Please enter a name for your new USB security key.')).toBeVisible()

    await snapshot(page, '2sv-key-insert')
  })

  test('new backup codes', async ({ page, api }) => {
    api.state.mfa = [totp(), webauthn()]

    await page.goto('/#/2sv/printable-backup-codes/new')
    await expect(page.getByText('11111111', { exact: true })).toBeVisible()

    await snapshot(page, '2sv-backup-codes')
  })
})
