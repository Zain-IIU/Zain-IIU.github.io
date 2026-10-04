import { supabase, MEDIA_BUCKET, mediaUrl } from '../lib/supabase'

/**
 * Grab a still from a local video File, entirely in the browser.
 *
 * This runs against a blob: URL made from the File the user just picked, so
 * there is no network round-trip and no CORS to negotiate. It means every
 * upload gets a poster automatically — and the poster is what makes the shelf
 * look finished before a single byte of video moves.
 */
export function posterFromVideo(file: File, atSeconds = 1): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.src = url

    const cleanup = () => URL.revokeObjectURL(url)

    const fail = (why: string) => {
      cleanup()
      reject(new Error(why))
    }

    video.onerror = () => fail('That video could not be decoded in the browser.')

    video.onloadeddata = () => {
      // Seek a little way in: frame zero is often a black or loading frame.
      video.currentTime = Math.min(atSeconds, Math.max(0, (video.duration || 1) - 0.1))
    }

    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) return fail('Could not get a canvas to draw the poster on.')

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          cleanup()
          if (blob) resolve(blob)
          else reject(new Error('Could not encode the poster image.'))
        },
        'image/jpeg',
        0.82,
      )
    }
  })
}

/** Upload one file to the media bucket and return its public URL. */
export async function uploadToMedia(path: string, body: Blob, contentType: string): Promise<string> {
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, body, {
    contentType,
    upsert: true,
    cacheControl: '31536000',
  })
  if (error) throw error
  return mediaUrl(path)
}

export interface UploadResult {
  videoUrl: string
  posterUrl: string
  bytes: number
}

/**
 * The whole capture pipeline for one game: derive a poster, upload both,
 * return the two public URLs for the editor to save on the row.
 */
export async function uploadCapture(slug: string, file: File): Promise<UploadResult> {
  const stamp = Date.now()
  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4'

  const poster = await posterFromVideo(file)

  const [videoUrl, posterUrl] = await Promise.all([
    uploadToMedia(`captures/${slug}-${stamp}.${ext}`, file, file.type || 'video/mp4'),
    uploadToMedia(`posters/${slug}-${stamp}.jpg`, poster, 'image/jpeg'),
  ])

  return { videoUrl, posterUrl, bytes: file.size }
}

/**
 * Upload any single file (photo, CV) under a stable prefix. The timestamp in
 * the name means a replacement never collides with a cached copy of the old
 * one — browsers and CDNs key on the URL, so reusing the name would serve the
 * stale file for as long as the cache lives.
 */
export async function uploadAsset(prefix: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const path = `${prefix}/${Date.now()}.${ext}`
  return uploadToMedia(path, file, file.type || 'application/octet-stream')
}

export function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}
