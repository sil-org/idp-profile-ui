import { test, expect, action } from '../fixtures.js'
import { anonymousState } from '../mocks/data.js'

const GOOD_PASSWORD = 'Plume-Harbor-7-Quartz'

test.describe('password reset link', () => {
  test.beforeEach(({ api }) => {
    api.use(anonymousState())
  })

  test('a valid link leads through creating a new password to the reset-complete page', async ({ page, api }) => {
    await page.goto('/#/password/reset/r-42/verify/c0de')

    await expect(page.getByText('Your password reset request is valid')).toBeVisible()
    expect(api.callsTo('PUT', 'reset/r-42/validate')[0].body).toEqual({ code: 'c0de' })

    await action(page, 'Create my new password').click()
    await page.getByLabel('Your new password', { exact: true }).fill(GOOD_PASSWORD)
    await page.getByLabel('Confirm your new password', { exact: true }).fill(GOOD_PASSWORD)
    await action(page, 'Continue').click()

    await expect(page).toHaveURL(/#\/password\/saved$/)
    await action(page, 'Continue').click()

    await expect(page).toHaveURL(/#\/password\/reset\/complete$/)
    await expect(page.getByText('Your password has been changed.')).toBeVisible()
  })

  test('an invalid link offers to try again', async ({ page, api }) => {
    api.fail('PUT', /^reset\/.+\/validate$/, { status: 400, message: 'Invalid code' })

    await page.goto('/#/password/reset/r-42/verify/wrong')

    await expect(page.getByText('Unfortunately something is wrong with that link.')).toBeVisible()
    await action(page, 'Try again').click()
    await expect(page).toHaveURL(/#\/password\/forgot$/)
  })

  test('old bookmarked reset links still work', async ({ page, api }) => {
    await page.goto('/#/reset/r-42/verify/c0de')

    await expect(page).toHaveURL(/#\/password\/reset\/r-42\/verify\/c0de$/)
    await expect(page.getByText('Your password reset request is valid')).toBeVisible()
    expect(api.callsTo('PUT', 'reset/r-42/validate')).toHaveLength(1)
  })
})
