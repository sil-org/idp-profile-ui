<template>
  <v-text-field
    v-bind="$attrs"
    ref="tf"
    :model-value="modelValue"
    variant="outlined"
    @update:model-value="$emit('update:model-value', $event)"
    v-on="
      Object.keys($attrs).reduce((listeners, key) => {
        if (key.startsWith('on')) listeners[key] = $attrs[key]
        return listeners
      }, {})
    "
  />
</template>

<script>
export default {
  inheritAttrs: false,
  props: {
    modelValue: {
      type: [String, Number], // Define the type(s) for the value prop
      required: true,
    },
  },
  emits: ['update:model-value'],
  mounted() {
    // had to do this since textfield's autofocus won't work during stepper transitions...
    // I chatted with John Leider in discord and he said they need to build in some better
    // teardown when components go out of "active".  Until they do that, adding a ref to the
    // text-field and forcing the focus like this will be required to get the desired ux.
    if (this.$refs.tf.autofocus) {
      this.$nextTick(this.$refs.tf.focus)
    }
  },
  methods: {
    // lets a parent re-run this field's rules when something they depend on changes
    validate() {
      return this.$refs.tf.validate()
    },
  },
}
</script>
