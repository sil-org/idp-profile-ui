<template>
  <v-app>
    <v-app-bar color="primary">
      <a :href="homeUrl"><img :src="logo" alt="Logo" /></a>

      <v-spacer />

      <v-toolbar-title class="text-white px-4">{{ user.first_name }} {{ user.last_name }}</v-toolbar-title>

      <v-divider vertical inset class="mx-2" />

      <v-btn v-if="user.isAuthenticated()" variant="text" :icon="xs" class="mx-1" @click="logout">
        <v-icon v-if="xs">mdi-logout-variant</v-icon>
        <span v-else>{{ $t('app.logout') }}</span>
      </v-btn>

      <v-btn v-else variant="text" :icon="xs" class="mx-1" @click="login">
        <v-icon v-if="xs">mdi-login</v-icon>
        <span v-else>{{ $t('app.login') }}</span>
      </v-btn>

      <v-divider vertical inset />

      <HelpButton />
    </v-app-bar>

    <v-main>
      <LoadingIndicator class="ma-0" />

      <v-row no-gutters>
        <v-spacer />

        <v-btn v-if="returnTo.url" :href="returnTo.url" size="small" variant="text" color="secondary">
          return to {{ returnTo.url }}
        </v-btn>
      </v-row>

      <v-container>
        <v-dialog v-model="isModalOpen" max-width="400" @after-leave="closeModal">
          <v-card>
            <v-card-title>
              <v-icon color="error" class="mr-2">mdi-alert</v-icon>
              {{ $t('global.error') }}
            </v-card-title>
            <v-card-text>
              <span v-sanitize.basic="message" />
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="primary" @click="closeModal">
                {{ $t('global.button.close') }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- adding key here helps produce more predictable view behavior (see https://youtu.be/7YZ5DwlLSt8?t=21m22s) -->
        <router-view :key="$route.fullPath" />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import HelpButton from './help/HelpButton.vue'
import logo from '@/assets/logo.png'
import user from '@/plugins/user'
import returnTo from '@/plugins/returnTo'
import eventBus from '@/eventBus'
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'

const message = ref('')
const isModalOpen = ref(false)

const { xs } = useDisplay()

const homeUrl = import.meta.env.BASE_URL

const route = useRoute()

watch(
  () => route.fullPath,
  () => {
    message.value = ''
  },
)

watch(message, () => {
  isModalOpen.value = !!message.value
})

onMounted(() => {
  eventBus.on('clear-messages', () => {
    message.value = ''
  })
  eventBus.on('error', (err) => {
    message.value = err.message || err
  })
})

const logout = () => {
  user.logout()
}

const login = () => {
  user.login()
}

const closeModal = () => {
  message.value = ''
}
</script>

<style scoped>
a,
img {
  height: 100%; /* contain img to the toolbar's height */
}
</style>

<style>
p {
  max-width: 75ch; /* better readability supposedly */
  margin-bottom: 16px;
}

/* with the addition of the help link, the extra space on the right looked weird. */
div.v-toolbar__content {
  padding: 4px 16px; /* back to vuetify 2 default */
  padding-right: initial;
}

/* Reduces font size of button content on <= 480px screens */
@media only screen and (max-width: 480px) {
  span.v-btn__content {
    font-size: 0.8em;
  }
}
</style>
