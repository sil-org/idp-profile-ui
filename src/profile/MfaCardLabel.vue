<template>
  <v-row v-if="editing" no-gutters align="center">
    <!-- the field flexes and the buttons size to their content, so a wider control cannot wrap the row -->
    <v-col>
      <v-text-field
        v-model="newLabel"
        autofocus
        :rules="[(v) => v.length < 65 || $t('global.mfaLabelTooLong')]"
        @keyup.enter="save"
        @focus="$event.target.select()"
      />
    </v-col>

    <v-col cols="auto">
      <v-btn
        color="success"
        size="small"
        density="comfortable"
        variant="text"
        icon="mdi-check"
        class="ml-1"
        :aria-label="$t('global.button.save')"
        @click="save"
      />
    </v-col>

    <v-col cols="auto">
      <v-btn
        color="error"
        size="small"
        density="comfortable"
        variant="text"
        icon="mdi-close"
        :aria-label="$t('global.button.cancel')"
        @click="cancel"
      />
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
            density="comfortable"
            variant="text"
            icon="mdi-pencil"
            :aria-label="$t('profile.index.rename')"
            @click="edit"
          />
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
      if (this.newLabel.length > 65) {
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
