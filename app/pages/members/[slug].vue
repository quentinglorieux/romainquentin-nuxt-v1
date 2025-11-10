<script setup>
// --- Route & path normalization ---
const route = useRoute()
const slugParam = Array.isArray(route.params.slug)
  ? route.params.slug.join('/')
  : String(route.params.slug || '').trim()
const targetPath = `/members/${slugParam}`

// --- Fetch the member document (frontmatter + body) ---
const { data: doc, pending, error } = await useAsyncData(
  `member:${slugParam}`,
  () => queryCollection('members').path(targetPath).first()
)

// --- Helpers ---
function has(val) {
  return val !== undefined && val !== null && String(val).trim() !== ''
}

// Normalize external links object from frontmatter
const links = computed(() => {
  const raw = (doc.value?.links ?? doc.value?.meta?.links ?? {}) || {}
  const safe = {}
  for (const [k, v] of Object.entries(raw)) {
    if (!v) continue
    const s = String(v).trim()
    if (!s) continue
    safe[k] = s
  }
  return safe
})

// Prefer explicit fields with fallbacks to meta.*
const name = computed(() =>
  doc.value?.title ?? doc.value?.name ?? doc.value?.meta?.title ?? 'Member'
)
const role = computed(() =>
  doc.value?.role ?? doc.value?.meta?.role ?? ''
)
const position = computed(() =>
  doc.value?.position ?? doc.value?.meta?.position ?? ''
)
const portrait = computed(() =>
  doc.value?.image ?? doc.value?.avatar ?? doc.value?.meta?.image ?? null
)

// Compute a short descriptor under the title
const subtitle = computed(() => {
  const parts = []
  if (has(role.value)) parts.push(role.value)
  if (has(position.value)) parts.push(position.value)
  return parts.join(' · ')
})

const linkOrder = ['orcid', 'scholar', 'website', 'linkedin', 'twitter', 'email']

const linkIcon = (key) => {
  switch (key) {
    case 'orcid': return 'i-simple-icons-orcid'
    case 'scholar': return 'i-simple-icons-googlescholar'
    case 'linkedin': return 'i-simple-icons-linkedin'
    case 'twitter': return 'i-simple-icons-x'
    case 'website': return 'i-lucide-globe'
    case 'email': return 'i-lucide-mail'
    default: return 'i-lucide-link'
  }
}

function linkHref(key, url) {
  if (key === 'email') {
    const s = String(url).replace(/^mailto:/i, '')
    return `mailto:${s}`
  }
  return url
}
</script>

<template>
  <section class="py-10 md:py-14 bg-white">
    <UContainer>
      <!-- Loading state -->
      <div v-if="pending" class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-8 space-y-3">
          <USkeleton class="h-8 w-2/3" />
          <USkeleton class="h-4 w-5/6" />
          <USkeleton class="h-4 w-4/6" />
          <USkeleton class="h-64 w-full" />
        </div>
        <div class="lg:col-span-4">
          <USkeleton class="h-[360px] w-full" />
        </div>
      </div>

      <!-- Error / Not found -->
      <div v-else-if="error || !doc">
        <UAlert
          color="red"
          title="Member not found"
          description="We couldn't find this profile. Check the slug and content structure."
        />
      </div>

      <!-- Content -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <!-- Left: text -->
        <div class="lg:col-span-8">
          <header class="mb-6">
            <h1 class="text-3xl md:text-4xl font-serif mb-2">
              {{ name }}
            </h1>
            <p v-if="subtitle" class="text-gray-600">{{ subtitle }}</p>

            <!-- Links row -->
            <div v-if="Object.keys(links).length" class="mt-4 flex flex-wrap gap-2">
              <UButton
                v-for="key in linkOrder.filter(k => links[k])"
                :key="key"
                :to="linkHref(key, links[key])"
                target="_blank"
                size="xs"
                variant="soft"
                color="warning"
                :icon="linkIcon(key)"
                :aria-label="key"
              >
                <span class="capitalize">{{ key }}</span>
              </UButton>
              <!-- Any extra links not in linkOrder -->
              
            </div>
          </header>

          <!-- Body -->
          <ContentRenderer v-if="doc && doc.body" :value="doc" class="prose max-w-none" />
        </div>

        <!-- Right: portrait (sticky on desktop) -->
        <aside class="lg:col-span-4">
          <div class="lg:sticky lg:top-24">
            <div class="aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-100">
              <NuxtImg
                v-if="portrait"
                :src="portrait"
                :alt="name"
                class="object-cover w-full h-full"
              />
            </div>
          </div>
        </aside>
      </div>
    </UContainer>
  </section>
</template>