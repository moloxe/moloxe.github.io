<template>
  <div class="text-neutral-400 text-xs">
    {{ parseDate(creationDate) }}
  </div>
</template>

<script setup lang="ts">
defineProps<{
  creationDate: Date
}>()

function parseDate(date: Date) {
  const months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ]
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${month} ${day}, ${year}`
}
</script>
