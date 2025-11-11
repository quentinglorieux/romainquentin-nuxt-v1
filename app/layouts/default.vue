<script setup>

const { data: admin } = await useAsyncData('admin', () =>
  queryCollection('admin').first()
)
const navLinks   = computed(() => admin.value?.meta?.body?.header?.nav ?? [])
const logo       = computed(() => admin.value?.meta?.body?.lab?.logo ?? '/img/logo.png')
const footerText = computed(() => admin.value?.meta?.body?.footer?.text ?? '')

/**
 * Navigation & recherche pour la palette.
 * Remplacez les collections par celles que vous voulez exposer.
 */
const collectionsForNav    = ['members', 'news', 'research', 'jobs']
const collectionsForSearch = ['members', 'news', 'research', 'jobs']

const [{ data: navigation }, { data: files }] = await Promise.all([
  useAsyncData('content:navigation', async () => {
    const trees = await Promise.all(
      collectionsForNav.map(name => queryCollectionNavigation(name))
    )
    return trees.flat()
  }),
  useLazyAsyncData('content:search', async () => {
    const lists = await Promise.all(
      collectionsForSearch.map(name => queryCollectionSearchSections(name))
    )
    return lists.flat()
  }, { server: false })
])

const error = useError()
</script>

<template>
  <div>
    <AppHeader :logo="logo" :links="navLinks"  />

    <UMain>
        <UPage>
          <UError v-if="error" :error="error" />
          <slot />
        </UPage>
    </UMain>

    <AppFooter :text="footerText" />

    <ClientOnly>
      <LazyUContentSearch
        :files="files"
        :navigation="navigation"
        :links="navLinks"
        shortcut="meta_k"
        :fuse="{ resultLimit: 42 }"
      />
    </ClientOnly>

    <UToaster />
  </div>
</template>