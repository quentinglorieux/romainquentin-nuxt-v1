<script setup>
const { data: docs } = await useAsyncData('members:list', () =>
  queryCollection('members')
    .order('rank', 'ASC')    
    .select('title', 'role', 'image', 'links', 'rank')
    .all()
)

const cards = computed(() =>
  (docs.value ?? []).map(d => ({
    name: d.title ?? d.meta?.title ?? 'Untitled',
    role: d.role ?? '',
    image: d.image ?? null,
    links: d.links ?? {}
  }))
)
</script>

<template>
  <section class="py-16 md:py-24 min-h-screen flex justify-center items-center">
    <UContainer>
      <h2
        class="text-center text-2xl md:text-3xl lg:text-4xl font-serif text-gray-800 mb-12 tracking-[0.15em] uppercase drop-shadow-sm"
      >
        Our Team
      </h2>

      <div class="grid gap-12 md:gap-14 lg:gap-16 sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="m in cards"
          :key="m.path"
          class="flex flex-col items-center text-center"
        >
          <!-- Photo -->
          <div class="relative w-[260px] sm:w-[280px] md:w-[300px] aspect-2/3 overflow-hidden ">
            <NuxtImg
              v-if="m.image"
              :src="m.image"
              :alt="m.name"
              class="object-cover w-full h-full grayscale-100"
            />
            <div v-else class="w-full h-full bg-gray-200" />
            <!-- Liens sociaux -->
            <div class="absolute left-4 bottom-4 flex gap-3">
              <NuxtLink
                v-for="(url, key) in m.links"
                :key="key"
                :to="url"
                target="_blank"
                class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/90 hover:bg-amber-600 hover:scale-110 text-white text-xs font-bold"
                :aria-label="key"
              >
                {{ key === 'orcid' ? 'iD' :
                   key === 'scholar' ? 'G'  :
                   key === 'twitter' ? 'X'  :
                   key === 'linkedin' ? 'in' :
                   key === 'website' ? '🌐' :
                   key === 'email' ? '✉' : key[0].toUpperCase() }}
              </NuxtLink>
            </div>
          </div>

          <!-- Nom + rôle -->
          <h3 class="mt-6 font-semibold text-lg md:text-xl font-sans">{{ m.name }}</h3>
          <p class="mt-1 text-sm text-gray-600">{{ m.role }}</p>

          <!-- Read more -->
          <UButton
            variant="link"
            color="warning"
            class="mt-4 uppercase underline text-[14px] tracking-wide"
            :to="`/members/${m.name.replace(' ', '-').toLowerCase()}`"
          >
            Read more
          </UButton>
        </article>
      </div>
    </UContainer>
  </section>
</template>