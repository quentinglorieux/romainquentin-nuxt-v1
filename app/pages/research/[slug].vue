<script setup>
// Récupère le slug depuis la route (string ou tableau)
const route = useRoute()
const slugParam = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug

// Path généré pour les collections `type: 'page'`
const targetPath = `/research/${slugParam}`

// Charge le document complet (incluant `body`)
const { data: doc, pending, error } = await useAsyncData(
  `research:${slugParam}`,
  () => queryCollection('research').path(targetPath).first()
)

// ---------- Helpers ----------

// Normalise un DOI en URL utile (affichage direct)
function doiHref(v) {
  if (!v) return null
  const s = String(v).trim()
  if (!s) return null
  if (s.startsWith('10.')) return `https://doi.org/${s}`
  return s.replace(/^doi:\s*/i, 'https://doi.org/')
}

// Extrait proprement les DOIs du frontmatter `publications`
const dois = computed(() => {
  const p = doc?.value?.publications ?? doc?.value?.meta?.publications ?? []
  const arr = Array.isArray(p) ? p : []
  const norm = arr
    .map(x => {
      if (!x) return null
      let s = String(x).trim()
      if (!s) return null
      s = s.replace(/^doi:\s*/i, '')                 // "doi:10..." -> "10..."
      s = s.replace(/^https?:\/\/doi\.org\//i, '')   // URL -> bare
      return s.startsWith('10.') ? s : null
    })
    .filter(Boolean)
  return [...new Set(norm)]
})

// Petits alias pratiques
const tags = computed(() => {
  const t = doc?.value?.tags ?? doc?.value?.meta?.tags ?? []
  return Array.isArray(t) ? t : []
})

// ---------- Fetch OpenAlex par DOIs ----------

const { data: openalex, pending: pubPending, error: pubError } = await useAsyncData(
  () => `openalex:dois:${slugParam}`,
  () => {
    if (!dois.value.length) return { items: [] }
    return $fetch('/api/openalex/by-dois', {
      method: 'POST',
      body: { dois: dois.value }
    })
  },
  { watch: [dois], server: false }
)

// Liste normalisée
const pubs = computed(() => Array.isArray(openalex?.value?.items) ? openalex.value.items : [])

// Icône ORCID inline
const OrcidIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"
  class="w-3 h-3 inline-block align-[-1px]" role="img" focusable="false">
  <circle cx="128" cy="128" r="128" fill="#A6CE39"/>
  <path fill="#fff"
    d="M86 186h-16V70h16v116Zm66.2-83.5c16.4 0 29.7 13.3 29.7 29.7s-13.3 29.7-29.7 29.7-29.7-13.3-29.7-29.7 13.3-29.7 29.7-29.7Zm0-14.7c-24.5 0-44.4 19.9-44.4 44.4s19.9 44.4 44.4 44.4 44.4-19.9 44.4-44.4-19.9-44.4-44.4-44.4ZM86 55.5a8 8 0 1 0 0 16.1 8 8 0 0 0 0-16.1Z"/>
</svg>`
</script>

<template>
  <section class="py-10 md:py-14 bg-white">
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
        <header class="mb-8">
          <h1 class="text-3xl md:text-4xl font-serif mb-3">{{ doc.title }}</h1>
          <p v-if="doc.description" class="text-gray-600">{{ doc.description }}</p>

          <div class="mt-4 flex flex-wrap gap-2 items-center">
            <UBadge
              v-for="t in tags"
              :key="t"
              color="warning"
              variant="soft"
            >
              {{ t }}
            </UBadge>
          </div>

          <div v-if="doc.image" class="mt-6">
            <NuxtImg :src="doc.image" :alt="doc.title" class="w-full max-h-[420px] object-cover rounded-lg" />
          </div>
        </header>

        <!-- Corps Markdown -->
        <ContentRenderer v-if="doc && doc.body" :value="doc" class="prose max-w-none" />

        <!-- Publications depuis OpenAlex -->
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
                <!-- Titre + lien principal -->
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

                <!-- Auteurs + ORCID -->
                <p class="text-sm text-gray-800 mt-1 flex flex-wrap gap-x-1">
                  <template v-for="(a, j) in p.authors" :key="(a.name || 'author') + j">
                    <span class="inline-flex items-center gap-1">
                      <span>{{ a.name }}</span>
                      <a
                        v-if="a.orcid"
                        :href="`https://orcid.org/${a.orcid}`"
                        target="_blank"
                        rel="noopener"
                        class="inline-flex items-center"
                        :title="`ORCID: ${a.orcid}`"
                        v-html="OrcidIcon"
                      />
                    </span>
                    <span v-if="j < p.authors.length - 1">, </span>
                  </template>
                </p>

                <!-- Venue / pages / année -->
                <p class="text-sm text-gray-600 mt-1">
                  <span v-if="p.venue">{{ p.venue }}</span>
                  <span v-if="p.pages">, {{ p.pages }}</span>
                  <span v-if="p.year"> ({{ p.year }})</span>
                </p>

                <!-- Actions -->
                <div class="flex flex-wrap gap-3 mt-2">
                  <UButton
                    v-if="p.oaPdf"
                    :to="p.oaPdf"
                    target="_blank"
                    size="xs"
                    variant="link"
                    color="warning"
                    icon="i-lucide-file-down"
                  >
                    Open access (PDF)
                  </UButton>

                  <UButton
                    v-if="p.doi"
                    :to="doiHref(p.doi)"
                    target="_blank"
                    size="xs"
                    variant="link"
                    color="warning"
                  >
                    DOI
                  </UButton>
                </div>
              </li>
            </ul>

<ul v-else class="space-y-2">
  <li v-for="d in dois" :key="d" class="flex items-start gap-2">
    <UIcon name="i-lucide-link-2" class="mt-1 text-gray-400" />
    <a
      :href="doiHref(d)"
      target="_blank"
      rel="noopener"
      class="text-gray-700 hover:underline break-all"
    >
      {{ doiHref(d) }}
    </a>
  </li>
</ul>
          </div>
        </section>
      </div>
    </UContainer>
  </section>
</template>