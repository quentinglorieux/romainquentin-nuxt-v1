<script setup>
const { data: docs } = await useAsyncData('research:list', () =>
  queryCollection('research')
    .all()
)

// Compute clean cards
const cards = computed(() =>
  (docs.value ?? []).map(d => ({
    title: d.title ?? 'Untitled',
    image: d.meta?.image ?? null,
    // Prefer explicit slug if you have it, fallback to Nuxt Content path
    to: d.path || ""
  }))
)
</script>

<template>
  <section class="py-16 md:py-24 bg-white min-h-screen flex justify-center items-center">
    <UContainer>
      <h2
        class="text-center text-2xl md:text-3xl lg:text-4xl font-serif text-gray-800 mb-12 tracking-[0.15em] drop-shadow-sm uppercase"
      >
        Our Research
      </h2>

      <div
        class="grid gap-10 md:gap-12 lg:gap-16 sm:grid-cols-2 lg:grid-cols-3 place-items-center"
      >
        <div
          v-for="(item, i) in cards"
          :key="i"
          class="group relative w-[260px] sm:w-[300px] md:w-[340px] lg:w-[360px] aspect-square overflow-hidden"
        >
          <NuxtLink :to="item.to" class="block w-full h-full">
            <NuxtImg
              v-if="item.image"
              :src="item.image"
              :alt="item.title"
              class="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
            <div v-else class="w-full h-full bg-gray-200" />

            <div
              class="absolute inset-0 flex flex-col items-center justify-center bg-black/45 text-white text-center px-4 transition-all duration-300 group-hover:bg-black/60"
            >
              <h3
                class="font-semibold text-lg md:text-xl leading-tight uppercase tracking-tight drop-shadow-md"
              >
                {{ item.title }}
              </h3>
              <UButton
                variant="outline"
                color="white"
                size="md"
                class="mt-4 uppercase text-xs tracking-wide border-2 border-white"
              >
                Learn more
              </UButton>
            </div>
          </NuxtLink>
        </div>
      </div>
    </UContainer>
  </section>
</template>