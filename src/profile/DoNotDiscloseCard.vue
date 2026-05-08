<template>
  <v-card class="fill-height d-flex flex-column">
    <v-card-title primary-title>
      <v-row no-gutters align="center">
        <v-icon color="success" size="x-large">mdi-security</v-icon>

        <h3 class="text-h5 pl-4">{{ $t('profile.index.dndCard.title') }}</h3>
      </v-row>
    </v-card-title>

    <v-card-text class="flex-grow-1">
      <p>{{ $t('profile.index.dndCard.info') }}</p>
    </v-card-text>
  </v-card>
</template>
