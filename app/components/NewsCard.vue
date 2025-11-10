<script setup>
const props = defineProps({
  title: { type: String, required: true },
  path:  { type: String, default: '' },
  date:  { type: [String, Number, Date], default: '' },
  category: { type: String, default: 'News' },
  cover: { type: String, default: '' },
  external: { type: Object, default: null } // { url, label }
})

const linkTo = computed(() => (props.external?.url || props.path || '#'))
const linkLabel = computed(() => props.external?.label || 'Read more')
</script>

<template>
  <UCard
    class="overflow-hidden hover:shadow-lg transition-shadow bg-zinc-100"
    :ui="{ body: 'p-0', footer: 'px-5 py-4' }"
  >
    <div class="relative aspect-[16/10] overflow-hidden bg-gray-100">
      <NuxtImg
        v-if="props.cover"
        :src="props.cover"
        :alt="props.title"
        class="object-cover w-full h-full transition-transform duration-500 hover:scale-[1.03]"
      />
      <div class="absolute top-3 left-3">
        <UBadge color="warning" class="uppercase tracking-wide text-[11px]">
          {{ props.category || 'News' }}
        </UBadge>
      </div>
    </div>

    <div class="px-5 pt-5 pb-2">
      <p class="text-xs text-gray-500 mb-2">
        {{ props.date ? new Date(props.date).toLocaleDateString() : '' }}
      </p>
      <NuxtLink :to="linkTo">
        <h3 class="font-semibold text-lg leading-snug hover:underline">
          {{ props.title }}
        </h3>
      </NuxtLink>
      <p class="mt-2 text-gray-600 text-sm line-clamp-3">
        <slot name="description" />
      </p>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <UButton
          :to="linkTo"
          :target="props.external?.url ? '_blank' : undefined"
          :variant="props.external?.url ? 'link' : 'outline'"
          :color="props.external?.url ? 'primary' : 'warning'"
          :icon="props.external?.url ? 'i-lucide-external-link' : 'i-lucide-arrow-right'"
        >
          {{ linkLabel }}
        </UButton>
        <div />
      </div>
    </template>
  </UCard>
</template>