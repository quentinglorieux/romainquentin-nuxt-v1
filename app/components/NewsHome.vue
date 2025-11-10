<script setup>
const { data: docs } = await useAsyncData('news:home', () =>
  queryCollection('news')
    .select('title', 'path', 'description', 'body', 'date', 'category', 'cover', 'external')
    .order('date', 'DESC')
    .limit(6)
    .all()
)

const items = computed(() =>
  (docs.value ?? []).map(d => ({
    title: d.title ?? d.meta?.title ?? 'Untitled',
    path: d.path ?? '',
    date: d.date ?? d.meta?.date ?? '',
    category: d.category ?? d.meta?.category ?? '',
    cover: d.cover ?? d.meta?.cover ?? '',
    description: d.description ?? d.meta?.description ?? '',
    external: d.external ?? d.meta?.external ?? null
  }))
)
</script>

<template>
  <section id="news" class="py-16 md:py-24 bg-white min-h-screen flex justify-center items-center">
    <UContainer>
      <h2 class="text-center text-2xl md:text-3xl lg:text-4xl font-serif text-gray-800 mb-12 tracking-[0.15em] uppercase">
        News
      </h2>

      <div class="grid gap-8 sm:grid-cols-3 lg:grid-cols-4">
        <NewsCard
          v-for="n in items"
          :key="n.path"
          v-bind="n"
        >
          <template #description>
            {{ n.description }}
          </template>
        </NewsCard>
      </div>

      <div class="mt-10 text-center">
        <UButton to="/news" size="lg" variant="solid" color="warning" :ui="{ rounded: 'rounded-xl' }">
          See all news
        </UButton>
      </div>
    </UContainer>
  </section>
</template>