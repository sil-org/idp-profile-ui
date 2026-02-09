<template>
  <ProfileWizard>
    <v-alert :model-value="error" type="error" icon="mdi-alert">
      <span class="d-flex align-center justify-center">
        {{ $t('2sv.key.touch.error') }}
      </span>
    </v-alert>

    <BasePage>
      <template #header>
        {{ $t('2sv.key.touch.header') }}
      </template>

      <p>
        {{ $t('2sv.key.touch.info') }}
      </p>

      <figure class="pa-4 d-flex flex-column">
        <v-img v-if="!touched" contained :src="usbKey" alt="A finger touching the top of a usb key." />
        <v-icon v-else color="success" size="x-large">mdi-check</v-icon>
      </figure>
    </BasePage>

    <ButtonBar>
      <v-btn to="/2sv/usb-security-key/insert" tabindex="-1" variant="outlined">
        {{ $t('global.button.back') }}
      </v-btn>

      <v-spacer></v-spacer>

      <v-btn v-if="isSupported && error" color="error" variant="outlined" @click=";((error = false), create())">
        {{ $t('2sv.key.touch.button.retry') }}
      </v-btn>

      <v-btn v-if="error" to="/2sv/printable-backup-codes/intro" color="warning" variant="outlined" class="ml-4">
        {{ $t('global.button.skip') }}
      </v-btn>
    </ButtonBar>
  </ProfileWizard>
</template>

<script>
import ProfileWizard from '@/profile/ProfileWizard.vue'
import { browserSupportsWebAuthn, startRegistration } from '@simplewebauthn/browser'
import { add, verifyWebauthn, newKeyName } from '@/global/mfa'
import usbKey from '@/assets/touch-usb-security-key.png'

let absTimeout

export default {
  name: 'TouchKey',
  components: {
    ProfileWizard,
  },
  data: () => ({
    newSecurityKey: {},
    touched: false,
    error: false,
    isSupported: browserSupportsWebAuthn(),
    usbKey,
  }),
  async created() {
    this.create()
  },
  methods: {
    handleKeyResponse: async function (response) {
      if (isValid(response)) {
        clearTimeout(absTimeout)

        await verifyWebauthn(this.newSecurityKey.id, response, newKeyName.get())

        this.touched = true

        // pause for a moment so user can see the checkmark.
        setTimeout(() => this.$router.push('/2sv/usb-security-key/confirmed'), 500)
      } else {
        this.error = true
      }
    },
    async create() {
      if (!this.isSupported) {
        this.error = true
        return
      }

      try {
        this.newSecurityKey = await add('webauthn')
        let registrationCredential
        registrationCredential = await startRegistration({
          excludeCredentials: [],
          ...this.newSecurityKey.data.publicKey,
        })
        await this.handleKeyResponse(registrationCredential)
      } catch (error) {
        this.error = true
        console.error(error)
      }
    },
  },
}

function isValid(securityKeyResponse) {
  return securityKeyResponse.publicKey !== ''
}
</script>
