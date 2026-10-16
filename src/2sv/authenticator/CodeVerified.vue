<template>
  <ProfileWizard>
    <BasePage>
      <template #header>
        {{ $t('2sv.authenticator.codeVerified.header') }}
      </template>

      <p class="text-center">
        {{ $t('2sv.authenticator.codeVerified.info') }}
      </p>
    </BasePage>

    <ButtonBar>
      <v-spacer></v-spacer>

      <v-btn to="/2sv/usb-security-key/intro" color="primary" variant="outlined">
        {{ $t('global.button.continue') }}
      </v-btn>
    </ButtonBar>
  </ProfileWizard>
</template>

<script>
import ProfileWizard from '@/profile/ProfileWizard.vue'
import steps from '../../profile/steps'

export default {
  components: {
    ProfileWizard,
  },
  async created() {
    await steps.init()
    const step = steps.forPath(this.$route.path)
    if (step) {
      step.state = 'complete'
    }
  },
}
</script>
