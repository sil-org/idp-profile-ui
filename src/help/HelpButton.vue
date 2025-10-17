<template>
  <v-dialog v-if="!!$idpConfig.support" v-model="isOpen" width="initial">
    <!-- making it initial so card grows with content -->
    <template #activator="{ props }">
      <v-btn v-bind="props" variant="text" :icon="xs" class="mx-1">
        <span v-if="!xs">{{ $t('help.button.help') }}</span>
        <v-icon v-if="xs">mdi-help</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-title class="text-h5 bg-primary text-white"> {{ $t('help.title') }} </v-card-title>

      <v-card-text>
        <p v-if="$idpConfig.support.phone">
          {{ $t('help.phone') }}<span class="text-subtitle-1"> {{ $idpConfig.support?.phone }}</span>
        </p>
        <p v-if="$idpConfig.support.email">
          {{ $t('help.email') }}<span class="text-subtitle-1"> {{ $idpConfig.support?.email }}</span>
        </p>
        <p v-if="$idpConfig.support.url">
          {{ $t('help.site') }}
          <a :href="$idpConfig.support?.url" target="_blank" class="text-subtitle-1">
            {{ $idpConfig.support.url }}
          </a>
        </p>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="text" @click="isOpen = false"> {{ $t('help.button.ok') }} </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useDisplay } from 'vuetify'

const isOpen = ref(false)

const { xs } = useDisplay()
</script>
