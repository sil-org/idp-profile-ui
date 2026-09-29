import { test, expect, snapshot } from '../fixtures.js'
import { anonymousState, newUserState } from '../mocks/data.js'

test.describe('password screenshots', { tag: '@visual' }, () => {
  test('create password with strength feedback', async ({ page, api }) => {
    api.use(newUserState())

    await page.goto('/#/password/create')
    await page.getByLabel('Your new password', { exact: true }).fill('password1')
    await expect(page.getByText('Your new password must be at least 10 characters')).toBeVisible()

    await snapshot(page, 'password-create')
  })

  test('recovery methods', async ({ page, api }) => {
    api.use(newUserState())

    await page.goto('/#/password/recovery')
    await expect(page.getByText('None at this time')).toBeVisible()

    await snapshot(page, 'password-recovery')
  })

  test('forgot password', async ({ page, api }) => {
    api.use(anonymousState())

    await page.goto('/#/password/forgot?username=testy_testerson')
    await expect(page.getByLabel('Enter your Acme username or email')).toHaveValue('testy_testerson')

    await snapshot(page, 'password-forgot')
  })

  test('reset link verified', async ({ page, api }) => {
    api.use(anonymousState())

    await page.goto('/#/password/reset/r-42/verify/c0de')
    await expect(page.getByText('Your password reset request is valid')).toBeVisible()

    await snapshot(page, 'password-reset-verified')
  })
})
