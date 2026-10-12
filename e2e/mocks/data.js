// Builders for fake API data. Shapes mirror what the UI reads (see src/plugins/user.js, src/global/mfa.js,
// src/global/recoveryMethods.js); the real API is sil-org/idp-pw-api.

// The browser clock starts at this instant (see e2e/fixtures.js) so dates and "expiring soon" logic are stable.
export const NOW = '2026-06-15T12:00:00Z'

export const VALID_TOTP_CODE = '123456'

export const config = (overrides = {}) => ({
  idpName: 'Acme',
  passwordRules: {
    minLength: 10,
    maxLength: 255,
    minScore: 3,
    requireAlphaAndNumeric: true,
  },
  support: {
    phone: '+1 555 0100',
    email: 'help@example.org',
    url: 'https://help.example.org',
  },
  ...overrides,
})

export const user = (overrides = {}) => ({
  idp_username: 'testy_testerson',
  first_name: 'Testy',
  last_name: 'Testerson',
  email: 'testy@example.org',
  manager_email: 'manager@example.org',
  last_login: '2026-06-14T09:30:00Z',
  auth_type: 'login',
  password_meta: {
    last_changed: '2026-01-10T08:00:00Z',
    expires: '2027-01-10T08:00:00Z',
  },
  ...overrides,
})

export const newUser = (overrides = {}) =>
  user({
    last_login: null,
    password_meta: { last_changed: null, expires: null },
    ...overrides,
  })

export const primaryEmail = (overrides = {}) => ({
  id: 'primary',
  type: 'primary',
  value: 'testy@example.org',
  verified: true,
  ...overrides,
})

export const alternateEmail = (overrides = {}) => ({
  id: 'alt-1',
  type: 'email',
  value: 'testy.home@example.com',
  verified: true,
  ...overrides,
})

export const totp = (overrides = {}) => ({
  id: 101,
  type: 'totp',
  label: 'My phone',
  created_utc: '2026-02-01T10:00:00Z',
  last_used_utc: '2026-06-10T07:45:00Z',
  data: [],
  ...overrides,
})

export const securityKey = (overrides = {}) => ({
  id: 201,
  label: 'Blue key',
  created_utc: '2026-03-05T16:20:00Z',
  last_used_utc: '2026-06-10T07:45:00Z',
  ...overrides,
})

export const webauthn = (keys = [securityKey()], overrides = {}) => ({
  id: 102,
  type: 'webauthn',
  label: '',
  created_utc: '2026-03-05T16:20:00Z',
  last_used_utc: '2026-06-10T07:45:00Z',
  data: keys,
  ...overrides,
})

export const backupCodes = (count = 8, overrides = {}) => ({
  id: 103,
  type: 'backupcode',
  label: 'Printable backup codes',
  created_utc: '2026-02-01T10:05:00Z',
  last_used_utc: null,
  data: { count },
  ...overrides,
})

export const generatedCodes = ['11111111', '22222222', '33333333', '44444444', '55555555', '66666666']

// A 1x1 transparent PNG stands in for the TOTP QR code.
export const QR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

// A user with a password, a verified alternate email and every 2SV type.
export const establishedState = () => ({
  config: config(),
  user: user(),
  methods: [primaryEmail(), alternateEmail()],
  mfa: [totp(), webauthn(), backupCodes()],
})

// A user who was just invited: no password, no alternates, no 2SV.
export const newUserState = () => ({
  config: config(),
  user: newUser(),
  methods: [primaryEmail()],
  mfa: [],
})

// Not logged in (GET /user/me answers 401).
export const anonymousState = () => ({
  config: config(),
  user: null,
  methods: [],
  mfa: [],
})
