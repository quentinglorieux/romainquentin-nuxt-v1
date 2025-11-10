// server/api/openalex/work.get.js
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const q = getQuery(event)

  const base = config.public.openalexBase || 'https://api.openalex.org'
  const mailto = config.public.openalexMailto || 'quentin.glorieux@lkb.upmc.fr'

  // --- Construire l'URL endpoint (par DOI prioritaire) ---
  let endpointUrl
  if (q.doi) {
    // Accepte "10.xxxx/..." ou déjà "https://doi.org/10.xxxx/..." ou "doi:10.xxxx/..."
    const doi = String(q.doi)
      .trim()
      .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
      .replace(/^doi:\s*/i, '')
    endpointUrl = `${base}/works/${encodeURIComponent(`https://doi.org/${doi}`)}`
  } else if (q.id) {
    // Accepte id OpenAlex (ex: https://openalex.org/W1234...)
    endpointUrl = `${base}/works/${encodeURIComponent(String(q.id))}`
  } else {
    setResponseStatus(event, 400)
    return { error: true, message: 'Missing query parameter: provide ?doi= or ?id=' }
  }

  // Champs autorisés par `select` (cf. message d’erreur OpenAlex)
  const select = [
    'id',
    'doi',
    'display_name',
    'publication_year',
    'type',
    'primary_location',
    'host_venue',
    'authorships',
    'open_access',
    'best_oa_location',
    'biblio',
    'cited_by_count',
    'abstract_inverted_index',
    'topics'
  ].join(',')

  const url = new URL(endpointUrl)
  url.searchParams.set('select', select)
  url.searchParams.set('mailto', mailto)

  let data
  try {
    data = await $fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        // OpenAlex demande une identification claire
        'User-Agent': `MEL-website/1.0 (+mailto:${mailto})`
      }
    })
  } catch (err) {
    setResponseStatus(event, err?.statusCode || 502)
    return {
      error: true,
      message: 'OpenAlex request failed',
      detail: (err && (err.data || err.message)) || String(err)
    }
  }

  // --- Utils ---
  function abstractFromInverted(inv) {
    if (!inv || typeof inv !== 'object') return null
    const words = []
    for (const [token, positions] of Object.entries(inv)) {
      for (const pos of positions) words[pos] = token
    }
    const text = words.join(' ').trim()
    return text || null
  }
  function normOrcid(v) {
    if (!v) return null
    return String(v).replace(/^https?:\/\/orcid\.org\//i, '').trim()
  }

  // --- Normalisation ---
  const venue =
    data?.primary_location?.source?.display_name ||
    data?.host_venue?.display_name ||
    data?.primary_location?.raw_source_name || // fallback demandé
    ''

  const oaPdf =
    data?.best_oa_location?.url_for_pdf ||
    data?.best_oa_location?.pdf_url ||
    data?.open_access?.oa_url ||
    data?.primary_location?.pdf_url ||
    null

  const bestUrl =
    oaPdf ||
    data?.best_oa_location?.landing_page_url ||
    data?.primary_location?.landing_page_url ||
    data?.doi ||
    data?.id

  const authors = (data?.authorships || []).map((a) => ({
    name: a?.author?.display_name || a?.institutions?.[0]?.display_name || 'Author',
    authorId: a?.author?.id || null,
    orcid: normOrcid(a?.author?.orcid || a?.orcid || null),
    isCorresponding: !!a?.is_corresponding
  }))

  const item = {
    id: data?.id,
    doi: data?.doi || null,
    title: data?.display_name || 'Untitled',
    year: data?.publication_year || null,
    type: data?.type || null,
    venue,
    pages:
      data?.biblio?.first_page && data?.biblio?.last_page
        ? `${data.biblio.first_page}–${data.biblio.last_page}`
        : null,
    citedBy: data?.cited_by_count ?? 0,
    oaPdf,
    bestUrl,
    abstract: abstractFromInverted(data?.abstract_inverted_index),
    topics: (data?.topics || []).map((t) => ({
      id: t?.id,
      display_name: t?.display_name
    })),
    authors
  }

  return { item }
})