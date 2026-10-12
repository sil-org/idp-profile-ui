import { test, expect, action } from '../fixtures.js'
import { newUserState } from '../mocks/data.js'

const GOOD_PASSWORD = 'Plume-Harbor-7-Quartz'

test.describe('profile wizard', () => {
  test('a new user is guided through password and recovery setup', async ({ page, api }) => {
    api.use(newUserState())

    await page.goto('/#/profile/intro')
    await expect(page.getByText('Welcome to your Acme identity profile Testy!')).toBeVisible()
    await expect(page.getByText('testy_testerson')).toBeVisible()

    await action(page, 'Begin').click()
    await expect(page).toHaveURL(/#\/password\/create$/)

    for (const step of ['Password', 'Password recovery', 'Authenticator app', 'Security key', 'Backup codes']) {
      await expect(page.getByText(step, { exact: true }).first()).toBeVisible()
    }
    await expect(action(page, 'Back')).toBeVisible() // new users go back to the intro rather than skipping

    await page.getByLabel('Your new password', { exact: true }).fill(GOOD_PASSWORD)
    await page.getByLabel('Confirm your new password', { exact: true }).fill(GOOD_PASSWORD)
    await action(page, 'Continue').click()

    await expect(page).toHaveURL(/#\/password\/saved$/)
    await expect(page.getByText('Your new password has been saved.')).toBeVisible()
    expect(api.callsTo('PUT', 'password')[0].body).toEqual({ password: GOOD_PASSWORD })

    await action(page, 'Continue').click()

    await expect(page).toHaveURL(/#\/password\/recovery$/)
    await expect(page.getByText('What if you forget your password?')).toBeVisible()
    await expect(page.getByText('we will send an email to testy@example.org')).toBeVisible()
  })

  test('skipping every 2SV step ends on the complete page with warnings', async ({ page, api }) => {
    api.use(newUserState())

    await page.goto('/#/2sv/intro')
    await action(page, 'Continue').click()

    await expect(page.getByText('Do you have an authenticator app?')).toBeVisible()
    await action(page, 'Skip').click()

    await expect(page.getByText('Do you have a USB security key?')).toBeVisible()
    await action(page, 'Skip').click()

    await expect(page.getByText('Printable backup codes', { exact: true }).first()).toBeVisible()
    await action(page, 'Skip').click()

    await expect(page).toHaveURL(/#\/profile\/complete$/)
    await expect(page.getByText("That's it!")).toBeVisible()
    await expect(page.getByText('You do not have any 2-Step Verification options established.')).toBeVisible()
    await expect(page.getByText('You do not have any alternate means of recovering your password')).toBeVisible()

    await action(page, 'See my profile').click()
    await expect(page).toHaveURL(/#\/profile$/)
  })
})
