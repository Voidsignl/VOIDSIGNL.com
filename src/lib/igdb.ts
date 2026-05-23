// IGDB API via Twitch OAuth — https://api-docs.igdb.com/

let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
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
