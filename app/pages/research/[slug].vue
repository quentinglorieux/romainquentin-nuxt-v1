<script setup>
// ---------- Route & doc cible ----------
const route = useRoute()
const slugParam = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug
const targetPath = `/research/${slugParam}`

// ---------- Chargement de la page recherche ----------
const { data: doc, pending, error } = await useAsyncData(
  `research:${slugParam}`,
  () => queryCollection('research').path(targetPath).first()
)

// ---------- Helpers ----------
function doiBare(v) {
  if (!v) return null
  let s = String(v).trim()
  if (!s) return null
  s = s.replace(/^doi:\s*/i, '').replace(/^https?:\/\/doi\.org\//i, '')
  return s.startsWith('10.') ? s : null
}
function doiHref(v) {
  if (!v) return null
  const s = String(v).trim()
  if (!s) return null
  return s.startsWith('10.') ? `https://doi.org/${s}` : s.replace(/^doi:\s*/i, 'https://doi.org/')
}

const dois = computed(() => {
  const p = doc?.value?.publications ?? doc?.value?.meta?.publications ?? []
  const arr = Array.isArray(p) ? p : []
  const norm = arr.map(doiBare).filter(Boolean)
  return [...new Set(norm)]
})

const tags = computed(() => {
  const t = doc?.value?.tags ?? doc?.value?.meta?.tags ?? []
  return Array.isArray(t) ? t : []
})

// ---------- Fetch OpenAlex (basique) depuis notre API ----------
const { data: worksMin, pending: pubPending, error: pubError } = await useAsyncData(
  () => `openalex:min:${slugParam}`,
  async () => {
    if (!dois.value.length) return []
    const results = await Promise.allSettled(
      dois.value.map((d) => $fetch('/api/openalex/work', { params: { doi: d } }))
    )
    const items = results
      .filter(r => r.status === 'fulfilled' && r.value?.item)
      .map(r => {
        const w = r.value.item
        return {
          id: w.id,
          title: w.title || 'Untitled',
          year: w.year || null,
          venue: w.venue || '',
          bestUrl: w.bestUrl || w.doi || w.id || null,
          authors: Array.isArray(w.authors) ? w.authors.map(a => ({ name: a?.name || 'Author' })) : []
        }
      })
    return items
  },
  { watch: [dois], server: false }
)

const pubs = computed(() => Array.isArray(worksMin.value) ? worksMin.value : [])

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

const team = computed(() => Array.isArray(members?.value) ? members.value : [])
</script>

<template>
  <section class="py-10 md:py-14 bg-white scroll-mt-24" id="top">
    <UContainer>
      <!-- Loading -->
      <div v-if="pending" class="space-y-3">
        <USkeleton class="h-8 w-2/3" />
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-5/6" />
      </div>

      <!-- Not found -->
      <div v-else-if="error || !doc">
        <UAlert
          color="red"
          title="Page introuvable"
          description="Le contenu demandé n’a pas été trouvé. Vérifiez le slug et la structure des fichiers."
        />
      </div>

      <!-- Content -->
      <div v-else>
        <!-- 2 colonnes desktop: contenu (2) + aside (1) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- MAIN -->
          <div class="lg:col-span-2">
            <header class="mb-8">
              <h1 class="text-3xl md:text-4xl font-serif mb-3">{{ doc.title }}</h1>
              <p v-if="doc.description" class="text-gray-600">{{ doc.description }}</p>

              <div class="mt-4 flex flex-wrap gap-2 items-center">
                <UBadge v-for="t in tags" :key="t" color="warning" variant="soft">
                  {{ t }}
                </UBadge>
              </div>
            </header>

            <!-- Corps Markdown -->
            <ContentRenderer v-if="doc && doc.body" :value="doc" class="prose max-w-none" />

            <!-- Publications (OpenAlex) : title — authors — venue — year (+ lien) -->
            <section v-if="dois.length" class="mt-10">
              <h2 class="text-2xl font-serif mb-4">Publications</h2>

              <div v-if="pubPending" class="space-y-2">
                <USkeleton class="h-5 w-5/6" />
                <USkeleton class="h-5 w-4/6" />
              </div>

              <UAlert
                v-else-if="pubError"
                color="red"
                title="Échec du chargement OpenAlex"
                :description="String(pubError)"
              />

              <div v-else>
                <ul v-if="pubs.length" class="space-y-5">
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

                    <p class="text-sm text-gray-800 mt-1">
                      <template v-for="(a, j) in p.authors" :key="a.name + j">
                        <span>{{ a.name }}</span><span v-if="j < p.authors.length - 1">, </span>
                      </template>
                    </p>

                    <p class="text-sm text-gray-600">
                      <span v-if="p.venue">{{ p.venue }}</span>
                      <span v-if="p.year"> ({{ p.year }})</span>
                    </p>
                  </li>
                </ul>

                <!-- Fallback: liste brute des DOIs -->
                <ul v-else class="space-y-2">
                  <li v-for="d in dois" :key="d" class="flex items-start gap-2">
                    <UIcon name="i-lucide-link-2" class="mt-1 text-gray-400" />
                    <a :href="doiHref(d)" target="_blank" rel="noopener" class="text-gray-700 hover:underline break-all">
                      {{ doiHref(d) }}
                    </a>
                  </li>
                </ul>
              </div>
            </section>
          </div>

          <!-- ASIDE -->
          <aside class="lg:col-span-1">
            <!-- Image à droite (desktop) -->
            <div v-if="doc.image || doc.meta?.image" class="hidden lg:block  top-6">
              <NuxtImg
                :src="doc.image || doc.meta?.image"
                :alt="doc.title"
                class="w-full rounded-lg shadow-sm max-h-[420px] object-cover"
              />
            </div>

            <!-- Team Members -->
            <div class="mt-8">
              <h3 class="text-lg font-semibold mb-3">Team Members</h3>
              <div v-if="memPending" class="space-y-2">
                <USkeleton class="h-10 w-full" />
                <USkeleton class="h-10 w-5/6" />
              </div>

              <UAlert
                v-else-if="memError"
                color="amber"
                variant="soft"
                title="Impossible de charger les membres"
                :description="String(memError)"
              />
              <ul v-else-if="team.length" class="space-y-3">
                <li v-for="m in team" :key="m._path" class="flex items-center gap-3">
                  <NuxtLink :to="m._path" class="flex items-center gap-3 group">
                    <UAvatar :src="m.image || undefined" :alt="m.title" size="md" />
                    <div>
                      <div class="font-medium group-hover:underline">{{ m.title }}</div>
                      <div v-if="m.role" class="text-xs text-gray-500">{{ m.role }}</div>
                    </div>
                  </NuxtLink>
                </li>
              </ul>

              <p v-else class="text-sm text-gray-500">No team members declared.</p>
            </div>
          </aside>
        </div>
      </div>
    </UContainer>
  </section>
</template>