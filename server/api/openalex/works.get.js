// server/api/openalex/works.get.js
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const q = getQuery(event)

  // Pagination
  const page = Math.max(1, parseInt(String(q.page ?? '1'), 10) || 1)
  const perPage = Math.min(
    50,
    parseInt(String(q.perPage ?? (config.public.openalexPerPage || '50')), 10) || 12
  )

  // Author ID (accepts "A503..." or full URI)
  const rawAuthorId = config.public.openalexAuthorId || 'https://openalex.org/A5024990264'
  const authorId = rawAuthorId.startsWith('http') ? rawAuthorId : `https://openalex.org/${rawAuthorId}`

  const base = config.public.openalexBase || 'https://api.openalex.org'
  const mailto = config.public.openalexMailto || 'quentin.glorieux@lkb.upmc.fr'

  // Valid select fields only
  const fields = [
    'id',
    'doi',
    'display_name',
    'publication_year',
    'authorships',
    'open_access',
    'primary_location',
    'best_oa_location',
    'sources',
    'biblio',
    'cited_by_count'
  ].join(',')

  const url = new URL(`${base}/works`)
  url.searchParams.set('page', String(page))
  url.searchParams.set('per_page', String(perPage))
  url.searchParams.set('sort', 'publication_year:desc')
  url.searchParams.set('filter', `authorships.author.id:${authorId},type:types/article`)
  url.searchParams.set('select', fields)
  url.searchParams.set('mailto', mailto)

  let res
  try {
    res = await $fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': `MEL-website/1.0 (+mailto:${mailto})`
      }
    })
  } catch (err) {
    setResponseStatus(event, 502)
    return {
      error: true,
      message: 'Failed to fetch from OpenAlex',
      detail: (err && err.data) || String(err)
    }
  }

  const items = (res?.results || []).map((w) => {
    // —— Robust venue fallback chain:
    // 1) primary_location.source.display_name
    // 2) primary_location.raw_source_name
    // 3) first sources[].display_name
    // 4) empty string
    const venue =
      w?.primary_location?.source?.display_name?.trim?.() ||
      w?.primary_location?.raw_source_name?.trim?.() || 
      (Array.isArray(w?.sources) && w.sources[0]?.display_name?.trim?.()) ||
      ''

    // OA URL: prefer best_oa_location, else open_access / primary_location
    const bestOaUrl =
      w?.best_oa_location?.url ||
      w?.open_access?.oa_url ||
      w?.primary_location?.pdf_url ||
      null

    const bestLanding =
      w?.primary_location?.landing_page_url ||
      w?.best_oa_location?.landing_page_url ||
      w?.doi ||
      w?.id

    // Normalize authors + ORCID (bare ID if URL provided)
    const authors = (w.authorships || []).map((a) => {
      const rawOrcid = a?.author?.orcid || a?.orcid || null
      const orcid = rawOrcid
        ? String(rawOrcid).replace(/^https?:\/\/orcid\.org\//i, '').trim()
        : null

      return {
        name: a?.author?.display_name || a?.institutions?.[0]?.display_name || 'Author',
        authorId: a?.author?.id || null,
        orcid,
        isCorresponding: !!a?.is_corresponding
      }
    })

    return {
      id: w.id,
      doi: w.doi || null,
      title: w.display_name || 'Untitled',
      year: w.publication_year || null,
      venue,
      citedBy: w.cited_by_count ?? 0,
      pages:
        w?.biblio?.first_page && w?.biblio?.last_page
          ? `${w.biblio.first_page}–${w.biblio.last_page}`
          : null,
      oaPdf: bestOaUrl,
      bestUrl: bestOaUrl || bestLanding,
      authors
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