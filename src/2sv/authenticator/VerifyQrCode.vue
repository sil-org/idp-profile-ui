<template>
  <ProfileWizard>
    <BasePage>
      <template #header>
        {{ $t('2sv.authenticator.verifyQrCode.header') }}
      </template>

      <v-row class="px-5">
        <v-form ref="form" class="pl-2 d-flex flex-column align-center" @submit.prevent="verify">
          <p>{{ $t('2sv.authenticator.verifyQrCode.info') }}</p>

          <BaseTextField
            v-model="code"
            width="100%"
            type="text"
            :label="$t('2sv.authenticator.verifyQrCode.codeInput')"
            :rules="rules"
            :error-messages="errors"
            validate-on-blur
            autofocus
            class="mt-4"
            @keyup.enter="blur"
          />
        </v-form>
      </v-row>
    </BasePage>

    <ButtonBar>
      <v-btn to="/2sv/authenticator/scan-qr" tabindex="-1" variant="outlined">
        {{ $t('global.button.back') }}
      </v-btn>

      <v-spacer></v-spacer>

      <v-btn color="primary" variant="outlined" :loading="verifying" @click="verify">
        {{ $t('global.button.verify') }}
      </v-btn>
    </ButtonBar>
  </ProfileWizard>
</template>

<script>
import ProfileWizard from '@/profile/ProfileWizard.vue'
import { verify } from '@/global/mfa'
import eventBus from '@/eventBus'

export default {
  components: {
    ProfileWizard,
  },
  data: (vm) => ({
    code: '',
    rules: [
      // users may enter codes that begin with zeros or they might put a space in between digits
      (v) => /^\d{3} ?\d{3}$/.test(v) || vm.$t('2sv.authenticator.verifyQrCode.invalidCode'),
    ],
    errors: [],
    verifying: false,
  }),
  watch: {
    code() {
      this.errors.splice(0) // a new code replaces the hint from a rejected one
    },
  },
  methods: {
    async verify() {
      if (this.verifying) {
        return // ignore double clicks while a verification is in flight
      }

      this.verifying = true
      const submittedCode = this.code.trim()
      try {
        const { valid, errors } = await this.$refs.form.validate()

        if (valid) {
          await verify(this.$route.query.id, submittedCode)

          this.$router.push('/2sv/authenticator/code-verified')
        } else {
          errors.forEach((error) => {
            eventBus.emit('error', { message: error.errorMessages.join('\n') })
          })
        }
      } catch (error) {
        if (error.status == 400) {
          if (this.code.trim() === submittedCode) {
            this.errors.splice(0, this.errors.length, this.$t('2sv.authenticator.verifyQrCode.hint'))
          }
        } else {
          // without this the button just stops loading and the user gets no explanation
          eventBus.emit('error', error)
        }
      } finally {
        this.verifying = false
      }
    },
    blur(event) {
      event.target.blur()
    },
  },
}
</script>
<style scoped>
div.v-input.v-text-field {
  max-width: 30%;
}

@media only screen and (max-width: 480px) {
  div.v-input.v-text-field {
    max-width: 60%;
  }
}
</style>
