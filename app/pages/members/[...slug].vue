<script setup>
const route = useRoute()
const path = `/members/${(route.params.slug).join('/')}`

const { data: doc } = await useAsyncData('member', () =>
  queryCollection('members').path(path).first()
)
</script>

<template>
  <article class="prose max-w-none">
    <ContentRenderer v-if="doc" :value="doc" />
    <p v-else>Member not found.</p>
  </article>
</template>