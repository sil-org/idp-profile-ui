<template>
  <ProfileWizard ref="wizard" :key="wizardKey">
    <BasePage>
      <template #header>
        {{ $t('password.create.header', [$idpConfig.idpName]) }}
      </template>

      <v-form ref="form" @submit.prevent="save">
        <p>
          {{ $t('password.create.username', [$idpConfig.idpName]) }}
          <strong class="text-body-2">{{ $user.idp_username }}</strong>
        </p>

        <div class="d-flex">
          <BaseTextField
            v-model="password"
            :type="passwordIsHidden ? 'password' : 'text'"
            :label="$t('password.create.pwInput')"
            :rules="rules"
            :error-messages="errors"
            validate-on-input
            autofocus
            name="password"
            @keyup.enter="blur"
          />

          <v-tooltip location="top">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                class="align-center"
                variant="text ml-1"
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

        <v-alert
          v-show="!!(showFeedback && password && strength)"
          :type="strength.feedback.warning ? 'error' : 'info'"
          :icon="strength.feedback.warning ? 'mdi-alert' : 'mdi-information'"
          variant="outlined"
        >
          <header class="text-body-2">
            {{ strength.feedback.warning }}
          </header>

          <ul>
            <li v-for="suggestion in strength.feedback.suggestions" :key="suggestion">
              {{ suggestion }}
            </li>
          </ul>

          <footer class="d-flex align-center justify-end">
            <a
              href="https://idphelp.sil.org/logging-in/password/password-recommendations"
              target="_blank"
              class="text-caption"
            >
              {{ $t('global.learnMore') }}
            </a>
          </footer>
        </v-alert>

        <v-alert v-show="!!isGood" type="success" variant="outlined">
          <header class="text-body-2">
            {{ $t('password.create.goodPassword') }}
          </header>
        </v-alert>
      </v-form>
    </BasePage>

    <template #actions>
      <v-btn v-if="$user.isNew()" to="/profile/intro" tabindex="-1" variant="outlined">
        {{ $t('global.button.back') }}
      </v-btn>
      <v-btn v-else tabindex="-1" variant="outlined" @click.once="skip">
        {{ $t('global.button.skip') }}
      </v-btn>

      <v-spacer />

      <v-btn color="primary" variant="outlined" @click.once="save">
        {{ $t('global.button.continue') }}
      </v-btn>
    </template>
  </ProfileWizard>
</template>

<script>
import { usePasswordStore } from './password'
import ProfileWizard from '@/profile/ProfileWizard.vue'
import eventBus from '@/eventBus'
import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core'
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common'
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en'

export default {
  name: 'CreatePassword',
  components: {
    ProfileWizard,
  },
  data() {
    return {
      wizardKey: 0,
      passwordIsHidden: true,
      rules: [
        (v) => required(v, this),
        (v) => minLength(v, this),
        (v) => maxLength(v, this),
        (v) => strong(v, this),
        (v) => requireAlphaAndNumeric(v, this),
      ],
      errors: [],
    }
  },
  computed: {
    passwordStore() {
      return usePasswordStore()
    },
    password: {
      get() {
        return this.passwordStore.password.value
      },
      set(value) {
        this.passwordStore.setPassword(value)
      },
    },
    strength() {
      return zxcvbn(this.password)
    },
    showFeedback: (vm) => vm.strength.feedback.warning || vm.strength.feedback.suggestions.length,
    isGood: (vm) => vm.password && vm.$refs.form && vm.$refs.form.validate(),
  },
  watch: {
    password: function () {
      // This is used to refresh the form, instead of leaving it frozen after a re-used password
      if (this.password == '') {
        this.forceRerender()
      }

      if (this.isGood) {
        this.errors.splice(0)
      }
    },
  },
  methods: {
    forceRerender() {
      // This is used to refresh the form, instead of leaving it frozen after a re-used password
      this.wizardKey += 1
    },
    async save() {
      const { valid, errors } = await this.$refs.form.validate()

      if (valid) {
        try {
          await this.$API.put('password/assess', {
            password: this.password,
          })

          this.$router.push('/password/confirm')
        } catch (e) {
          this.errors.push(this.$t('password.create.noGood'))

          this.password = ''

          if (e.code === 1554734183) {
            window.gtag('event', 'pwned', {
              event_category: 'password',
              event_label: 'Password Compromise Detected',
            })
          }
        }
      } else {
        errors.forEach((error) => {
          eventBus.emit('error', { message: error.errorMessages.join('\n') })
        })
      }
    },
    blur(event) {
      event.target.blur()
    },
    skip() {
      this.$refs.wizard.next()
    },
  },
}

const required = (v, vm) => !!v || vm.$t('password.create.required')
const minLength = (v, vm) =>
  v.length >= vm.$idpConfig.passwordRules.minLength ||
  vm.$t('password.create.tooShort', [vm.$idpConfig.passwordRules.minLength])
const maxLength = (v, vm) =>
  v.length < vm.$idpConfig.passwordRules.maxLength ||
  vm.$t('password.create.tooLong', [vm.$idpConfig.passwordRules.maxLength])
const strong = (v, vm) => vm.strength.score >= vm.$idpConfig.passwordRules.minScore || vm.$t('password.create.tooWeak')
const requireAlphaAndNumeric = (v, vm) =>
  !vm.$idpConfig.passwordRules.requireAlphaAndNumeric ||
  (/\p{L}/u.test(vm.password) && /\p{N}/u.test(vm.password)) ||
  vm.$t('password.create.requireAlphaAndNumeric')
const options = {
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
  translations: zxcvbnEnPackage.translations,
}

zxcvbnOptions.setOptions(options)
</script>
