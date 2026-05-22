/**
 * Tenor GIF / Sticker search service.
 * Uses Tenor API v2 (Google) — free tier, no library needed.
 * Docs: https://developers.google.com/tenor/guides/quickstart
 */

// Free Tenor API key — rate-limited but sufficient for a mobile app
const TENOR_API_KEY = 'AIzaSyAQvdrPMHn3L04uXHCCYh9aE2ynJLv8qJI';
const BASE_URL = 'https://tenor.googleapis.com/v2';

export interface TenorMedia {
  id: string;
  url: string;        // Full-size media URL
  previewUrl: string;  // Thumbnail for grid
  width: number;
  height: number;
}

interface TenorResult {
  results: TenorMedia[];
  next: string; // pagination token
}

/**
 * Map a raw Tenor API result to our TenorMedia shape
 */
function mapResults(data: any): TenorMedia[] {
  return (data.results || []).map((item: any) => {
    const gif = item.media_formats?.gif || item.media_formats?.mediumgif || {};
    const preview = item.media_formats?.tinygif || item.media_formats?.nanogif || gif;
    return {
      id: item.id,
      url: gif.url || '',
      previewUrl: preview.url || gif.url || '',
      width: gif.dims?.[0] || 220,
      height: gif.dims?.[1] || 220,
    };
  }).filter((m: TenorMedia) => m.url);
}

/**
 * Search for GIFs
 */
export async function searchGifs(query: string, limit = 20, pos?: string): Promise<TenorResult> {
  const params = new URLSearchParams({
    key: TENOR_API_KEY,
    q: query,
    limit: String(limit),
    media_filter: 'gif,tinygif',
    contentfilter: 'medium',
  });
  if (pos) params.append('pos', pos);

  const res = await fetch(`${BASE_URL}/search?${params}`);
  const data = await res.json();
  return { results: mapResults(data), next: data.next || '' };
}

/**
 * Get trending GIFs
 */
export async function trendingGifs(limit = 20, pos?: string): Promise<TenorResult> {
  const params = new URLSearchParams({
    key: TENOR_API_KEY,
    limit: String(limit),
    media_filter: 'gif,tinygif',
    contentfilter: 'medium',
  });
  if (pos) params.append('pos', pos);

  const res = await fetch(`${BASE_URL}/featured?${params}`);
  const data = await res.json();
  return { results: mapResults(data), next: data.next || '' };
}

/**
 * Search for stickers
 */
export async function searchStickers(query: string, limit = 20, pos?: string): Promise<TenorResult> {
  const params = new URLSearchParams({
    key: TENOR_API_KEY,
    q: query,
    searchfilter: 'sticker',
    limit: String(limit),
    media_filter: 'gif,tinygif',
    contentfilter: 'medium',
  });
  if (pos) params.append('pos', pos);

  const res = await fetch(`${BASE_URL}/search?${params}`);
  const data = await res.json();
  return { results: mapResults(data), next: data.next || '' };
}

/**
 * Get trending stickers
 */
export async function trendingStickers(limit = 20, pos?: string): Promise<TenorResult> {
  const params = new URLSearchParams({
    key: TENOR_API_KEY,
    searchfilter: 'sticker',
    limit: String(limit),
    media_filter: 'gif,tinygif',
    contentfilter: 'medium',
  });
  if (pos) params.append('pos', pos);

  const res = await fetch(`${BASE_URL}/featured?${params}`);
  const data = await res.json();
  return { results: mapResults(data), next: data.next || '' };
}
