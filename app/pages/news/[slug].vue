<script setup>
// --- Route handling ---
const route = useRoute()
const slugParam = Array.isArray(route.params.slug)
  ? route.params.slug.join('/')
  : String(route.params.slug || '').trim()
const targetPath = `/news/${slugParam}`

// --- Fetch news document ---
const { data: doc, pending, error } = await useAsyncData(
  `news:${slugParam}`,
  () => queryCollection('news').path(targetPath).first()
)

// --- Helpers ---
const title = computed(() =>
  doc.value?.title ?? doc.value?.meta?.title ?? 'Untitled article'
)
const description = computed(() =>
  doc.value?.description ?? doc.value?.meta?.description ?? ''
)
const image = computed(() =>
  doc.value?.image ?? doc.value?.cover ?? doc.value?.meta?.image ?? null
)
const date = computed(() =>
  doc.value?.date ?? doc.value?.meta?.date ?? null
)
const author = computed(() =>
  doc.value?.author ?? doc.value?.meta?.author ?? null
)
const tags = computed(() => {
  const t = doc.value?.tags ?? doc.value?.meta?.tags ?? []
  return Array.isArray(t) ? t : []
})

// --- Front-matter extras: members & publications (DOIs) ---

// Normalize array-ish field safely
function toArray(val) {
  return Array.isArray(val) ? val : (val ? [val] : [])
}

// DOI utilities
function doiHref(v) {
  if (!v) return null
  const s = String(v).trim()
  if (!s) return null
  if (s.startsWith('10.')) return `https://doi.org/${s}`
  return s.replace(/^doi:\s*/i, 'https://doi.org/')
}
function bareDoi(v) {
  if (!v) return null
  let s = String(v).trim()
  if (!s) return null
  s = s.replace(/^doi:\s*/i, '')
  s = s.replace(/^https?:\/\/doi\.org\//i, '')
  return s.startsWith('10.') ? s : null
}

// ---------- Team members (slugs -> docs) ----------
const memberSlugs = computed(() => {
  const m = doc?.value?.members ?? doc?.value?.meta?.members ?? []
  return Array.isArray(m) ? m.filter(Boolean) : []
})

const { data: members, pending: memPending, error: memError } = await useAsyncData(
  () => `members:by-slugs:${slugParam}`,
  async () => {
    const slugs = Array.isArray(memberSlugs.value) ? memberSlugs.value : []
    if (!slugs.length) return []

    // Fetch each member doc individually by its path to avoid query dialect differences
    const results = await Promise.allSettled(
      slugs.map((s) => queryCollection('members').path(`/members/${s}`).first())
    )

    const docs = results
      .filter((r) => r.status === 'fulfilled' && r.value)
      .map((r) => r.value)

    return docs.map((m) => ({
      _path: m._path || m.path || '',
      title: m.title || m.name || 'Member',
      role: m.role || m.meta?.role || null,
      image: m.image || m.avatar || m.meta?.image || null,
      slug: ((m._path || m.path || '').split('/').pop()) || null
    }))
  },
  { watch: [memberSlugs], server: false }
)

// Publications: extract DOIs and fetch each record via work API
const dois = computed(() => {
  const p = doc.value?.publications ?? doc.value?.meta?.publications ?? []
  const arr = toArray(p)
  const bare = arr.map(bareDoi).filter(Boolean)
  return [...new Set(bare)]
})


const { data: pubs, pending: pubsPending, error: pubsError } = await useAsyncData(
  () => `news:openalex:${slugParam}`,
  async () => {
    if (!dois.value.length) return []
    const results = await Promise.allSettled(
      dois.value.map(d => $fetch('/api/openalex/work', { params: { doi: d } }))
    )
    return results
      .map(r => (r.status === 'fulfilled' ? (r.value?.item || null) : null))
      .filter(Boolean)
      .map((w) => ({
        id: w.id,
        title: w.title || 'Untitled',
        authors: Array.isArray(w.authors) ? w.authors.map((a) => ({ name: a.name, orcid: a.orcid || null })) : [],
        venue: w.venue || null,
        year: w.year ?? null,
        bestUrl: w.bestUrl || (w.doi ? doiHref(w.doi) : null),
        doi: w.doi || null
      }))
  },
  { watch: [dois], server: false }
)
</script>

<template>
  <section class="py-10 md:py-14 bg-white">
    <UContainer>
      <!-- Loading -->
      <div v-if="pending" class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-8 space-y-3">
          <USkeleton class="h-8 w-2/3" />
          <USkeleton class="h-4 w-5/6" />
          <USkeleton class="h-64 w-full" />
        </div>
        <div class="lg:col-span-4">
          <USkeleton class="h-[360px] w-full" />
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error || !doc">
        <UAlert
          color="red"
          title="Article not found"
          description="We couldn’t find this news article. Check the slug or content structure."
        />
      </div>

      <!-- Content -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <!-- Left column -->
        <div class="lg:col-span-8">
          <header class="mb-6">
            <h1 class="text-3xl md:text-4xl font-serif mb-2">{{ title }}</h1>
            <p v-if="description" class="text-gray-600 mb-3">{{ description }}</p>

            <div class="text-sm text-gray-500 flex flex-wrap gap-x-3">
              <span v-if="date">{{ new Date(date).toLocaleDateString() }}</span>
              <span v-if="author">by {{ author }}</span>
            </div>

            <div v-if="tags.length" class="mt-4 flex flex-wrap gap-2">
              <UBadge
                v-for="t in tags"
                :key="t"
                color="warning"
                variant="soft"
              >
                {{ t }}
              </UBadge>
            </div>
          </header>

          <!-- Markdown body -->
          <ContentRenderer v-if="doc && doc.body" :value="doc" class="prose max-w-none" />

          

          <!-- Publications (from DOIs) -->
          <section v-if="(dois?.length ?? 0) > 0" class="mt-10">
            <h2 class="text-2xl font-serif mb-4">Publication</h2>

            <div v-if="pubsPending" class="space-y-2">
              <USkeleton class="h-5 w-5/6" />
              <USkeleton class="h-5 w-4/6" />
            </div>

            <UAlert
              v-else-if="pubsError"
              color="red"
              title="Failed to load publications"
              :description="String(pubsError)"
            />

            <template v-else>
              <ul v-if="pubs?.length" class="space-y-5">
                <li v-for="(p, i) in pubs" :key="p.id || i" class="leading-relaxed">
                  <h3 class="font-medium">
                    <a
                      v-if="p.bestUrl"
                      :href="p.bestUrl"
                      target="_blank"
                      rel="noopener"
                      class="hover:underline"
                    >
                      {{ p.title }}
                    </a>
                    <span v-else>{{ p.title }}</span>
                  </h3>
                  <p v-if="p.authors?.length" class="text-sm text-gray-800 mt-1">
                    <template v-for="(a, j) in p.authors" :key="a.name + j">
                      <span>{{ a.name }}</span><span v-if="j &lt; p.authors.length - 1">, </span>
                    </template>
                  </p>
                  <p class="text-sm text-gray-600 mt-1">
                    <span v-if="p.venue">{{ p.venue }}</span>
                    <span v-if="p.year"> ({{ p.year }})</span>
                  </p>
                </li>
              </ul>

              <!-- Fallback: just list DOIs -->
              <ul v-else class="space-y-2">
                <li v-for="d in dois" :key="d" class="flex items-start gap-2">
                  <UIcon name="i-lucide-link-2" class="mt-1 text-gray-400" />
                  <a :href="doiHref(d)" target="_blank" rel="noopener" class="text-gray-700 hover:underline break-all">
                    {{ doiHref(d) }}
                  </a>
                </li>
              </ul>
            </template>
          </section>

          <!-- Associated Members -->
          <section v-if="members?.length" class="mt-10">
            <h2 class="text-2xl font-serif mb-4">Associated members</h2>
            <div class="grid gap-6 sm:grid-cols-2">
              <NuxtLink
                v-for="m in members"
                :key="m._path"
                :to="m._path"
                class="flex items-center gap-4 p-3 rounded-lg border border-gray-200 hover:border-amber-400 hover:bg-amber-50/40 transition"
              >
                <NuxtImg
                  v-if="m.image"
                  :src="m.image"
                  :alt="m.title"
                  class="w-14 h-14 rounded-full object-cover"
                />
                <div>
                  <div class="font-medium">{{ m.title }}</div>
                  <div v-if="m.role" class="text-xs text-gray-600">{{ m.role }}</div>
                </div>
              </NuxtLink>
            </div>
          </section>
        </div>

        <!-- Right column: image -->
        <aside v-if="image" class="lg:col-span-4">
          <div class="lg:sticky lg:top-24">
            <div class=" w-full overflow-hidden rounded-lg bg-gray-100">
              <NuxtImg
                :src="image"
                :alt="title"
                class="object-cover w-full h-full"
              />
            </div>
          </div>
        </aside>
      </div>
    </UContainer>
  </section>
</template>