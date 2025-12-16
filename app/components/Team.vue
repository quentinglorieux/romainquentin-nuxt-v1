<script setup>
const { data: docs } = await useAsyncData('members:list', () =>
  queryCollection('members')
    .order('rank', 'ASC')    
    .select('title', 'role', 'image', 'links', 'rank', 'path')
    .all()
)

function slugify(v = '') {
  return String(v)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')       // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')          // non-alnum -> hyphen
    .replace(/^-+|-+$/g, '')              // trim hyphens
}

const cards = computed(() =>
  (docs.value ?? []).map(d => {
    const name = d.title ?? d.meta?.title ?? 'Untitled'
    const explicitPath = d.path || d._path || null
    const explicitSlug = d.slug || d.meta?.slug || null
    const fallbackSlug = explicitSlug || slugify(name)
    const path = explicitPath || (fallbackSlug ? `/members/${fallbackSlug}` : null)

    return {
      name,
      role: d.role ?? d.meta?.role ?? '',
      image: d.image ?? d.meta?.image ?? null,
      links: normalizeLinks(d.links ?? d.meta?.links ?? {}),
      path
    }
  })
)

function normalizeLinks(raw) {
  // New format (Studio-friendly): [{ type, url }]
  if (Array.isArray(raw)) {
    const out = {}
    for (const item of raw) {
      if (!item) continue
      const key = String(item.type ?? item.key ?? '').trim()
      const url = String(item.url ?? item.to ?? '').trim()
      if (!key || !url) continue
      out[key] = url
    }
    return out
  }

  // Old format: { twitter: 'https://…', ... }
  if (raw && typeof raw === 'object') {
    const out = {}
    for (const [key, value] of Object.entries(raw)) {
      const url = String(value ?? '').trim()
      if (!url) continue
      out[key] = url
    }
    return out
  }

  return {}
}
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
          :key="m.path || m.name"
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
              <a
                v-for="(url, key) in m.links"
                :key="key"
                :href="url"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/90 hover:bg-amber-600 hover:scale-110 text-white text-xs font-bold"
                :aria-label="key"
              >
                {{ key === 'orcid' ? 'iD' :
                   key === 'scholar' ? 'G'  :
                   key === 'twitter' ? 'X'  :
                   key === 'linkedin' ? 'in' :
                   key === 'website' ? '🌐' :
                   key === 'email' ? '✉' : key[0].toUpperCase() }}
              </a>
            </div>
          </div>

          <!-- Nom + rôle -->
          <h3 class="mt-6 font-semibold text-lg md:text-xl font-sans">{{ m.name }}</h3>
          <p class="mt-1 text-sm text-gray-600">{{ m.role }}</p>

          <!-- Read more -->
          <UButton
            v-if="m.path"
            variant="link"
            color="warning"
            class="mt-4 uppercase underline text-[14px] tracking-wide"
            :to="m.path"
          >
            Read more
          </UButton>
          <span v-else class="mt-4 text-xs text-gray-400">No page</span>
        </article>
      </div>
    </UContainer>
  </section>
</template>