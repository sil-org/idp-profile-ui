<template>
  <ProfileWizard ref="wizard">
    <BasePage>
      <template #header>
        {{ $t('password.confirm.header') }}
      </template>

      <v-form ref="form" class="pa-4" @submit.prevent="confirm">
        <p>{{ $t('password.confirm.explanation') }}</p>

        <div class="d-flex">
          <BaseTextField
            v-model="password"
            :type="passwordIsHidden ? 'password' : 'text'"
            :label="$t('password.confirm.pwInput')"
            :rules="rules"
            :error-messages="errors"
            validate-on-blur
            autofocus
            name="password"
            @keyup.enter="blur"
          />

          <v-tooltip location="top">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                class="align-center ml-1"
                variant="text"
                icon
                tabindex="-1"
                @click="passwordIsHidden = !passwordIsHidden"
              >
                <v-icon>{{ passwordIsHidden ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
              </v-btn>
            </template>

            <span>{{ passwordIsHidden ? 'Show' : 'Hide' }} password</span>
          </v-tooltip>
        </div>
      </v-form>
    </BasePage>

    <template #actions>
      <v-btn to="/password/create" :color="errors.length ? 'primary' : ''" tabindex="-1" variant="outlined">
        {{ $t('global.button.back') }}
      </v-btn>

      <v-spacer></v-spacer>

      <v-btn color="primary" :disabled="errors.length > 0" variant="outlined" @click.once="confirm">
        {{ $t('global.button.continue') }}
      </v-btn>
    </template>
  </ProfileWizard>
</template>

<script>
import { usePasswordStore } from './password'
import ProfileWizard from '@/profile/ProfileWizard.vue'
import eventBus from '@/eventBus'

export default {
  name: 'PasswordConfirm',
  components: {
    ProfileWizard,
  },
  beforeRouteLeave(to, from, next) {
    this.storedPassword = ''

    next()
  },
  data() {
    return {
      password: '',
      passwordIsHidden: true,
      rules: [(v) => v === this.storedPassword || this.$t('password.confirm.noMatch')],
      errors: [],
    }
  },
  computed: {
    passwordStore() {
      return usePasswordStore()
    },
    storedPassword: {
      get() {
        return this.passwordStore.password.value
      },
      set(value) {
        this.passwordStore.setPassword(value)
      },
    },
  },
  methods: {
    async confirm() {
      const { valid, errors } = await this.$refs.form.validate()
      if (valid) {
        await this.$API.put('password', {
          password: this.password,
        })

        this.$refs.wizard.completed()

        this.$router.push('/password/saved')
      } else {
        errors.forEach((error) => {
          eventBus.emit('error', { message: error.errorMessages.join('\n') })
        })
      }
    },
    blur(event) {
      event.target.blur()
    },
  },
}
</script>
