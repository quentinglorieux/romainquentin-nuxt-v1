<!-- pages/jobs/[slug].vue -->
<script setup>
const route = useRoute()
const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug

// Path for a Content collection named "jobs": content/jobs/<slug>.md
const targetPath = `/jobs/${slug}`

// Fetch the full document (includes body)
const { data: job, pending, error } = await useAsyncData(
  `job:${slug}`,
  () => queryCollection('jobs').path(targetPath).first()
)

// Helpers
function fmtDate(s) {
  if (!s) return null
  const d = new Date(String(s))
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

const keywords = computed(() => {
  const k = job.value?.keywords ?? job.value?.meta?.keywords ?? []
  return Array.isArray(k) ? k : []
})

const applyHref = computed(() => {
  const url = job.value?.application_url
  const email = job.value?.contact_email
  if (url) return url
  if (email) return `mailto:${email}?subject=${encodeURIComponent(`Application: ${job.value?.title ?? ''}`)}`
  return null
})

useSeoMeta({
  title: () => job.value?.title ? `${job.value.title} — Join Us` : 'Join Us',
  description: () => job.value?.description ?? `Open position: ${job.value?.title ?? ''}`,
})
</script>

<template>
  <section class="py-10 md:py-14">
    <UContainer>
      <!-- Loading -->
      <div v-if="pending" class="grid md:grid-cols-3 gap-8">
        <div class="md:col-span-2 space-y-3">
          <USkeleton class="h-8 w-3/4" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-5/6" />
          <USkeleton class="h-64 w-full" />
        </div>
        <aside class="md:col-span-1 space-y-3">
          <USkeleton class="h-6 w-1/2" />
          <USkeleton class="h-4 w-3/4" />
          <USkeleton class="h-4 w-2/3" />
          <USkeleton class="h-10 w-full" />
        </aside>
      </div>

      <!-- Not found -->
      <div v-else-if="error || !job">
        <UAlert
          color="red"
          title="Position not found"
          description="Please check the URL or slug."
        />
        <div class="mt-4">
          <UButton to="/#jobs" color="warning" variant="ghost" icon="i-lucide-arrow-left">
            Back to openings
          </UButton>
        </div>
      </div>

      <!-- Page -->
      <div v-else class="grid md:grid-cols-3 gap-8">
        <!-- Main content -->
        <div class="md:col-span-2">
          <div class="flex items-start justify-between gap-3">
            <h1 class="text-3xl md:text-4xl font-serif leading-tight">
              {{ job.title }}
            </h1>

          </div>

          <!-- Badges -->
          <div class="mt-3 flex flex-wrap gap-2 ">
            <UBadge v-if="job.meta.location" color="warning" variant="soft" size="lg">{{ job.meta.location }}</UBadge>
            <UBadge v-if="job.meta.contract" color="warning" variant="soft" size="lg">{{ job.meta.contract }}</UBadge>
            <UBadge v-if="job.meta.team" color="warning" variant="soft" size="lg">{{ job.meta.team }}</UBadge>
            <UBadge v-if="job.meta.lab" color="warning" variant="soft" size="lg">{{ job.meta.lab }}</UBadge>
          </div>

          <!-- Quick meta -->
          <p class="mt-2 text-sm flex flex-col gap-1 text-gray-600 space-x-3">
            <span v-if="job.meta.start"><strong>Start:</strong> {{ job.meta.start }}</span>
            <span v-if="job.meta.duration"><strong>Duration:</strong> {{ job.meta.duration }}</span>
            <span v-if="job.meta.salary"><strong>Salary:</strong> {{ job.meta.salary }}</span>
            <span v-if="job.meta.deadline"><strong>Deadline:</strong> {{ fmtDate(job.meta.deadline) }}</span>
          </p>

          <!-- Keywords -->
          <div v-if="keywords.length" class="mt-3 flex flex-wrap gap-2">
            <UBadge v-for="k in keywords" :key="k"  color="neutral" variant="subtle">
              {{ k }}
            </UBadge>
          </div>

          <!-- Body -->
          <div class="prose max-w-none mt-6">
            <ContentRenderer v-if="job.body" :value="job" />
            <p v-else class="text-gray-500">Details will be posted soon.</p>
          </div>

          <!-- Mobile CTAs -->
          <div class="mt-6 flex gap-3 md:hidden">
            <UButton
              v-if="applyHref"
              :to="applyHref"
              target="_blank"
              color="warning"
              icon="i-lucide-mail"
            >
              Apply
            </UButton>
            <UButton
              v-if="job.meta.pdf"
              :to="job.meta.pdf"
              target="_blank"
              variant="outline"
              color="warning"
              icon="i-lucide-file-text"
            >
              PDF
            </UButton>
          </div>
          <UButton
                  :to="job.meta.application_url"
                  target="_blank"
                  color="warning"
                  icon="i-lucide-mail"
                >
                  Apply now
                </UButton>
        </div>

        <!-- Sidebar -->
        <aside class="md:col-span-1">
          <UCard class=" top-6">
            <div class="space-y-3">
              <h2 class="text-lg font-semibold">Position details</h2>
              <ul class="text-sm text-gray-700 space-y-1">
                <li v-if="job.meta.location"><strong>Location:</strong> {{ job.meta.location }}</li>
                <li v-if="job.meta.contract"><strong>Contract:</strong> {{ job.meta.contract }}</li>
                <li v-if="job.meta.start"><strong>Start:</strong> {{ job.meta.start }}</li>
                <li v-if="job.meta.duration"><strong>Duration:</strong> {{ job.meta.duration }}</li>
                <li v-if="job.meta.salary"><strong>Salary:</strong> {{ job.meta.salary }}</li>
                <li v-if="job.meta.deadline"><strong>Deadline:</strong> {{ fmtDate(job.meta.deadline) }}</li>
                <li v-if="job.meta.team"><strong>Team:</strong> {{ job.meta.team }}</li>
                <li v-if="job.meta.lab"><strong>Lab:</strong> {{ job.meta.lab }}</li>
                <li v-if="job.meta.contact_name"><strong>Contact:</strong> {{ job.meta.contact_name }}</li>
                <li v-if="job.meta.contact_email"><strong>Email:</strong> {{ job.meta.contact_email }}</li>
              </ul>

              <div class="pt-2 flex flex-col gap-2">
                <UButton
                  :to="job.meta.application_url"
                  target="_blank"
                  color="warning"
                  icon="i-lucide-mail"
                >
                  Apply now
                </UButton>
                <UButton
                  v-if="job.pdf"
                  :to="job.pdf"
                  target="_blank"
                  variant="outline"
                  color="warning"
                  icon="i-lucide-file-text"
                >
                  Download PDF
                </UButton>
              </div>
            </div>
          </UCard>

          <div class="mt-6">
            <UButton to="/#jobs" variant="ghost" color="warning" class="w-full md:w-auto">
              Back to openings
            </UButton>
          </div>
        </aside>
      </div>
    </UContainer>
  </section>
</template>