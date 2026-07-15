import { recoveryMethods, retrieve as retrieveMethods } from '@/global/recoveryMethods'
import { mfa, retrieve as retrieveMfa } from '@/global/mfa'
import user from '@/plugins/user'

const store = {
  steps: [],
}

export default {
  steps: store.steps,
  async init() {
    if (user.auth_type === 'login') {
      await Promise.all([retrieveMethods(), retrieveMfa()])
    }

    // Retain all steps but mark relevant ones
    allSteps.forEach((step, index) => {
      const isRelevant = step.isRelevant(user, recoveryMethods.alternates, mfa)
      const isNotDuplicate = !store.steps.some((s) => s.nameKey === step.nameKey)
      if (isNotDuplicate) {
        store.steps.push({
          ...step,
          id: index + 1,
          state: '',
          skip: !isRelevant,
        })
      }
    })
  },
  forPath(path) {
    return this.steps.find((step) => step.paths.includes(path))
  },
  isLast(step) {
    return this.steps[this.steps.length - 1].id === step.id
  },
  next(step) {
    // since the id is +1 of the position, we can simply use the id of the passed step to get the next array position
    return this.steps[step.id]
  },
  clear() {
    store.steps.splice(0)
  },
}

const isRequested = (paths) => paths.some((path) => location.hash.includes(path))

const password = {
  nameKey: 'profile.steps.pwStep',
  paths: ['/password/create', '/password/confirm', '/password/saved'],
  isRelevant(user) {
    return isRequested(this.paths) || user.isNew()
  },
}

const recovery = {
  nameKey: 'profile.steps.pwRecoverStep',
  paths: ['/password/recovery'],
  isRelevant(user, recoveryMethods) {
    return user.auth_type === 'login' && (isRequested(this.paths) || recoveryMethods.filter(isAlternate).length < 1)
  },
}

const isAlternate = (method) => method.type === 'email'

const totp = {
  nameKey: 'profile.steps.authenticator',
  paths: [
    '/2sv/intro',
    '/2sv/authenticator/intro',
    '/2sv/authenticator/download-app',
    '/2sv/authenticator/scan-qr',
    '/2sv/authenticator/verify-qr-code',
    '/2sv/authenticator/code-verified',
  ],
  isRelevant(user, recoveryMethods, mfa) {
    return user.auth_type === 'login' && (isRequested(this.paths) || (!mfa.totp?.id && mfa.numVerified < 3))
  },
}

const securityKeyStep = {
  nameKey: 'profile.steps.securityKeyStep',
  paths: [
    '/2sv/usb-security-key/intro',
    '/2sv/usb-security-key/insert',
    '/2sv/usb-security-key/touch',
    '/2sv/usb-security-key/confirmed',
  ],
  isRelevant(user, recoveryMethods, mfa) {
    const numberOfKeys = (mfa.keys.data?.length || 0) + (mfa.u2f?.id ? 1 : 0)

    return user.auth_type === 'login' && (isRequested(this.paths) || numberOfKeys === 0 || mfa.numVerified < 3)
  },
}

const backupCodesStep = {
  nameKey: 'profile.steps.backupCodes',
  paths: ['/2sv/printable-backup-codes/intro', '/2sv/printable-backup-codes/new'],
  isRelevant(user, recoveryMethods, mfa) {
    return user.auth_type === 'login' && (isRequested(this.paths) || mfa.numVerified < 3)
  },
}

const complete = {
  nameKey: 'profile.steps.completeStep',
  paths: ['/profile/complete', '/password/reset/complete'],
  isRelevant() {
    return true
  },
}

const allSteps = [password, recovery, totp, securityKeyStep, backupCodesStep, complete]
