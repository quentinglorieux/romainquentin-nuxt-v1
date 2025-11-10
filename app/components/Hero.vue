<script setup>
const { data: home } = await useAsyncData('home', async () => {
  const doc = await queryCollection('home').first()
  return { ...doc, body: doc?.body ?? doc?.meta?.body ?? {} }
})
const hero = computed(() => home.value?.body?.hero ?? {})
</script>

<template>
  <section
    class="relative flex items-center min-h-[92vh] overflow-hidden"
    :style="{ backgroundColor: hero.bg || '#b7c6b7' }"
  >
    <!-- Background illustration -->
    <NuxtImg
      v-if="hero.image"
      :src="hero.image"
      :alt="hero.imageAlt || ''"
      class="pointer-events-none select-none absolute bottom-[-40px] -left-16
             w-[260px] sm:w-[320px] md:w-[360px] lg:w-[400px]
             drop-shadow-xl z-0"
      sizes="(min-width:1280px) 400px, (min-width:1024px) 360px, (min-width:640px) 320px, 260px"
      width="420"
      height="420"
    />

    <!-- Content -->
    <UContainer
      class="relative z-10 py-20 md:py-28 lg:py-32
             pl-4 sm:pl-8 md:pl-12 lg:pl-[260px] xl:pl-[300px]
             pb-24 md:pb-28"
    >
      <p class="mb-4 md:mb-6 text-sm md:text-xl tracking-[0.35em] uppercase text-black/60">
        {{ hero.pretitle }}
      </p>

      <h1
        class="max-w-3xl md:max-w-4xl font-bold
               text-3xl md:text-4xl lg:text-[40px]
               leading-tight text-black drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]"
      >
        {{ hero.title }}
      </h1>

      <p class="mt-4 md:mt-5 max-w-4xl text-sm font-serif md:text-base lg:text-lg text-black/80">
        {{ hero.description }}
      </p>

      <div class="mt-6 flex flex-wrap items-center gap-4">
        <UButton
          v-for="(b, i) in hero.buttons"
          :key="i"
          size="lg"
          color="neutral"
          :to="b.to"
          :ui="{ rounded:'rounded-xl', shadow:'shadow', padding:{ lg:'px-5 py-2.5' } }"
        >
          {{ b.label }}
        </UButton>
      </div>
    </UContainer>
  </section>
</template>