<script setup>
useSeoMeta({ title: 'Publications' })

const page = ref(1)
const perPage = 12

const { data, pending, error, refresh } = await useAsyncData(
  () => `openalex-works-${page.value}`,
  () => $fetch('/api/openalex/works', { query: { page: page.value, perPage } }),
  { watch: [page] }
)

const items = computed(() => data.value?.items ?? [])
const meta  = computed(() => data.value?.meta  ?? { page: 1, count: 0 })
</script>

<template>
  <section class="py-12 md:py-16 bg-white">
    <UContainer>
      <h1 class="text-3xl md:text-4xl font-serif mb-8">Publications</h1>

      <div v-if="pending" class="text-gray-500">Loading…</div>
      <div v-else-if="error" class="text-red-600">Failed to load publications.</div>

      <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <UCard v-for="p in items" :key="p.id" class="overflow-hidden">
          <div class="px-5 py-4">
            <div class="flex items-baseline gap-2">
              <span class="text-sm text-gray-500">{{ p.year ?? '—' }}</span>
              <UBadge v-if="p.oaPdf" size="xs" color="emerald" variant="soft">Open Access</UBadge>
            </div>

            <NuxtLink :to="p.bestUrl" target="_blank">
              <h3 class="mt-1 font-semibold leading-snug hover:underline">
                {{ p.title }}
              </h3>
            </NuxtLink>

            <p class="mt-1 text-sm text-gray-600">
              <span class="italic">{{ p.venue }}</span>
              <span v-if="p.pages">, {{ p.pages }}</span>
            </p>

            <p class="mt-2 text-sm text-gray-700 line-clamp-2">
              {{ p.authors.map(a => a.name).join(', ') }}
            </p>

            <div class="mt-3 flex items-center gap-3 text-xs text-gray-500">
              <span>cited by {{ p.citedBy }}</span>
              <NuxtLink v-if="p.doi" :to="p.doi" target="_blank" class="hover:underline">DOI</NuxtLink>
              <NuxtLink v-else :to="p.id" target="_blank" class="hover:underline">OpenAlex</NuxtLink>
              <NuxtLink v-if="p.oaPdf" :to="p.oaPdf" target="_blank" class="hover:underline">PDF</NuxtLink>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Pagination -->
      <div class="mt-10 flex items-center justify-center gap-3">
        <UButton :disabled="(meta.page ?? 1) <= 1" @click="page--" icon="i-lucide-chevron-left" variant="soft">
          Prev
        </UButton>
        <span class="text-sm text-gray-600">Page {{ meta.page }}</span>
        <UButton @click="page++" icon-right="i-lucide-chevron-right" variant="soft">
          Next
        </UButton>
      </div>
    </UContainer>
  </section>
</template>