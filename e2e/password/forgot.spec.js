import { test, expect, action } from '../fixtures.js'
import { anonymousState } from '../mocks/data.js'

test.describe('forgot password', () => {
  test.beforeEach(({ api }) => {
    api.use(anonymousState())
  })

  test('sends a reset link using the reCAPTCHA token', async ({ page, api }) => {
    await page.goto('/#/password/forgot')

    const send = action(page, 'Send me a link')
    await expect(send).toBeDisabled()

    await page.getByLabel('Enter your Acme username or email').fill('testy_testerson')
    await expect(send).toBeEnabled()
    await page.waitForFunction(() => window.grecaptcha) // the stubbed reCAPTCHA script has bound the button
    await send.click()

    await expect(page).toHaveURL(/#\/password\/forgot\/sent$/)
    await expect(page.getByText('Request received')).toBeVisible()
    expect(api.callsTo('POST', 'reset')[0].body).toEqual({
      username: 'testy_testerson',
      verification_token: 'test-token',
    })
  })

  test('pre-fills the username from the query string', async ({ page }) => {
    await page.goto('/#/password/forgot?username=%20testy_testerson%20')

    await expect(page.getByLabel('Enter your Acme username or email')).toHaveValue('testy_testerson')
  })

  test('shows the API error and stays on the page when the request fails', async ({ page, api }) => {
    api.fail('POST', 'reset', { status: 429, message: 'Too many requests, please wait' })

    await page.goto('/#/password/forgot?username=testy_testerson')
    await page.waitForFunction(() => window.grecaptcha)
    await action(page, 'Send me a link').click()

    await expect(page.getByRole('dialog').getByText('Too many requests, please wait')).toBeVisible()
    await expect(page).toHaveURL(/#\/password\/forgot\?/)
  })
})
