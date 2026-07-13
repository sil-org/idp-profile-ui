import { reactive } from 'vue'
import api from '@/plugins/api'

export const mfa = reactive({
  totp: {},
  u2f: {},
  keys: {},
  backup: {},
  numVerified: 0,
})

export const newKeyName = {
  _value: '',
  get() {
    return this._value
  },
  set(value) {
    this._value = value
  },
}

export const add = async (type) => api.post('mfa', { type })

export const verify = async (id, verification = '') => {
  const verifiedMfa = await api.put(`mfa/${id}/verify`, {
    value: verification,
  })

  mfa[verifiedMfa.type] = { ...verifiedMfa }
}

export const retrieve = async () => {
  const all = await api.get('mfa')

  mfa.totp = { ...(all.find((m) => m.type === 'totp') || {}) }
  mfa.u2f = { ...(all.find((m) => m.type === 'u2f') || {}) }
  mfa.keys = { ...(all.find((m) => m.type === 'webauthn') || {}) }
  mfa.backup = { ...(all.find((m) => m.type === 'backupcode') || {}) }

  mfa.numVerified = numOfVerifiedMfas() // currently, the api only returns verified mfas
}

function numOfVerifiedMfas() {
  let num = 0

  num += mfa.totp.id ? 1 : 0
  num += (mfa.u2f.id ? 1 : 0) + (mfa.keys.data?.length || 0)
  num += mfa.backup.id ? 1 : 0

  return num
}

export const remove = async (id) => {
  await api.delete(`mfa/${id}`)

  const type = Object.keys(mfa).find((key) => mfa[key].id === id)
  mfa[type] = {}
}

export const change = async (id, updates) => {
  return api.put(`mfa/${id}`, updates)
}

export const find = (id) => {
  const type = Object.keys(mfa).find((key) => mfa[key].id == id)
  return mfa[type]
}

export const verifyWebauthn = async (id, verification = '', label = '') => {
  const verifiedMfa = await api.put(`mfa/${id}/verify/registration`, {
    value: verification,
    label,
  })
  mfa.keys = verifiedMfa
}

export const removeWebauthn = async (mfaId, webauthnId) => {
  await api.delete(`mfa/${mfaId}/webauthn/${webauthnId}`)
  const index = mfa.keys.data.findIndex((m) => m.id === webauthnId)
  if (index > -1) {
    mfa.keys.data.splice(index, 1)
  }
}

export const changeWebauthn = async (mfaId, webauthnId, updates) => {
  return api.put(`mfa/${mfaId}/webauthn/${webauthnId}`, updates)
}

export default mfa
