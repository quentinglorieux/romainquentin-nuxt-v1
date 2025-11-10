export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const config = useRuntimeConfig()

  const base   = config.public.openalexBase   || 'https://api.openalex.org'
  const mailto = config.public.openalexMailto || 'quentin.glorieux@lkb.upmc.fr'

  // Accept either:
  //  - id: "W123..." or "https://openalex.org/W123..."
  //  - doi: "10.xxxx/yyy" or "doi:10.xxxx/yyy" or "https://doi.org/10.xxxx/yyy"
  const idRaw  = q.id  ? String(q.id).trim()  : null
  const doiRaw = q.doi ? String(q.doi).trim() : null

  if (!idRaw && !doiRaw) {
    setResponseStatus(event, 400)
    return { error: true, message: 'Missing id or doi' }
  }

  // ---------- Build endpoint ----------
  let endpoint = ''
  if (doiRaw) {
    // Normalise: bare DOI "10.xxxx/..." sans préfixe
    const bare = doiRaw
      .replace(/^doi:\s*/i, '')
      .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
      .trim()

    // OpenAlex format conseillé : /works/https://doi.org/<DOI>
    endpoint = `${base}/works/https://doi.org/${encodeURIComponent(bare)}`
  } else {
    // Normalise l'ID OpenAlex : "Wxxxx" ou URL -> "Wxxxx"
    const wid = idRaw.startsWith('http')
      ? idRaw.split('/').pop()
      : idRaw
    endpoint = `${base}/works/${wid}`
  }

  // Champs valides (doc OpenAlex)
  const fields = [
    'id','doi','display_name','publication_year','publication_date','language',
    'type','primary_location','best_oa_location','open_access','sources',
    'authorships','biblio','cited_by_count',
    'abstract_inverted_index','topics','related_works','referenced_works',
    'counts_by_year','sustainable_development_goals','concepts'
  ].join(',')

  const url = new URL(endpoint)
  url.searchParams.set('select', fields)
  url.searchParams.set('mailto', mailto)

  let raw
  try {
    raw = await $fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': `MEL-website/1.0 (+mailto:${mailto})`
      }
    })
  } catch (err) {
    setResponseStatus(event, 502)
    return {
      error: true,
      message: 'Failed to fetch work',
      detail: (err && err.data) || String(err)
    }
  }

  // ---------- Helpers ----------
  function abstractFromInverted(inv) {
    if (!inv || typeof inv !== 'object') return null
    const allPos = Object.values(inv).flat()
    if (!allPos.length) return null
    const maxPos = Math.max(...allPos)
    const arr = Array(maxPos + 1).fill('')
    for (const [word, poss] of Object.entries(inv)) {
      for (const p of poss) arr[p] = word
    }
    const txt = arr.join(' ').replace(/\s+/g, ' ').trim()
    return txt || null
  }

  // Venue fallback: source.display_name > raw_source_name > first sources[x].display_name
  const venue =
    raw?.primary_location?.source?.display_name?.trim?.() ||
    raw?.primary_location?.raw_source_name?.trim?.() ||
    (Array.isArray(raw?.sources) && raw.sources[0]?.display_name?.trim?.()) ||
    ''

  // OA URLs
  const bestOaUrl =
    raw?.best_oa_location?.url ||
    raw?.open_access?.oa_url ||
    raw?.primary_location?.pdf_url ||
    null

  const bestLanding =
    raw?.primary_location?.landing_page_url ||
    raw?.best_oa_location?.landing_page_url ||
    raw?.doi ||
    raw?.id

  // Auteurs + ORCID normalisé
  const authors = (raw.authorships || []).map((a) => {
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

  // ---------- Normalized payload ----------
  const payload = {
    id: raw.id,
    doi: raw.doi || null,
    title: raw.display_name || 'Untitled',
    year: raw.publication_year || null,
    date: raw.publication_date || null,
    type: raw.type || null,
    language: raw.language || null,
    venue,
    citedBy: raw.cited_by_count ?? 0,
    pages:
      raw?.biblio?.first_page && raw?.biblio?.last_page
        ? `${raw.biblio.first_page}–${raw.biblio.last_page}`
        : null,
    abstract: abstractFromInverted(raw.abstract_inverted_index),
    oaPdf: bestOaUrl,
    bestUrl: bestOaUrl || bestLanding,
    authors,
    topics: raw.topics || [],
    concepts: raw.concepts || [],
    relatedWorks: raw.related_works || [],
    referencedWorks: raw.referenced_works || [],
    countsByYear: raw.counts_by_year || []
  }

  return { item: payload }
})