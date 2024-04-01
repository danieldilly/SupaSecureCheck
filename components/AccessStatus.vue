<script setup lang="ts">
defineProps<{
  tn: DatabaseTable,
  action: CheckType
}>()
</script>

<template>
  <q-btn avatar round flat size="sm">
    <AccessStatusIcon :tn="tn" :action="action" />
  </q-btn>
</template>