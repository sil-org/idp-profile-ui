<template>
  <ProfileWizard ref="wizard">
    <BasePage>
      <template #header>
        {{ $t('profile.complete.header') }}
      </template>

      <v-row>
        <v-col cols="1" class="text-right">
          <v-icon color="success">mdi-check</v-icon>
        </v-col>

        <v-col cols="11">
          {{ $t('profile.complete.info', [$user.first_name, $idpConfig.idpName]) }}
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="1" class="text-right">
          <v-icon color="success">mdi-account</v-icon>
        </v-col>

        <v-col cols="11">
          {{ $t('profile.complete.username') }}
          <strong class="text-body-2 pl-1">{{ $user.email }}</strong>
        </v-col>
      </v-row>

      <v-row v-if="unverifiedEmails.length">
        <v-col cols="1" class="text-right">
          <v-icon color="warning">mdi-email</v-icon>
        </v-col>

        <v-col cols="11">
          {{ $t('profile.complete.unverifiedEmails') }}
          <span class="font-weight-bold">({{ joined(unverifiedEmails) }})</span>
        </v-col>
      </v-row>

      <v-row v-if="!alternates.length">
        <v-col cols="1" class="text-right">
          <v-icon color="warning">mdi-alert</v-icon>
        </v-col>
        <v-col cols="11">
          {{ $t('profile.complete.noAlternates') }}
        </v-col>
      </v-row>

      <v-row v-if="mfa.numVerified == 0">
        <v-col cols="1" class="text-right">
          <v-icon color="warning">mdi-alert</v-icon>
        </v-col>
        <v-col cols="11">
          {{ $t('profile.complete.no2sv') }}
        </v-col>
      </v-row>
    </BasePage>

    <ButtonBar>
      <v-spacer></v-spacer>

      <v-btn color="primary" variant="outlined" @click.once="done">
        {{ $t('profile.complete.button.profile') }}
      </v-btn>
    </ButtonBar>
  </ProfileWizard>
</template>

<script>
import ProfileWizard from './ProfileWizard.vue'
import recoveryMethods from '@/global/recoveryMethods'
import { mfa, retrieve as retrieveMfas } from '@/global/mfa'

export default {
  name: 'ProfileComplete',
  components: {
    ProfileWizard,
  },
  data: () => ({
    alternates: recoveryMethods.alternates,
    mfa,
  }),
  computed: {
    unverifiedEmails: (vm) => vm.alternates.filter((m) => !m.verified),
  },
  async created() {
    await retrieveMfas()

    this.$refs.wizard.completed()
    this.$forceUpdate() // couldn't figure out how to get the step to update in the UI without this.
  },
  methods: {
    joined: (emails) => emails.map((email) => email.value).join(', '),
    done() {
      this.$refs.wizard.allDone()

      this.$router.push('/profile')
    },
  },
}
</script>
