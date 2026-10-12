import { test, expect, action } from '../fixtures.js'
import { anonymousState, newUserState } from '../mocks/data.js'

const emailField = (page) => page.getByLabel('Enter an alternate email address')

test.describe('password recovery methods', () => {
  test.beforeEach(({ api }) => {
    api.use(newUserState())
  })

  test('validates and adds an alternate email, then continues', async ({ page, api }) => {
    await page.goto('/#/password/recovery')
    await expect(page.getByText('None at this time')).toBeVisible()
    await expect(action(page, 'Continue')).toBeDisabled()

    await emailField(page).fill('not-an-email')
    await expect(page.getByText('Invalid email')).toBeVisible()

    await emailField(page).fill('Testy+backup@Example.org')
    await expect(page.getByText("You can't use your primary email address or alias as an alternate")).toBeVisible()

    await emailField(page).fill('testy.home@example.com')
    await emailField(page).press('Enter')

    await expect(page.getByText('testy.home@example.com')).toBeVisible()
    await expect(emailField(page)).toHaveValue('')
    expect(api.callsTo('POST', 'method')[0].body).toEqual({ value: 'testy.home@example.com' })

    await action(page, 'Continue').click()
    await expect(page).toHaveURL(/#\/2sv\/intro$/)
  })

  test('adds with the button and removes an alternate while keeping at least one', async ({ page, api }) => {
    await page.goto('/#/password/recovery')

    await emailField(page).fill('first@example.com')
    await page.getByRole('button', { name: 'Add' }).click()
    await expect(page.getByText('first@example.com')).toBeVisible()

    // The only alternate cannot be removed.
    await expect(page.getByRole('button', { name: 'Remove' })).toBeDisabled()

    await emailField(page).fill('second@example.com')
    await page.getByRole('button', { name: 'Add' }).click()
    await expect(page.getByText('second@example.com')).toBeVisible()

    await page.getByRole('button', { name: 'Remove' }).first().click()

    await expect(page.getByText('first@example.com')).toBeHidden()
    const [removed] = api.calls.filter((c) => c.method === 'DELETE' && c.path.startsWith('method/'))
    expect(api.state.methods.map((m) => m.value)).not.toContain('first@example.com')
    expect(removed).toBeDefined()
  })

  test('can skip adding an alternate', async ({ page }) => {
    await page.goto('/#/password/recovery')

    await action(page, 'Skip').click()

    await expect(page).toHaveURL(/#\/2sv\/intro$/)
  })
})

test.describe('recovery email verification link', () => {
  test.beforeEach(({ api }) => {
    api.use(anonymousState())
  })

  test('confirms a valid code', async ({ page, api }) => {
    await page.goto('/#/password/recovery/alt-1/verify/abc123')

    await expect(page.getByText('You have successfully added that recovery method')).toBeVisible()
    await expect(action(page, 'Login and see my updated profile')).toBeVisible()
    expect(api.callsTo('PUT', 'method/alt-1/verify')[0].body).toEqual({ code: 'abc123' })
  })

  test('explains an expired code', async ({ page, api }) => {
    api.fail('PUT', 'method/alt-1/verify', { status: 410, name: 'Gone', message: 'Expired' })

    await page.goto('/#/password/recovery/alt-1/verify/abc123')

    await expect(page.getByText('that verification code has already expired')).toBeVisible()
  })

  test('offers to try again for an invalid code', async ({ page, api }) => {
    api.fail('PUT', 'method/alt-1/verify', { status: 400, message: 'Invalid' })

    await page.goto('/#/password/recovery/alt-1/verify/abc123')

    await expect(page.getByText('Unfortunately something is wrong with that link.')).toBeVisible()
    await expect(action(page, 'Try again')).toBeVisible()
  })
})
