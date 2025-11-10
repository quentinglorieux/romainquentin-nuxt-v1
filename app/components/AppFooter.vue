<script setup>
const { data: admin } = await useAdmin()
const lab = computed(() => admin.value?.lab ?? {})
const footer = computed(() => admin.value?.footer ?? {})
</script>

<template>
  <footer class="border-t border-amber-800/30 bg-white text-sm text-gray-800 mt-20">
    <UContainer class="grid md:grid-cols-2 gap-8 py-12">
      <!-- Left -->
      <div>
        <p class="font-medium">{{ footer.left?.title }}</p>
        <p v-for="line in footer.left?.lines" :key="line">{{ line }}</p>
        <NuxtLink
          v-if="footer.left?.link"
          :to="footer.left.link.to"
          class="inline-block mt-3 text-sm hover:underline text-gray-600"
        >
          {{ footer.left.link.label }}
        </NuxtLink>
      </div>

      <!-- Right -->
      <div class="text-right">
        <p class="font-medium">{{ footer.right?.title }}</p>
        <p v-for="line in footer.right?.lines" :key="line">{{ line }}</p>
      </div>
    </UContainer>

    <!-- Bottom Bar -->
    <div class="border-t border-amber-800/20 text-center py-4 text-xs text-gray-500">
      <NuxtLink to="/" class="inline-flex items-center gap-2 hover:text-gray-700">
        <NuxtImg
          v-if="lab.logo"
          :src="lab.logo"
          :alt="lab.name"
          width="24"
          height="24"
        />
        <span>{{ lab.name }}</span>
      </NuxtLink>
      <span class="mx-1">•</span>
      <span>{{ footer.text }}</span>
    </div>
  </footer>
</template>

<style scoped>
footer {
  font-family: 'Roboto', sans-serif;
}
</style>