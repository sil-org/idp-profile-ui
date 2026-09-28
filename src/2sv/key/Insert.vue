<template>
  <ProfileWizard>
    <BasePage>
      <template v-if="isSupported" #header>
        {{ $t('2sv.key.insert.header') }}
      </template>
      <template v-else #header>
        {{ $t('2sv.key.insert.nosupport.header') }}
      </template>

      <figure v-if="isSupported" class="pa-4">
        <v-img cover :src="usbKey" alt="A usb key inserted into a usb port." />
      </figure>
      <p v-else>{{ $t('2sv.key.insert.nosupport.info') }}</p>

      <!-- TODO: Add translations for this label -->
      <label v-if="showLabelInput">
        {{ $t('2sv.key.insert.label') }}
        <v-text-field
          v-model="input"
          required
          variant="outlined"
          autofocus
          :rules="[(v) => v.length < 65 || $t('global.mfaLabelTooLong')]"
          @keyup="onKeyup"
        />
      </label>
    </BasePage>

    <ButtonBar>
      <v-btn to="/2sv/usb-security-key/intro" tabindex="-1" variant="outlined">
        {{ $t('global.button.back') }}
      </v-btn>

      <v-spacer></v-spacer>

      <v-btn v-if="isSupported && showLabelInput" color="primary" variant="outlined" @click="onContinue">
        {{ $t('global.button.continue') }}
      </v-btn>

      <v-btn v-else-if="isSupported && !showLabelInput" color="primary" variant="outlined" @click="onOk">
        {{ $t('2sv.key.insert.button.ok') }}
      </v-btn>
      <v-btn v-else to="/2sv/printable-backup-codes/intro" color="primary" variant="outlined">
        {{ $t('global.button.skip') }}
      </v-btn>
    </ButtonBar>

    <v-snackbar v-model="snackbarIsOpen">
      {{ snackBarMessage }}

      <template #actions="{ attrs }">
        <v-btn v-bind="attrs" color="warning" variant="text" @click="snackbarIsOpen = false">
          {{ $t('global.button.close') }}
        </v-btn>
      </template>
    </v-snackbar>
  </ProfileWizard>
</template>

<script>
import ProfileWizard from '@/profile/ProfileWizard.vue'
import { browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { newKeyName, mfa } from '@/global/mfa'
import usbKey from '@/assets/insert-usb-security-key.png'

export default {
  name: 'InsertKey',
  components: {
    ProfileWizard,
  },
  data: () => ({
    isSupported: browserSupportsWebAuthn(),
    showLabelInput: false,
    input: '',
    newKeyName,
    snackbarIsOpen: false,
    snackBarMessage: '',
    usbKey: usbKey,
  }),
  methods: {
    onOk: function () {
      this.showLabelInput = true
    },
    isDuplicateKeyLabel: function (keys, attemptedKeyLabel) {
      return keys.data?.find((key) => key.label == attemptedKeyLabel)
    },
    onKeyup: function (event) {
      if (event.key == 'Enter') {
        this.onContinue()
      }
    },
    onContinue: function () {
      const attemptedKeyLabel = this.input.trim()
      if (!attemptedKeyLabel) {
        this.snackBarMessage = this.$t('2sv.key.insert.label')
        this.snackbarIsOpen = true
        return
      } else if (attemptedKeyLabel.length > 64) {
        this.snackBarMessage = this.$t('global.mfaLabelTooLong')
        this.snackbarIsOpen = true
        return
      } else if (this.isDuplicateKeyLabel(mfa.keys, attemptedKeyLabel)) {
        this.snackbarIsOpen = true
        this.snackBarMessage = this.$t('2sv.key.insert.duplicate')
        this.input = ''
        return
      }
      this.newKeyName.set(this.input)
      this.$router.push('/2sv/usb-security-key/touch')
    },
  },
}
</script>
