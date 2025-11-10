<script setup>
const { data } = await useFetch('/api/openalex/works')
</script>

<template>
  <PublicationsList :items="data?.items || []" />
</template>