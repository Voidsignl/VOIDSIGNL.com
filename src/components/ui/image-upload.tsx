'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Camera, X, Upload, Loader2 } from 'lucide-react'

interface ImageUploadProps {
  bucket: 'avatars' | 'banners'
  userId: string
  currentUrl: string | null
  onUpload: (url: string) => void
  type: 'avatar' | 'banner'
}

export function ImageUpload({ bucket, userId, currentUrl, onUpload, type }: ImageUploadProps) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate
    const maxSize = bucket === 'avatars' ? 2 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert(`File too large. Max ${bucket === 'avatars' ? '2MB' : '5MB'}`)
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      alert('Only JPEG, PNG, WebP, and GIF are allowed')
      return
    }

    // Preview
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    const ext = file.name.split('.').pop()
    const filePath = `${userId}/${type}-${Date.now()}.${ext}`

    // Delete old file if exists
    if (currentUrl) {
      const oldPath = currentUrl.split('/storage/v1/object/public/')[1]
      if (oldPath) {
        const [oldBucket, ...rest] = oldPath.split('/')
        await supabase.storage.from(oldBucket).remove([rest.join('/')])
      }
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true })

    if (error) {
      alert('Upload failed: ' + error.message)
      setUploading(false)
      setPreview(null)
      return
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    // Update profile
    const updateField = type === 'avatar' ? 'avatar_url' : 'banner_url'
    await supabase.from('profiles').update({ [updateField]: publicUrl }).eq('id', userId)

    onUpload(publicUrl)
    setUploading(false)
    setPreview(null)
  }

  if (type === 'avatar') {
    return (
      <div className="relative group">
        <div className="w-20 h-20 rounded-xl bg-purple/30 border-4 border-surface flex items-center justify-center text-2xl font-bold text-purple overflow-hidden">
          {(currentUrl || preview) ? (
            // Preview is een data-URL (FileReader) — Image moet unoptimized zijn.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview || currentUrl!} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            '?'
          )}
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          {uploading ? (
            <Loader2 size={18} className="text-white animate-spin" />
          ) : (
            <Camera size={18} className="text-white" />
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFile} className="hidden" />
      </div>
    )
  }

  // Banner
  return (
    <div className="relative group h-28 bg-gradient-to-br from-purple/20 via-surface-2 to-cyan/10 overflow-hidden">
      {(currentUrl || preview) && (
        // Preview is een data-URL (FileReader).
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview || currentUrl!} alt="Banner" className="w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-void/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-void/90"
      >
        {uploading ? (
          <Loader2 size={14} className="text-white animate-spin" />
        ) : (
          <Camera size={14} className="text-white" />
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
    </div>
  )
}
