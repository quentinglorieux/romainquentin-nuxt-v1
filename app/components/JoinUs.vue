<script setup>
// Charge les jobs sans trier côté SQL (évite l’erreur de colonnes)
const { data: jobs } = await useAsyncData('jobs:list', () =>
  queryCollection('jobs')
    .all()
)




// Helpers
function fmtDate(s) {
  if (!s) return null
  const d = new Date(String(s))
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

const today = new Date()
today.setHours(0,0,0,0)

// On filtre les offres “ouvertes” (deadline >= aujourd’hui ou sans deadline),
// on trie par deadline (la plus proche d’abord), puis on garde 3 max.
const openJobs = computed(() => {
  const list = (jobs.value ?? []).filter(j => {
    if (!j.deadline) return true
    const d = new Date(String(j.deadline))
    if (Number.isNaN(d.getTime())) return true
    d.setHours(0,0,0,0)
    return d >= today
  })

  list.sort((a, b) => {
    const da = a.deadline ? new Date(String(a.deadline)).getTime() : Infinity
    const db = b.deadline ? new Date(String(b.deadline)).getTime() : Infinity
    return da - db
  })

  return list.slice(0, 3).map(j => ({
    title: j.title || 'Open position',
    location: j.meta.location || null,
    deadline: j.meta.deadline ? fmtDate(j.meta.deadline) : null,
    contract: j.meta.contract || null,
    apply: j.meta.application_url || (j.meta.contact_email ? `mailto:${j.meta.contact_email}` : null),
    pdf: j.meta.pdf || null,
    duration: j.meta.duration || null,
    body: j.body || null,
    path: j.path
  }))
})

// Fallback “candidature spontanée”
const spontaneousMail = computed(() => {
  // Essaie de récupérer un email depuis la première fiche si possible, sinon défaut :
  const any = (jobs.value ?? [])[0]
  const email = any?.contact_email || 'romain.quentin@inserm.fr'
  const subject = encodeURIComponent('Spontaneous application')
  return `mailto:${email}?subject=${subject}`
})
</script>

<template>
  <section class="py-16 md:py-24 bg-white min-h-screen flex justify-center items-center">
    <UContainer>
      <h2
        class="text-center text-2xl md:text-3xl lg:text-4xl font-serif text-gray-800 mb-12 tracking-[0.15em] drop-shadow-sm uppercase"
      >
        Join Us
      </h2>
        <!-- Lien vers la page complète si tu en as une, sinon retire -->
       

      <!-- Si on a des offres -->
      <div v-if="openJobs.length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard v-for="(job, i) in openJobs" :key="i" class="flex flex-col">
        
          <NuxtLink :to="job.path" class="flex-1 flex flex-col">
            <h3 class="text-lg font-semibold">{{ job.title }}</h3>

            <div class="mt-2 flex flex-wrap gap-2 text-gray-700">
              <UBadge v-if="job.location" color="warning" variant="subtle">
                {{ job.location }}
              </UBadge>
              <UBadge v-if="job.contract" color="warning" variant="subtle">
                {{ job.contract }}
              </UBadge>
            </div>

            <p v-if="job.deadline" class="mt-2 text-sm text-gray-600">
              <strong>Deadline:</strong> {{ job.deadline }}
            </p>
          </NuxtLink>

          <div class="text-sm text-gray-700 mt-2">
            <span v-if="job.duration">{{ job.duration }}</span>
            <span v-if="job.duration && job.body"> — </span>
          </div>

          <div class="mt-4 flex items-center gap-3">
            <UButton
              :to="job.path"
              color="warning"
              icon="i-lucide-plus-circle"
            >
              More info
            </UButton>

            <UButton
              v-if="job.apply"
              :to="job.apply"
              target="_blank"
              color="warning"
              icon="i-lucide-mail"
            >
              Apply
            </UButton>

            <UButton
              v-if="job.pdf"
              :to="job.pdf"
              target="_blank"
              variant="outline"
              color="warning"
              icon="i-lucide-file-text"
            >
              PDF
            </UButton>
          </div>
        </UCard>

        <!-- Carte “candidature spontanée” si < 3 cartes -->
        <UCard
          v-if="openJobs.length < 3"
          class="flex flex-col justify-between border-dashed"
        >
          <div>
            <h3 class="text-lg font-semibold">Spontaneous application</h3>
            <p class="mt-2 text-sm text-gray-700">
              No perfect match? Tell us briefly who you are and why you’d like to join.
            </p>
          </div>
          <div class="mt-4">
            <UButton :to="spontaneousMail" color="warning" icon="i-lucide-send">
              Contact us
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- Sinon, uniquement la candidature spontanée -->
      <div v-else class="border rounded-lg p-6 bg-amber-50/40">
        <div class="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <h3 class="text-lg font-semibold">No open positions</h3>
            <p class="text-sm text-gray-700">
              We’re always happy to hear from talented people.
            </p>
          </div>
          <UButton :to="spontaneousMail" color="warning" icon="i-lucide-send">
            Spontaneous application
          </UButton>
        </div>
      </div>

      
    </UContainer>
  </section>
</template>