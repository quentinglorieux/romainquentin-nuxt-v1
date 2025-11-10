// server/api/openalex/by-dois.post.js
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validation basique
  const input = Array.isArray(body?.dois) ? body.dois : []
  const cleaned = input
    .map((x) => (x == null ? null : String(x).trim()))
    .filter(Boolean)
    // "doi:10.x..." -> "10.x...", "https://doi.org/10.x..." -> "10.x..."
    .map((s) => s.replace(/^doi:\s*/i, '').replace(/^https?:\/\/(dx\.)?doi\.org\//i, ''))

  if (!cleaned.length) {
    return { items: [], errors: [] }
  }

  // Déduplication en gardant l’ordre
  const seen = new Set()
  const unique = []
  for (const d of cleaned) {
    if (!seen.has(d)) {
      seen.add(d)
      unique.push(d)
    }
  }

  // Résolution parallèle avec tolérance aux erreurs
  const results = await Promise.allSettled(
    unique.map((doi) =>
      // On réutilise l’endpoint unitaire pour garder la même normalisation
      $fetch('/api/openalex/work', {
        params: { doi },
        // Important pour dev en Nitro: assure la résolution côté serveur
        baseURL: undefined
      }).then((res) => ({ doi, res }))
    )
  )



  const items = []
  const errors = []

  for (const r of results) {
    if (r.status === 'fulfilled') {
      const item = r.value?.res?.item
      if (item) {
        items.push(item)
      } else {
        errors.push({ doi: r.value?.doi, message: 'Item vide' })
      }
    } else {
      // Rechercher le DOI depuis la raison si possible
      const msg = String(r.reason?.message || r.reason || 'Erreur inconnue')
      // On ne perd pas l’ordre: on peut pousser un placeholder si besoin
      errors.push({ doi: null, message: msg })
    }
  }

  // Préserver l’ordre d’entrée (unique) dans items
  // On crée une map id→item pour trier selon l’ordre des DOIs donnés
  const byBestKey = new Map()
  for (const it of items) {
    // Clés candidates pour associer l’item au DOI de départ
    const doiBare = it.doi
      ? String(it.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
      : null
    if (doiBare) byBestKey.set(doiBare, it)
  }

  const ordered = unique
    .map((d) => byBestKey.get(d))
    .filter(Boolean)

  return { items: ordered, errors }
})