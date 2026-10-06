import { test, expect, action } from '../fixtures.js'
import { VALID_TOTP_CODE, backupCodes, webauthn } from '../mocks/data.js'

test.describe('authenticator app (TOTP)', () => {
  test.beforeEach(({ api }) => {
    api.state.mfa = [webauthn(), backupCodes()]
  })

  test('connects an app by scanning the QR code and verifying a code', async ({ page, api }) => {
    await page.goto('/#/2sv/authenticator/intro')
    await action(page, 'Yes').click()

    await expect(page.getByText('Google Authenticator', { exact: true })).toBeVisible()
    await action(page, 'OK, I installed my authenticator app').click()

    await expect(page.getByRole('img', { name: 'qr code' }).first()).toBeVisible()
    await expect(page.getByText('JBSWY3DPEHPK3PXP')).toBeVisible()
    const [created] = api.callsTo('POST', 'mfa')
    expect(created.body).toEqual({ type: 'totp' })

    await action(page, 'OK, my app is generating codes now').click()
    await expect(page).toHaveURL(/#\/2sv\/authenticator\/verify-qr-code\?id=\d+$/)

    await page.getByLabel('6-digit code').fill(`${VALID_TOTP_CODE.slice(0, 3)} ${VALID_TOTP_CODE.slice(3)}`)
    await action(page, 'Verify').click()

    await expect(page).toHaveURL(/#\/2sv\/authenticator\/code-verified$/)
    await expect(page.getByText('That was the correct code')).toBeVisible()
    expect(api.state.mfa.some((m) => m.type === 'totp')).toBe(true)
  })

  test('shows the time-sync hint when the code is rejected, then accepts a retry', async ({ page }) => {
    await page.goto('/#/2sv/authenticator/scan-qr')
    await action(page, 'OK, my app is generating codes now').click()

    await page.getByLabel('6-digit code').fill('000000')
    await action(page, 'Verify').click()

    await expect(page.getByText('your time may need to be synced')).toBeVisible()
    await expect(page).toHaveURL(/verify-qr-code/)

    await page.getByLabel('6-digit code').fill(VALID_TOTP_CODE)
    await expect(page.getByText('your time may need to be synced')).toHaveCount(0)
    await action(page, 'Verify').click()

    await expect(page).toHaveURL(/#\/2sv\/authenticator\/code-verified$/)
  })

  test('requires a 6-digit code before calling the API', async ({ page, api }) => {
    await page.goto('/#/2sv/authenticator/scan-qr')
    await action(page, 'OK, my app is generating codes now').click()

    await page.getByLabel('6-digit code').fill('12ab')
    await action(page, 'Verify').click()

    await expect(page.getByRole('dialog').getByText('code must be 6 digits')).toBeVisible()
    expect(api.calls.filter((c) => c.path.endsWith('/verify'))).toHaveLength(0)
  })
})
