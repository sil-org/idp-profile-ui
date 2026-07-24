<template>
  <ProfileWizard ref="wizard">
    <BasePage>
      <template #header>{{ $t('password.recovery.header') }} </template>

      <p>{{ $t('password.recovery.explanation') }}</p>

      <p v-if="alternates.length">{{ $t('password.recovery.atLeastOneRecovery') }}</p>
      <p v-else>{{ $t('password.recovery.info', [primary.value]) }}</p>

      <p v-if="!alternates.length">
        {{ $t('password.recovery.advice') }}
      </p>

      <ul>
        <li class="text-subtitle-1 text-grey py-2">{{ $t('password.recovery.personalHeader') }}</li>

        <li v-for="method in alternates" :key="method.id" class="d-flex pb-2 pl-4">
          {{ method.value }}
          <v-tooltip :disabled="alternates.length > 1" location="right">
            <template #activator="{ props }">
              <v-icon
                v-bind="props"
                :disabled="alternates.length == 1"
                color="error"
                size="small"
                class="pl-4"
                @click.once="remove(method.id)"
              >
                mdi-delete
              </v-icon>
            </template>

            {{ $t('password.recovery.dontRemoveLastOne') }}
          </v-tooltip>
        </li>
        <li v-if="!alternates.length" class="pl-4">
          <em>{{ $t('password.recovery.noPersonalMethods') }}</em>
        </li>
      </ul>

      <v-form ref="form" class="d-flex pa-4" @submit.prevent="add">
        <BaseTextField
          v-model="newEmail"
          type="email"
          :label="$t('password.recovery.emailInput')"
          :rules="[
            // this field is never required so it must either be empty or hold a VALID email (W3C's HTML5 type=email regex)
            (v) =>
              /^$|^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(v) ||
              $t('password.recovery.invalidEmail'),
            (v) => !isAlias(v, primary.value) || $t('password.recovery.isPrimaryEmail'),
          ]"
          validate-on-input
          autofocus
        />

        <v-btn :disabled="!newEmail" size="small" color="success" class="ma-2-mod ml-4" @click="add">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </v-form>
    </BasePage>

    <template #actions>
      <v-btn v-if="!alternates.length" to="/2sv/intro" color="warning" variant="outlined" @click.once="skip">
        {{ $t('global.button.skip') }}
      </v-btn>

      <v-spacer></v-spacer>

      <v-tooltip :disabled="!(unsaved || !alternates.length)" location="right">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            :disabled="unsaved || !alternates.length"
            color="primary"
            variant="outlined"
            @click.once="complete"
          >
            {{ $t('global.button.continue') }}
          </v-btn>
        </template>

        <span v-if="unsaved">{{ $t('password.recovery.unsaved') }}</span>
        <span v-else>{{ $t('password.recovery.advice') }}</span>
      </v-tooltip>
    </template>
  </ProfileWizard>
</template>

<script>
import ProfileWizard from '@/profile/ProfileWizard.vue'
import { recoveryMethods, add, remove } from '@/global/recoveryMethods'
import eventBus from '@/eventBus'

export default {
  name: 'PasswordRecovery',
  components: {
    ProfileWizard,
  },
  data: () => ({
    newEmail: '',
    system: recoveryMethods.system,
    alternates: recoveryMethods.alternates,
  }),
  computed: {
    unsaved: (vm) => vm.newEmail != '',
    primary: (vm) => vm.system.find((m) => m.type == 'primary') || {},
  },
  methods: {
    async add() {
      const { valid, errors } = await this.$refs.form.validate()
      if (valid) {
        await add(this.newEmail)

        this.newEmail = ''

        this.$root.$emit('clear-messages') // listener in App.vue (this is a temporary hack hopefully)
      } else {
        errors.forEach((error) => {
          eventBus.emit('error', { message: error.errorMessages.join('\n') })
        })
      }
    },
    remove,
    skip() {
      this.$refs.wizard.skipped()
      this.$refs.wizard.next()
    },
    complete() {
      this.$refs.wizard.completed()
      this.$refs.wizard.next()
    },
    isAlias(email, primaryEmail) {
      const normalizeEmail = (email) => {
        const [localPart, domain] = email.split('@')
        const cleanedLocalPart = localPart.includes('+') ? localPart.split('+')[0] : localPart
        const normalizedLocalPart = cleanedLocalPart.replace(/\./g, '')

        return `${normalizedLocalPart}@${domain}`.toLowerCase()
      }

      return normalizeEmail(email) === normalizeEmail(primaryEmail)
    },
  },
}
</script>

<style scoped>
li {
  list-style-type: none;
}

/* couldn't get input and button vertically aligned using flex alone */
form > button.ma-2-mod {
  margin-top: 10px !important;
}
</style>
