import { test, expect, action } from '../fixtures.js'
import { backupCodes, totp } from '../mocks/data.js'

const labelField = (page) => page.getByLabel('Please enter a name for your new USB security key.')

// A software authenticator in Chromium that answers navigator.credentials.create() without a physical key.
async function addVirtualAuthenticator(page) {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('WebAuthn.enable')
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'usb',
      hasResidentKey: false,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  })
}

test.describe('USB security key (WebAuthn)', () => {
  test.beforeEach(({ api }) => {
    api.state.mfa = [totp(), backupCodes()]
  })

  test('registers a key with the name the user chose', async ({ page, api }) => {
    await addVirtualAuthenticator(page)
    await page.goto('/#/2sv/usb-security-key/intro')

    await action(page, 'Yes').click()
    await expect(page.getByText('Insert your USB security key')).toBeVisible()
    await action(page, 'OK, I inserted it').click()

    await labelField(page).fill('Work key')
    await action(page, 'Continue').click()

    await expect(page).toHaveURL(/#\/2sv\/usb-security-key\/confirmed$/)
    await expect(page.getByText('Your USB security key is now confirmed')).toBeVisible()

    const [registration] = api.calls.filter((c) => c.path.endsWith('/verify/registration'))
    expect(registration.body.label).toBe('Work key')
    expect(registration.body.value).toMatchObject({
      type: 'public-key',
      response: { attestationObject: expect.any(String), clientDataJSON: expect.any(String) },
    })
  })

  test('refuses a name already used by another key', async ({ page, api }) => {
    api.state.mfa.push({
      id: 102,
      type: 'webauthn',
      label: '',
      created_utc: null,
      last_used_utc: null,
      data: [{ id: 201, label: 'Blue key', created_utc: '2026-03-05T16:20:00Z', last_used_utc: null }],
    })

    await page.goto('/#/2sv/usb-security-key/insert')
    await action(page, 'OK, I inserted it').click()
    await labelField(page).fill('Blue key')
    await action(page, 'Continue').click()

    await expect(page.getByText('You already have a USB security key with that name.')).toBeVisible()
    await expect(page).toHaveURL(/#\/2sv\/usb-security-key\/insert$/)
  })

  test('requires a name', async ({ page }) => {
    await page.goto('/#/2sv/usb-security-key/insert')
    await action(page, 'OK, I inserted it').click()
    await action(page, 'Continue').click()

    // The prompt is repeated in a snackbar.
    await expect(page.getByText('Please enter a name for your new USB security key.')).toHaveCount(2)
    await expect(page).toHaveURL(/#\/2sv\/usb-security-key\/insert$/)
  })

  test('offers retry and skip when the key does not respond', async ({ page, api }) => {
    api.fail('PUT', /\/verify\/registration$/, { status: 400, message: 'Registration failed' })
    await addVirtualAuthenticator(page)

    await page.goto('/#/2sv/usb-security-key/insert')
    await action(page, 'OK, I inserted it').click()
    await labelField(page).fill('Work key')
    await action(page, 'Continue').click()

    await expect(page.getByText('Something went wrong.')).toBeVisible()
    await expect(action(page, 'Retry')).toBeVisible()
    await expect(action(page, 'Skip')).toBeVisible()
  })
})
