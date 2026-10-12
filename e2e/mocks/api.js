import { NOW, QR_DATA_URL, VALID_TOTP_CODE, establishedState, generatedCodes, user as buildUser } from './data.js'

// Error bodies must carry `status` (and `code`): src/plugins/api.js throws the response body, and callers read
// e.status / e.code from it.
export const errorBody = ({ status = 400, code = 0, message = 'Something went wrong', name = 'Bad Request' } = {}) => ({
  name,
  message,
  code,
  status,
})

const unauthorized = () => errorBody({ status: 401, name: 'Unauthorized', message: 'Not logged in' })

let nextId = 900

/**
 * In-memory fake of the profile API, served at the same origin under /api (see .env.e2e).
 *
 * - `state` holds config, user, recovery methods and verified MFAs; handlers mutate it so multi-step flows see their
 *   own changes (e.g. POST mfa -> PUT mfa/{id}/verify -> GET mfa includes the new TOTP).
 * - `calls` records every request as { method, path, body } for assertions.
 * - `on(method, path, handler)` / `fail(method, path, error)` override a single endpoint.
 */
export class MockApi {
  constructor(state = establishedState()) {
    this.state = state
    this.pending = new Map() // MFAs created but not yet verified
    this.calls = []
    this.overrides = []
  }

  async attach(page) {
    await page.route('**/api/**', (route) => this.handle(route))
  }

  use(state) {
    this.state = state
    return this
  }

  on(method, path, handler) {
    this.overrides.unshift({ method, path, handler })
    return this
  }

  fail(method, path, error = {}) {
    return this.on(method, path, () => ({ status: error.status ?? 400, body: errorBody(error) }))
  }

  callsTo(method, path) {
    return this.calls.filter((c) => c.method === method && matches(path, c.path))
  }

  async handle(route) {
    const request = route.request()
    const method = request.method()
    const path = new URL(request.url()).pathname.replace(/^\/api\/?/, '')
    const body = parseBody(request)

    this.calls.push({ method, path, body })

    const override = this.overrides.find((o) => o.method === method && matches(o.path, path))
    const result = override ? await override.handler({ path, body }) : this.dispatch(method, path, body)

    if (result?.html !== undefined) {
      return route.fulfill({ status: 200, contentType: 'text/html', body: result.html })
    }

    const { status = 200, body: responseBody } = result && 'status' in result ? result : { body: result }

    return route.fulfill({
      status,
      contentType: 'application/json',
      body: responseBody === undefined ? '' : JSON.stringify(responseBody),
    })
  }

  dispatch(method, path, body) {
    for (const [m, pattern, handler] of this.routes()) {
      const match = method === m && path.match(pattern)
      if (match) {
        return handler(body, ...match.slice(1))
      }
    }

    return {
      status: 404,
      body: errorBody({ status: 404, name: 'Not Found', message: `No mock for ${method} ${path}` }),
    }
  }

  routes() {
    const s = this.state
    const findMfa = (id) => s.mfa.find((m) => String(m.id) === id)

    return [
      ['GET', /^config$/, () => s.config],
      ['GET', /^user\/me$/, () => s.user ?? { status: 401, body: unauthorized() }],

      // SSO redirects: answer with a stub page so tests can assert on the URL.
      ['GET', /^auth\/login$/, () => ({ html: '<h1>Mock IdP login</h1>' })],
      ['GET', /^auth\/logout$/, () => ({ html: '<h1>Mock IdP logout</h1>' })],

      ['GET', /^mfa$/, () => s.mfa],
      ['POST', /^mfa$/, ({ type }) => this.createMfa(type)],
      ['PUT', /^mfa\/([^/]+)\/verify$/, ({ value }, id) => this.verifyTotp(id, value)],
      ['PUT', /^mfa\/([^/]+)\/verify\/registration$/, ({ label }, id) => this.registerKey(id, label)],
      [
        'PUT',
        /^mfa\/([^/]+)\/webauthn\/([^/]+)$/,
        ({ label }, id, keyId) => {
          const key = findMfa(id)?.data.find((k) => String(k.id) === keyId)
          return key ? Object.assign(key, { label }) : { status: 404, body: errorBody({ status: 404 }) }
        },
      ],
      [
        'DELETE',
        /^mfa\/([^/]+)\/webauthn\/([^/]+)$/,
        (_, id, keyId) => {
          const mfa = findMfa(id)
          mfa.data = mfa.data.filter((k) => String(k.id) !== keyId)
          if (!mfa.data.length) {
            s.mfa = s.mfa.filter((m) => m !== mfa)
          }
          return { status: 204 }
        },
      ],
      [
        'PUT',
        /^mfa\/([^/]+)$/,
        ({ label }, id) => {
          const mfa = findMfa(id)
          return mfa ? Object.assign(mfa, { label }) : { status: 404, body: errorBody({ status: 404 }) }
        },
      ],
      [
        'DELETE',
        /^mfa\/([^/]+)$/,
        (_, id) => {
          s.mfa = s.mfa.filter((m) => String(m.id) !== id)
          return { status: 204 }
        },
      ],

      ['GET', /^method$/, () => s.methods],
      [
        'POST',
        /^method$/,
        ({ value }) => {
          const method = { id: `alt-${nextId++}`, type: 'email', value, verified: false }
          s.methods.push(method)
          return method
        },
      ],
      [
        'DELETE',
        /^method\/([^/]+)$/,
        (_, id) => {
          s.methods = s.methods.filter((m) => m.id !== id)
          return { status: 204 }
        },
      ],
      ['PUT', /^method\/([^/]+)\/verify$/, () => ({})],
      ['PUT', /^method\/([^/]+)\/resend$/, () => ({ status: 204 })],

      ['PUT', /^password\/assess$/, () => ({})],
      [
        'PUT',
        /^password$/,
        () => {
          s.user.password_meta = { last_changed: NOW, expires: '2027-06-15T12:00:00Z' }
          return {}
        },
      ],

      ['POST', /^reset$/, () => ({})],
      [
        'PUT',
        /^reset\/([^/]+)\/validate$/,
        () => {
          // A valid reset link starts a "reset" session for that user.
          s.user = { ...(s.user ?? buildUser()), auth_type: 'reset' }
          return {}
        },
      ],
    ]
  }

  createMfa(type) {
    const id = nextId++

    if (type === 'totp') {
      const mfa = {
        id,
        type: 'totp',
        label: 'Authenticator app',
        created_utc: NOW,
        last_used_utc: null,
        data: { imageUrl: QR_DATA_URL, totpKey: 'JBSWY3DPEHPK3PXP' },
      }
      this.pending.set(String(id), mfa)
      return mfa
    }

    if (type === 'backupcode') {
      this.state.mfa = this.state.mfa.filter((m) => m.type !== 'backupcode')
      this.state.mfa.push({
        id,
        type: 'backupcode',
        label: 'Printable backup codes',
        created_utc: NOW,
        last_used_utc: null,
        data: { count: generatedCodes.length },
      })
      return { id, type: 'backupcode', data: generatedCodes }
    }

    if (type === 'webauthn') {
      const existing = this.state.mfa.find((m) => m.type === 'webauthn')
      const mfaId = existing?.id ?? id
      return { id: mfaId, type: 'webauthn', data: { publicKey: creationOptions(this.state.user) } }
    }

    return { status: 400, body: errorBody({ message: `Unknown mfa type ${type}` }) }
  }

  verifyTotp(id, value) {
    const mfa = this.pending.get(id)

    if (!mfa || value.replace(' ', '') !== VALID_TOTP_CODE) {
      return { status: 400, body: errorBody({ message: 'Invalid code' }) }
    }

    this.pending.delete(id)
    const verified = { ...mfa, data: [] }
    this.state.mfa.push(verified)
    return verified
  }

  registerKey(id, label) {
    let mfa = this.state.mfa.find((m) => String(m.id) === id)

    if (!mfa) {
      mfa = { id: Number(id), type: 'webauthn', label: '', created_utc: NOW, last_used_utc: null, data: [] }
      this.state.mfa.push(mfa)
    }

    mfa.data.push({ id: nextId++, label, created_utc: NOW, last_used_utc: null })
    return mfa
  }
}

// WebAuthn registration options accepted by @simplewebauthn/browser's startRegistration. The UI base64url-encodes
// `user.id` itself (src/2sv/key/Touch.vue), so it is sent as a plain string like the real API does.
function creationOptions(u) {
  return {
    rp: { name: 'Acme IdP', id: 'localhost' },
    user: { id: u?.idp_username ?? 'user', name: u?.idp_username ?? 'user', displayName: 'Testy Testerson' },
    challenge: 'dGVzdC1jaGFsbGVuZ2UtMTIzNDU2Nzg5MDEyMzQ1Ng',
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },
      { type: 'public-key', alg: -257 },
    ],
    timeout: 60000,
    attestation: 'none',
    authenticatorSelection: { residentKey: 'discouraged', userVerification: 'discouraged' },
  }
}

function matches(pattern, path) {
  return pattern instanceof RegExp ? pattern.test(path) : pattern === path
}

function parseBody(request) {
  try {
    return request.postDataJSON() ?? {}
  } catch {
    return {}
  }
}
