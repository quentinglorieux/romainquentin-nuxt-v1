<script setup>
defineProps({
  logo: { type: String, default: '/img/logo.png' },
  links: { type: Array, default: () => [] }, // [{label,to,external?}]
  cta:   { type: Object, default: null }     // {label,to}
})

const open = ref(false) // mobile only
</script>

<template>
  <header class="sticky top-0 z-40 bg-[#b7c6b7]/95 backdrop-blur border-b border-black/10">
    <UContainer class="h-16 lg:h-18 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <!-- Left: Logo -->
      <div class="flex items-center">
        <NuxtLink to="/" class="flex items-center gap-2">
          <img :src="logo" alt="Logo" class="h-8 w-8" />
          <span class="sr-only">Home</span>
        </NuxtLink>
      </div>

      <!-- Center: Nav (desktop) -->
      <nav class="hidden lg:block">
        <ul class="flex items-center gap-8 text-[12px] tracking-[0.25em] uppercase">
          <li v-for="l in links" :key="l?.label" class="relative">
            <NuxtLink
              v-if="!l?.external"
              :to="l?.to"
              class="text-black/80 hover:text-black pb-1"
              active-class="text-black after:w-full"
            >
              {{ l?.label }}
            </NuxtLink>
            <a
              v-else
              :href="l?.to"
              target="_blank"
              rel="noopener"
              class="text-black/80 hover:text-black pb-1"
            >
              {{ l?.label }}
            </a>

            <!-- fine underline on hover/active -->
            <span
              class="pointer-events-none absolute -bottom-0.5 left-0 h-[1px] w-0 bg-black transition-all duration-200 group-hover:w-full"
            />
          </li>
        </ul>
      </nav>

      <!-- Right: actions (desktop) -->
      <div class="hidden lg:flex items-center justify-end gap-3">
        <UColorModeButton />
        
        <UButton
          v-if="cta"
          size="sm"
          variant="soft"
          color="gray"
          :to="cta.to"
          :ui="{ rounded:'rounded-xl', padding:{ sm:'px-3 py-1.5' } }"
        >
          {{ cta.label }}
        </UButton>
      </div>

      <!-- Mobile: burger -->
      <div class="flex lg:hidden items-center justify-end">
        <UButton icon="i-heroicons-bars-3" variant="ghost" @click="open = true" />
        <USlideover v-model="open">
          <div class="p-4 space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-semibold">Menu</span>
              <UButton icon="i-heroicons-x-mark" variant="ghost" @click="open = false" />
            </div>
            <ul class="space-y-1">
              <li v-for="l in links" :key="l?.label">
                <NuxtLink
                  v-if="!l?.external"
                  :to="l?.to"
                  class="block py-2 text-black/90"
                  @click="open = false"
                >
                  {{ l?.label }}
                </NuxtLink>
                <a
                  v-else
                  :href="l?.to"
                  target="_blank"
                  rel="noopener"
                  class="block py-2 text-black/90"
                  @click="open = false"
                >
                  {{ l?.label }}
                </a>
              </li>
            </ul>
            
            <UButton
              v-if="cta"
              block
              variant="soft"
              color="gray"
              :to="cta.to"
              @click="open = false"
            >
              {{ cta.label }}
            </UButton>
          </div>
        </USlideover>
      </div>
    </UContainer>
  </header>
</template>

<style scoped>
/* underline expand on hover */
li:hover > span { width: 100%; }
</style>