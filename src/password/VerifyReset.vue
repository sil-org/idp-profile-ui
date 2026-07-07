<template>
  <BasePage>
    <template #header>
      {{ $t('password.reset.verify.header') }}
    </template>

    <p v-if="verifying">{{ $t('password.reset.verify.verifying') }}</p>
    <p v-if="verified">{{ $t('password.reset.verify.verified') }}</p>
    <p v-if="invalid">{{ $t('password.reset.verify.invalid') }}</p>

    <ButtonBar>
      <v-spacer />

      <v-btn v-if="verified" to="/password/create" color="primary" variant="outlined">
        {{ $t('password.reset.verify.button.create') }}
      </v-btn>
      <v-btn v-if="invalid" to="/password/forgot" color="primary" variant="outlined">
        {{ $t('password.reset.verify.button.again') }}
      </v-btn>
    </ButtonBar>
  </BasePage>
</template>

<script>
export default {
  data: () => ({
    verifying: true,
    verified: false,
    invalid: false,
  }),
  async created() {
    try {
      await this.$API.put(`reset/${this.$route.params.id}/validate`, {
        code: this.$route.params.code,
      })

      await this.$user.refresh()

      this.verified = true
    } catch (e) {
      this.invalid = true
    } finally {
      this.verifying = false
    }
  },
}
</script>
