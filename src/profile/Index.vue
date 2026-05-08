<template>
  <BasePage>
    <template #header>
      {{ $t('profile.index.header', [idpConfig.idpName]) }}
    </template>

    <v-row>
      <v-col cols="6">
        <Attribute :name="$t('profile.index.username')" :value="user.idp_username" sameline />
        <Attribute :name="$t('profile.index.lastLogin')" :value="formatDate(user.last_login)" sameline />
        <Attribute :name="$t('profile.index.manager')" :value="user.manager_email" sameline />
      </v-col>

      <v-col cols="6">
        <ProfileProgress :profile="{ user: user, alternates, mfa }" />
      </v-col>
    </v-row>

    <v-alert :model-value="hasUnverifiedEmails" class="my-2" type="error" icon="mdi-alert">
      <span>{{ $t('profile.index.unverifiedEmails') }}</span>
    </v-alert>

    <v-row>
      <v-col cols="12" sm="6" md="4">
        <PasswordCard :meta="user.password_meta" />
      </v-col>

      <v-col cols="12" sm="6" md="4">
        <PasswordRecoveryCard :methods="alternates" />
      </v-col>

      <v-col cols="12" sm="6" md="4">
        <DoNotDiscloseCard />
      </v-col>
    </v-row>

    <v-list-subheader class="px-4">{{ $t('profile.index.2sv') }}</v-list-subheader>

    <v-row>
      <v-col cols="12" sm="6" md="4">
        <TotpCard :meta="mfa.totp" />
      </v-col>

      <v-col v-if="numberOfKeys > 1" cols="12" sm="6" md="4">
        <SecurityKeyCard
          is-summary
          :number-of-keys="numberOfKeys"
          :webauthn-key="mfa.keys"
          :show-keys="showKeys"
          @toggle-keys="onToggleKeys"
        />
      </v-col>

      <v-col v-if="numberOfKeys === 1" cols="12" sm="6" md="4">
        <SecurityKeyCard
          :number-of-keys="numberOfKeys"
          :webauthn-key="mfa.keys.data[0]"
          :mfa-id="String(mfa.keys.id)"
        />
      </v-col>

      <v-col v-else-if="numberOfKeys === 0">
        <SecurityKeyCard is-summary :webauthn-key="{}" />
      </v-col>

      <v-col cols="12" sm="6" md="4">
        <BackupCodeCard :meta="mfa.backup" />
      </v-col>
    </v-row>

    <v-row v-if="showKeys && numberOfKeys > 1">
      <v-col>
        {{ $t('profile.index.securityKeyCard.title') }}
      </v-col>
    </v-row>

    <v-row v-if="showKeys && numberOfKeys > 1">
      <v-col v-for="webauthnKey in additionalKeys" :key="webauthnKey.id" cols="12" sm="6" md="4">
        <SecurityKeyCard :webauthn-key="webauthnKey" :number-of-keys="numberOfKeys" :mfa-id="String(mfa.keys.id)" />
      </v-col>
    </v-row>
  </BasePage>
</template>
<script>
export default {
  name: 'ProfileIndex',
}
</script>

<script setup>
import Attribute from './Attribute.vue'
import BackupCodeCard from './BackupCodeCard.vue'
import DoNotDiscloseCard from './DoNotDiscloseCard.vue'
import ProfileProgress from './ProfileProgress.vue'
import PasswordCard from './PasswordCard.vue'
import PasswordRecoveryCard from './PasswordRecoveryCard.vue'
import SecurityKeyCard from './SecurityKeyCard.vue'
import TotpCard from './TotpCard.vue'
import { formatDate } from '@/global/filters'
import { mfa as globalMfa, retrieve as retrieveMfa } from '@/global/mfa'
import { recoveryMethods, retrieve as retrieveMethods } from '@/global/recoveryMethods'
import user from '@/plugins/user'
import { computed, getCurrentInstance, onMounted, reactive, ref } from 'vue'

const { appContext } = getCurrentInstance()
const idpConfig = appContext.config.globalProperties.$idpConfig || {}

onMounted(async () => {
  await Promise.all([retrieveMethods(), retrieveMfa()])
})
const mfa = reactive(globalMfa)
const showKeys = ref(false)
const alternates = ref(recoveryMethods.alternates).value
const hasUnverifiedEmails = computed(() => alternates.some((m) => !m.verified))
const additionalKeys = computed(() => mfa.keys.data)
const numberOfKeys = computed(() => additionalKeys.value?.length || 0)

const onToggleKeys = () => {
  showKeys.value = !showKeys.value
}
</script>
