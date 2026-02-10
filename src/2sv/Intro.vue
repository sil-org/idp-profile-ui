<template>
  <ProfileWizard>
    <BasePage>
      <template #header>
        {{ $t('2sv.intro.header') }}
      </template>

      <v-row justify="center">
        <v-col cols="auto">
          {{ $t('2sv.intro.info') }}
        </v-col>
      </v-row>
      <v-row justify="center">
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/N1CNo4AZLRQ?rel=0"
          frameborder="0"
          allow="autoplay; encrypted-media"
          allowfullscreen
          class="pa-4"
        />
      </v-row>

      <v-row justify="center" align="center">
        <v-col cols="auto" class="text-right">
          <v-icon color="info"> mdi-information </v-icon>
        </v-col>
        <v-col cols="8">
          {{ $t('2sv.intro.incentive') }}
        </v-col>
      </v-row>
    </BasePage>

    <ButtonBar>
      <v-spacer></v-spacer>

      <v-btn to="/2sv/authenticator/intro" color="primary" variant="outlined">
        {{ $t('global.button.continue') }}
      </v-btn>
    </ButtonBar>
  </ProfileWizard>
</template>

<script>
import ProfileWizard from '@/profile/ProfileWizard.vue'
import Steps from '@/profile/steps'

export default {
  name: '2svIntro',
  components: {
    ProfileWizard,
  },
  async created() {
    if (this.Steps) {
      const thisStep = Steps.forPath(this.$route.path) || {}
      const keyStep = Steps.next(thisStep)
      const codesStep = Steps.next(keyStep)
      if (thisStep.skip && keyStep.skip && codesStep.skip) {
        this.$router.push('/profile/complete')
      }
    }
  },
}
</script>
