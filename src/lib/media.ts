import type { Media } from '@/payload-types'

export type MediaSize = 'thumbnail' | 'square' | 'small' | 'full'

export function getMediaUrl(
  media: string | Media | null | undefined,
  size: MediaSize = 'thumbnail',
): string | null {
  if (!media || typeof media === 'string') return null

  if (size === 'full') return media.url ?? null

  const sized = media.sizes?.[size]?.url
  if (sized) return sized

  if (size === 'thumbnail' && media.thumbnailURL) return media.thumbnailURL

  return media.url ?? null
}
