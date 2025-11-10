// app/composables/useAdmin.ts
export function useAdmin() {
  return useAsyncData('admin:singleton', async () => {
    const doc = await queryCollection('admin').first()
    // aplanir pour accéder via .brand/.header/.footer
    const body = doc?.body ?? doc?.meta?.body ?? {}
    return { ...body, path: doc?.path, title: doc?.title }
  })
}