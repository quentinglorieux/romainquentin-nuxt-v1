// server/api/openalex/works.get.js
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const q = getQuery(event)

  const page = Math.max(1, parseInt(String(q.page ?? '1'), 10) || 1)
  const perPage = Math.min(
    50,
    parseInt(String(q.perPage ?? (config.public.openalexPerPage || '12')), 10) || 12
  )

  // Author ID can be 'A123...' or a full URI. Normalize to full URI.
  const rawAuthorId = config.public.openalexAuthorId || 'https://openalex.org/A5035809054'
  const authorId = rawAuthorId.startsWith('http')
    ? rawAuthorId
    : `https://openalex.org/${rawAuthorId}`

  const base = config.public.openalexBase || 'https://api.openalex.org'
  const mailto = config.public.openalexMailto || 'quentin.glorieux@lkb.upmc.fr'

  // Keep payload small
  const fields = [
    'id', 'doi', 'display_name', 'publication_year',
    'host_venue', 'authorships', 'open_access',
    'primary_location', 'biblio', 'cited_by_count'
  ].join(',')

  const url = new URL(`${base}/works`)
  url.searchParams.set('page', String(page))
  url.searchParams.set('per_page', String(perPage))
  url.searchParams.set('sort', 'publication_year:desc')
  url.searchParams.set('filter', `authorships.author.id:${authorId},type:types/article`)
  url.searchParams.set('select', fields)
  url.searchParams.set('mailto', mailto)

  const res = await $fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      // OpenAlex requires clear identification
      'User-Agent': `romainquentin-nuxt (mailto:${mailto})`
    }
  })

  const items = (res?.results || []).map((w) => {
    const venue = w.host_venue?.display_name || w.primary_location?.source?.display_name || ''
    const oaPdf = w.open_access?.is_oa
      ? (w.open_access?.oa_url || w.primary_location?.pdf_url || null)
      : null

    return {
      id: w.id,
      doi: w.doi || null,
      title: w.display_name || 'Untitled',
      year: w.publication_year || null,
      venue,
      citedBy: w.cited_by_count ?? 0,
      pages: (w.biblio?.first_page && w.biblio?.last_page)
        ? `${w.biblio.first_page}–${w.biblio.last_page}`
        : null,
      oaPdf,
      bestUrl: oaPdf || w.primary_location?.landing_page_url || w.doi || w.id,
      authors: (w.authorships || []).map((a) => ({
        name: a.author?.display_name || a.institutions?.[0]?.display_name || 'Author',
        authorId: a.author?.id || null,
        isCorresponding: !!a.is_corresponding
      }))
    }
  })

  return {
    items,
    meta: {
      page,
      perPage,
      count: res?.meta?.count ?? items.length,
      next: res?.meta?.next_cursor ?? null
    }
  }
})