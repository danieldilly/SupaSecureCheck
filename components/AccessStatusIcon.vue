<script setup lang="ts">
defineProps<{
  tn: DatabaseTable,
  action: CheckType
}>()
</script>

<template>
  <q-icon v-if="tn.checking === action" name="hourglass_empty" color="grey-5" size="xs" />
  <q-icon v-else-if="tn[action] === 'unlikely'" name="lock" color="grey-5" size="xs" />
  <q-icon v-else-if="tn[action]" name="warning" color="warning" size="xs" />
  <q-icon v-else-if="tn[action] === false" name="lock" color="positive" size="xs" />
  <q-icon v-else name="help" color="grey-5" size="xs" />
</template>