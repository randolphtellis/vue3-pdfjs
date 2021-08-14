<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'vue-pdf',

  props: {
    name: {
      type: String,
      default: null
    }
  },
  setup(props) {
    return {
      props
    }
  }
})
</script>

<template>
	<div class="vue3-pdf">
    Pdf Viewer - {{ name }}
  </div>
</template>

