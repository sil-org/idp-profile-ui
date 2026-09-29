<template>
  <v-row v-if="editing" no-gutters align="center">
    <v-col cols="9">
      <v-text-field
        v-model="newLabel"
        autofocus
        :rules="[(v) => v.length < 65 || $t('global.mfaLabelTooLong')]"
        @keyup.enter="save"
        @focus="$event.target.select()"
      />
    </v-col>

    <v-col>
      <v-btn
        color="success"
        size="small"
        icon
        variant="text"
        class="pl-2"
        :aria-label="$t('global.button.save')"
        @click.prevent="save"
      >
        <v-icon>mdi-check</v-icon>
      </v-btn>
    </v-col>

    <v-col>
      <v-btn
        color="error"
        size="small"
        icon
        variant="text"
        class="pl-1"
        :aria-label="$t('global.button.cancel')"
        @click.prevent="cancel"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-col>
  </v-row>

  <v-row v-else no-gutters align="center">
    <v-col>
      <h3 class="text-h5">
        {{ label }}
      </h3>
    </v-col>

    <v-col cols="auto">
      <v-tooltip v-if="!readOnly" location="right">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            color="info"
            size="small"
            icon
            variant="text"
            :aria-label="$t('profile.index.rename')"
            @click.prevent="edit"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </template>

        {{ $t('profile.index.rename') }}
      </v-tooltip>
    </v-col>
  </v-row>
</template>

<script>
import { change, changeWebauthn } from '@/global/mfa'
import eventBus from '@/eventBus'

export default {
  props: {
    label: {
      type: String,
      default: '',
    },
    keyId: {
      type: String,
      default: null,
    },
    mfaId: {
      type: String,
      default: null,
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
    isWebauthn: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['new-label'],
  data: () => ({
    editing: false,
    newLabel: '',
  }),
  methods: {
    edit() {
      this.editing = true
      this.newLabel = this.label
    },
    cancel() {
      this.editing = false
    },
    async save() {
      if (this.newLabel.length > 64) {
        eventBus.emit('error', { message: this.$t('global.mfaLabelTooLong') })
        return
      }
      const mfa = this.isWebauthn
        ? await changeWebauthn(this.mfaId, this.keyId, {
            label: this.newLabel,
          })
        : await change(this.mfaId, {
            label: this.newLabel,
          })
      this.$emit('new-label', mfa.label)
      this.editing = false
    },
  },
}
</script>
