<script setup>
const props = defineProps({
  items: { type: Array, required: true }, // normalized OpenAlex items from /api/openalex/works
});

/* ========== Helpers ========== */

// Normalize ORCID to bare form "0000-000X-...."
function normOrcid(v) {
  if (!v) return null;
  return String(v)
    .trim()
    .replace(/^https?:\/\/orcid\.org\//i, "");
}

// Normalize DOI href: accepts "10.xxxx/..." or already "https://doi.org/..."
function doiHref(v) {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.startsWith("10.") ? `https://doi.org/${s}` : s;
}

/* ========== Panel state & fetching single work ========== */

const showPanel = ref(false);
const selectedId = ref(null); // expects a full OpenAlex id like "https://openalex.org/Wxxxxxx"

// Fetch details whenever selectedId changes.
// Keying by the id keeps caching distinct; server:false avoids SSR churn.
const {
  data: work,
  pending: workPending,
  error: workError,
} = await useAsyncData(
  () => `work:${selectedId.value || "none"}`,
  () => {
    if (!selectedId.value) return null;
    return $fetch("/api/openalex/work", { params: { id: selectedId.value } });
  },
  { watch: [selectedId], server: false },
);

function openWork(pub) {
  // pub.id should be the OpenAlex work id URL
  selectedId.value = pub.id;
  showPanel.value = true;
}

/* ========== Derived state (ordering, filters, numbering) ========== */

const base = computed(() => (Array.isArray(props.items) ? props.items : []));

// Sort newest → oldest (desc by year; stable tiebreaker: title asc)
const sorted = computed(() => {
  const arr = [...base.value];
  arr.sort((a, b) => {
    const ya = Number(a?.year ?? 0);
    const yb = Number(b?.year ?? 0);
    if (yb !== ya) return yb - ya;
    return String(a?.title || "").localeCompare(String(b?.title || ""));
  });
  return arr;
});

// Decorate (stable _key + normalized author ORCIDs)
const decorated = computed(() =>
  sorted.value.map((pub, idx) => ({
    ...pub,
    authors: (pub.authors || []).map((a) => ({
      ...a,
      orcid: normOrcid(a?.orcid),
    })),
    _key: pub.id || `${pub.title || "untitled"}-${pub.year || "nd"}-${idx}`,
  })),
);

// Build year chips (desc); non-numeric years go last
const years = computed(() => {
  const map = new Map();
  for (const p of decorated.value) {
    const y = p.year ?? "n.d.";
    map.set(y, (map.get(y) || 0) + 1);
  }
  const rows = [...map.entries()];
  rows.sort((a, b) => {
    const na = Number(a[0]);
    const nb = Number(b[0]);
    if (Number.isFinite(nb) && Number.isFinite(na)) return nb - na;
    if (Number.isFinite(nb)) return -1;
    if (Number.isFinite(na)) return 1;
    return String(b[0]).localeCompare(String(a[0]));
  });
  return rows.map(([year, count]) => ({ year, count }));
});

const activeYear = ref(null);

// Visible set for current filter
const visible = computed(() => {
  if (!activeYear.value) return decorated.value;
  return decorated.value.filter(
    (p) => String(p.year ?? "n.d.") === String(activeYear.value),
  );
});

// Local descending numbering (within current filter)
const numbered = computed(() => {
  const total = visible.value.length;
  return visible.value.map((pub, i) => ({
    ...pub,
    _localNo: total - i,
  }));
});
</script>

<template>
  <section class="py-10 md:py-14 bg-white">
    <UContainer>
      <h1 class="text-3xl md:text-4xl font-serif mb-6">
        List of Publications
      </h1>
      <!-- Empty state -->
      <div v-if="!decorated.length" class="text-sm text-gray-500">
        No publications to display.
      </div>

      <template v-else>
        <!-- Year chips -->
        <div class="flex flex-wrap gap-2 mb-6">
          <UButton
            size="xs"
            :variant="!activeYear ? 'solid' : 'outline'"
            color="warning"
            @click="activeYear = null"
          >
            ALL ({{ decorated.length }})
          </UButton>

          <UButton
            v-for="y in years"
            :key="y.year"
            size="xs"
            :variant="activeYear === y.year ? 'solid' : 'outline'"
            color="warning"
            @click="activeYear = y.year"
          >
            {{ y.year }} ({{ y.count }})
          </UButton>
        </div>

        <!-- List (local-desc numbers) -->
        <ol class="space-y-8">
          <li
            v-for="pub in numbered"
            :key="pub._key"
            class="leading-relaxed cursor-pointer"
            @click="openWork(pub)"
          >
            <div class="flex items-start gap-3">
              <span class="text-gray-600 shrink-0 tabular-nums"
                >{{ pub._localNo }}.</span
              >

              <div>
                <!-- Title (external click does NOT open the panel) -->
                <h3 class="font-semibold text-lg">
                  <a
                    v-if="pub.doi"
                    :href="doiHref(pub.doi)"
                    target="_blank"
                    rel="noopener"
                    class="hover:underline"
                    @click.stop
                  >
                    {{ pub.title }}
                  </a>
                  <span v-else>{{ pub.title }}</span>
                </h3>

                <!-- Authors + ORCID icons -->
                <p class="text-sm text-gray-800 mt-1 flex flex-wrap gap-x-1">
                  <template
                    v-for="(a, j) in pub.authors"
                    :key="(a.name || 'author') + j"
                  >
                    <span class="inline-flex items-center gap-1">
                      <span>{{ a.name }}</span>
                      <a
                        v-if="a.orcid"
                        :href="`https://orcid.org/${a.orcid}`"
                        target="_blank"
                        rel="noopener"
                        class="inline-flex items-center"
                        :title="`ORCID: ${a.orcid}`"
                        aria-label="ORCID profile"
                        @click.stop
                      >
                        <!-- tiny ORCID SVG -->
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 256 256"
                          class="w-3 h-3"
                          role="img"
                          focusable="false"
                        >
                          <circle cx="128" cy="128" r="128" fill="#A6CE39" />
                          <path
                            fill="#fff"
                            d="M86 186h-16V70h16v116Zm66.2-83.5c16.4 0 29.7 13.3 29.7 29.7s-13.3 29.7-29.7 29.7-29.7-13.3-29.7-29.7 13.3-29.7 29.7-29.7Zm0-14.7c-24.5 0-44.4 19.9-44.4 44.4s19.9 44.4 44.4 44.4 44.4-19.9 44.4-44.4-19.9-44.4-44.4-44.4ZM86 55.5a8 8 0 1 0 0 16.1 8 8 0 0 0 0-16.1Z"
                          />
                        </svg>
                      </a>
                    </span>
                    <span v-if="j < pub.authors.length - 1">, </span>
                  </template>
                </p>

                <!-- Venue / pages / year -->
                <p class="text-sm text-gray-600 mt-1">
                  <span v-if="pub.venue">{{ pub.venue }}</span>
                  <span v-if="pub.pages">, {{ pub.pages }}</span>
                  <span v-if="pub.year" class="font-semibold">
                    ({{ pub.year }})</span
                  >
                </p>

                <div class="flex gap-4 mt-1"> 
       
                    
                <!-- Open access link (no panel open) -->
                <div v-if="pub.oaPdf" class="mt-1">
                  <UButton
                    :to="pub.oaPdf"
                    target="_blank"
                    size="xs"
                    variant="outline"
                    color="warning"
                    icon="i-lucide-file-down"
                    @click.stop
                  >
                    Open access (PDF)
                  </UButton>
                </div>

                             <div  class="mt-1"><UButton
                    size="xs"
                    variant="link"
                    color="neutral"
                    icon="i-lucide-plus-circle"
                    @click.stop="openWork(pub)"
                    >
                    More details
                    </UButton>
                  </div>
              </div>
              </div>
            </div>
          </li>
        </ol>

        <!-- Slide-over (Nuxt UI) -->
<USlideover
  v-model:open="showPanel"
  side="right"
  :overlay="true"
  :transition="true"
  :ui="{
    content: 'right-0 inset-y-0 w-full max-w-3xl',
    body: 'p-6 overflow-y-auto',
    header: 'p-0',
    footer: 'p-0'
  }"
>
  <template #content>
    <!-- Header bar -->
    <div class="flex items-center justify-between gap-3 p-4 border-b">
      <div class="min-w-0">
        <p class="text-sm font-medium text-gray-500 truncate">
          {{ work?.item?.venue }}
        </p>
      </div>

      <!-- Quick actions -->
      <div class="flex items-center gap-2">
        <UButton
          v-if="work?.item?.bestUrl"
          :to="work.item.bestUrl"
          target="_blank"
          size="xs"
          variant="soft"
          color="warning"
          icon="i-lucide-globe"
          @click.stop
        >
          HTML
        </UButton>
        <UButton
          v-if="work?.item?.oaPdf"
          :to="work.item.oaPdf"
          target="_blank"
          size="xs"
          variant="soft"
          color="warning"
          icon="i-lucide-file-down"
          @click.stop
        >
          PDF
        </UButton>
        <UButton
          v-if="work?.item?.id"
          :to="work.item.id"
          target="_blank"
          size="xs"
          variant="soft"
          color="warning"
          icon="i-lucide-code"
          @click.stop
        >
          OpenAlex
        </UButton>
        <UButton
          v-if="work?.item?.doi"
          :to="doiHref(work.item.doi)"
          target="_blank"
          size="xs"
          variant="soft"
          color="warning"
          icon="i-lucide-link"
          @click.stop
        >
          DOI
        </UButton>
      </div>
    </div>

    <div class="p-6 space-y-5">
      <!-- Loading & error -->
      <div v-if="workPending">
        <USkeleton class="h-7 w-5/6 mb-2" />
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-3/4" />
      </div>

      <div v-else-if="workError">
        <UAlert color="red" title="Failed to load record" :description="String(workError)" />
      </div>

      <div v-else-if="work?.item">
        <!-- Title -->
        <h2 class="text-xl md:text-2xl font-semibold leading-snug">
          {{ work.item.title }}
        </h2>

        <!-- Meta line -->
        <div class="text-sm text-gray-600 flex flex-wrap items-center gap-x-3 gap-y-1 py-4">
          <span v-if="work.item.year">{{ work.item.year }}</span>
          <span v-if="work.item.type" class="text-gray-400">•</span>


          <UBadge
            v-if="work.item.oaStatus"
            :color="work.item.oaStatus === 'closed' ? 'gray' : 'warning'"
            variant="soft"
            class="ml-1"
          >
            OA: {{ work.item.oaStatus }}
          </UBadge>
        </div>

        <!-- Authors (with ORCID) -->
        <p class="text-sm text-gray-800 py-2">
          <template v-for="(a, j) in work.item.authors" :key="a.name + j">
            <span class="inline-flex items-center gap-1">
              <span>{{ a.name }}</span>
              <a
                v-if="a.orcid"
                :href="`https://orcid.org/${a.orcid}`"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center"
                :title="`ORCID: ${a.orcid}`"
                @click.stop
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="w-3.5 h-3.5">
                  <circle cx="128" cy="128" r="128" fill="#A6CE39"/>
                  <path fill="#fff"
                    d="M86 186h-16V70h16v116Zm66.2-83.5c16.4 0 29.7 13.3 29.7 29.7s-13.3 29.7-29.7 29.7-29.7-13.3-29.7-29.7 13.3-29.7 29.7-29.7Zm0-14.7c-24.5 0-44.4 19.9-44.4 44.4s19.9 44.4 44.4 44.4 44.4-19.9 44.4-44.4-19.9-44.4-44.4-44.4ZM86 55.5a8 8 0 1 0 0 16.1 8 8 0 0 0 0-16.1Z"/>
                </svg>
              </a>
            </span>
            <span v-if="j < work.item.authors.length - 1">, </span>
          </template>
        </p>

        <!-- Source & pages -->
        <p class="text-ml text-gray-600 py-2">
          <span v-if="work.item.venue">{{ work.item.venue }}</span>
          <span v-if="work.item.pages">, {{ work.item.pages }}</span>
        </p>

        <!-- Metrics grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          <div class="rounded-lg border p-3">
            <p class="text-xs text-gray-500">Cites</p>
            <p class="font-semibold text-lg leading-tight">{{ work.item.citedBy ?? 0 }}</p>
          </div>
          <div class="rounded-lg border p-3">
            <p class="text-xs text-gray-500">Related to</p>
            <p class="font-semibold text-lg leading-tight">{{ work.item.relatedCount ?? 0 }}</p>
          </div>
          <div class="rounded-lg border p-3">
            <p class="text-xs text-gray-500">FWCI</p>
            <p class="font-semibold text-lg leading-tight">{{ work.item.fwci ?? '—' }}</p>
          </div>
          <div class="rounded-lg border p-3">
            <p class="text-xs text-gray-500">Citation percentile</p>
            <p class="font-semibold text-lg leading-tight">
              {{ work.item.percentile != null ? work.item.percentile.value : '—' }}
            </p>
          </div>
        </div>

        <!-- Topic hierarchy -->
        <div class="mt-3 space-y-1 text-sm py-2">
          <p v-if="work.item.topic"><span class="font-medium">Topic:</span> {{ work.item.topic }}</p>
          <p v-if="work.item.subfield"><span class="font-medium">Subfield:</span> {{ work.item.subfield }}</p>
          <p v-if="work.item.field"><span class="font-medium">Field:</span> {{ work.item.field }}</p>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap gap-3 my-4">
          <UButton v-if="work.item.oaPdf" :to="work.item.oaPdf" target="_blank" color="warning" icon="i-lucide-file-down" @click.stop>
            Open access (PDF)
          </UButton>
          <UButton v-if="work.item.bestUrl" :to="work.item.bestUrl" target="_blank" variant="outline" color="warning" icon="i-lucide-external-link" @click.stop>
            View editor version
          </UButton>
        </div>

        <!-- Abstract -->
        <div v-if="work.item.abstract" class="prose prose-sm max-w-none">
          <h3 class="mt-2 font-semibold">Abstract</h3>
          <p>{{ work.item.abstract }}</p>
        </div>
      </div>
    </div>
  </template>
</USlideover>
      </template>
    </UContainer>
  </section>
</template>
