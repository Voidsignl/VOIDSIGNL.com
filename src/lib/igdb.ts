// IGDB API via Twitch OAuth — https://api-docs.igdb.com/

let cachedToken: { token: string; expiresAt: number } | null = null

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  const clientId = process.env.IGDB_CLIENT_ID
  const clientSecret = process.env.IGDB_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('IGDB_CLIENT_ID / IGDB_CLIENT_SECRET not configured')
  }

  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: 'POST' }
  )
  if (!res.ok) throw new Error(`IGDB token fetch failed: ${res.status}`)
  const json = await res.json()
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in - 300) * 1000,
  }
  return cachedToken.token
}

export interface IGDBGame {
  id: number
  name: string
  summary?: string
  cover?: { url: string }
  genres?: { name: string }[]
  platforms?: { name: string }[]
  first_release_date?: number
}

export async function searchIGDB(query: string, limit = 10): Promise<IGDBGame[]> {
  const token = await getAccessToken()
  const clientId = process.env.IGDB_CLIENT_ID!

  const res = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body: `
      search "${query.replace(/"/g, '')}";
      fields id, name, summary, cover.url, genres.name, platforms.name, first_release_date;
      where category = 0 & version_parent = null;
      limit ${limit};
    `,
  })

  if (!res.ok) throw new Error(`IGDB search failed: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export function formatIGDBGame(game: IGDBGame) {
  const coverUrl = game.cover?.url
    ? 'https:' + game.cover.url.replace('t_thumb', 't_cover_big')
    : null

  return {
    igdb_id: game.id,
    name: game.name,
    cover_url: coverUrl,
    description: game.summary ?? null,
    genre: game.genres?.map(g => g.name) ?? [],
    platforms: game.platforms?.map(p => p.name) ?? [],
    release_year: game.first_release_date
      ? new Date(game.first_release_date * 1000).getFullYear()
      : null,
  }
}

/**
 * Fallback wanneer igdb_id ontbreekt: zoek IGDB op naam en geef de
 * grootste cover URL terug. Returnt null bij geen match of error
 * (silent fail — geen API key, geen netwerk, etc.).
 */
export async function fetchCoverByName(gameName: string): Promise<string | null> {
  try {
    const token = await getAccessToken()
    const clientId = process.env.IGDB_CLIENT_ID
    if (!clientId) return null

    const res = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: `
        search "${gameName.replace(/"/g, '')}";
        fields id, name, cover.url;
        where category = 0;
        limit 1;
      `,
    })
    if (!res.ok) return null

    const data = await res.json()
    const game = Array.isArray(data) ? data[0] : null
    if (!game?.cover?.url) return null

    return 'https:' + (game.cover.url as string).replace('t_thumb', 't_cover_big')
  } catch {
    return null
  }
}

/**
 * Bulk wrapper rond fetchCoverByName met batch-throttling. Respecteert
 * IGDB rate limits (4 req/s) door 5 parallel + 300ms tussen batches.
 */
export async function fetchCoversForGames(
  games: { id: string; name: string; slug: string }[],
): Promise<Record<string, string>> {
  const results: Record<string, string> = {}
  const BATCH = 5

  for (let i = 0; i < games.length; i += BATCH) {
    const batch = games.slice(i, i + BATCH)
    await Promise.all(
      batch.map(async (game) => {
        const url = await fetchCoverByName(game.name)
        if (url) results[game.id] = url
      }),
    )
    if (i + BATCH < games.length) {
      await new Promise((r) => setTimeout(r, 300))
    }
  }

  return results
}
