<script setup>
useSeoMeta({ title: 'News' })

const { data: docs } = await useAsyncData('news:list', () =>
  queryCollection('news')
    .select('title', 'path', 'description', 'body', 'date', 'category', 'cover', 'tags', 'external')
    .order('date', 'DESC')
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
  <section class="py-12 md:py-16 bg-white">
    <UContainer>
      <h1 class="text-3xl md:text-4xl font-serif mb-8">News</h1>

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
    </UContainer>
  </section>
</template>