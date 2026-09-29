<template>
  <v-card class="fill-height d-flex flex-column">
    <v-card-title primary-title>
      <h3 class="text-h5">{{ $t('profile.index.passwordCard.title') }}</h3>
      <v-spacer />
      <v-icon v-if="isExpiringSoon()" size="x-large" color="warning"> mdi-alert </v-icon>
    </v-card-title>

    <v-card-text class="flex-grow-1">
      <Attribute :name="$t('profile.index.passwordCard.lastChanged')" :value="formatDate(meta.last_changed)" />
      <Attribute :name="$t('profile.index.passwordCard.expires')" :value="formatDate(meta.expires)" />
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn v-if="isExpiringSoon()" :href="'#/password/create'" color="warning" variant="outlined">
        {{ $t('profile.index.passwordCard.button.changeNow') }}
      </v-btn>
      <v-btn v-else :href="'#/password/create'" color="primary" variant="outlined">
        {{ $t('global.button.change') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import Attribute from './Attribute.vue'
import { formatDate } from '@/global/filters'
import { parseISO, subDays } from 'date-fns'

export default {
  components: {
    Attribute,
  },
  props: {
    meta: {
      type: Object,
      default: () => ({
        meta: {},
      }),
    },
  },
  data: () => ({
    today: new Date(),
  }),
  methods: {
    isExpiringSoon() {
      return subDays(parseISO(this.meta.expires), 30) <= this.today
    },
    formatDate,
  },
}
</script>
