<template>
  <ProfileWizard>
    <BasePage>
      <template #header>
        {{ $t('password.reset.complete.header') }}
      </template>

      <p>{{ $t('password.reset.complete.congrats') }}</p>
    </BasePage>

    <ButtonBar>
      <v-spacer></v-spacer>

      <v-btn to="/profile" color="primary" variant="outlined">
        {{ $t('password.reset.complete.button.next') }}
      </v-btn>
    </ButtonBar>
  </ProfileWizard>
</template>

<script>
import ProfileWizard from '@/profile/ProfileWizard.vue'
import steps from '../profile/steps'

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
