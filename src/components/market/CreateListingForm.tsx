'use client'

/**
 * Inline form to create a market_listings row.
 * Supabase storage: market-images public; market-files private.
 * Path convention: market-images/<user_id>/<random>.<ext>
 *                  market-files/<user_id>/<listing_id>/<filename>
 *
 * For digital category, file is uploaded AFTER listing insert so we can
 * scope path with listing id (matches the storage RLS policy).
 */
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { Game, MarketCategory, MarketSeller } from '@/types'
import { MARKET_CATEGORIES } from '@/types'
import { Upload, X, Loader2, Image as ImageIcon, FileLock2 } from 'lucide-react'

interface CreateListingFormProps {
  seller: MarketSeller
  games: Game[]
  onCreated: () => void
}

const ACCEPTED_IMG = 'image/jpeg,image/png,image/webp,image/gif'
const MAX_IMG_BYTES = 5 * 1024 * 1024
const MAX_FILE_BYTES = 50 * 1024 * 1024
const MAX_IMAGES = 6

export function CreateListingForm({ seller, games, onCreated }: CreateListingFormProps) {
  const supabase = createClient()
  const [category, setCategory] = useState<MarketCategory>('digital')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState<string>('')
  const [stock, setStock] = useState<string>('1')
  const [gameId, setGameId] = useState<string>('')
  const [tagsInput, setTagsInput] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [digitalFile, setDigitalFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string>('')

  useEffect(() => {
    return () => imagePreviews.forEach(u => URL.revokeObjectURL(u))
  }, [imagePreviews])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    e.target.value = '' // reset to allow re-selecting same file
    if (!files.length) return
    const total = imageFiles.length + files.length
    if (total > MAX_IMAGES) {
      setError(`Max ${MAX_IMAGES} images`)
      return
    }
    for (const f of files) {
      if (f.size > MAX_IMG_BYTES) {
        setError(`Image ${f.name} exceeds 5 MB`)
        return
      }
    }
    setError(null)
    setImageFiles(prev => [...prev, ...files])
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  function removeImage(idx: number) {
    URL.revokeObjectURL(imagePreviews[idx])
    setImageFiles(prev => prev.filter((_, i) => i !== idx))
    setImagePreviews(prev => prev.filter((_, i) => i !== idx))
  }

  function handleDigitalFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > MAX_FILE_BYTES) {
      setError('File exceeds 50 MB limit')
      return
    }
    setError(null)
    setDigitalFile(f)
  }

  async function uploadImage(file: File): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const safeName = `${crypto.randomUUID()}.${ext}`
    const path = `${seller.user_id}/${safeName}`
    const { error: upErr } = await supabase.storage.from('market-images').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })
    if (upErr) throw upErr
    const { data } = supabase.storage.from('market-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function uploadDigital(file: File, listingId: string): Promise<string> {
    const ext = file.name.split('.').pop() || 'bin'
    const safeName = `${crypto.randomUUID()}.${ext}`
    const path = `${seller.user_id}/${listingId}/${safeName}`
    const { error: upErr } = await supabase.storage.from('market-files').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    })
    if (upErr) throw upErr
    return path
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const priceNum = Number(price)
    const stockNum = Number(stock)
    if (!title.trim() || title.length < 3) return setError('Title must be at least 3 characters')
    if (!Number.isFinite(priceNum) || priceNum <= 0) return setError('Price must be greater than zero')
    if (!Number.isFinite(stockNum) || stockNum < 0) return setError('Stock cannot be negative')
    if (category === 'digital' && !digitalFile) return setError('Upload the digital file (or change category)')

    setSubmitting(true)
    try {
      // 1. Upload images first
      let imageUrls: string[] = []
      if (imageFiles.length > 0) {
        setProgress('Uploading images...')
        imageUrls = await Promise.all(imageFiles.map(uploadImage))
      }

      // 2. Insert listing (without file_url)
      setProgress('Creating listing...')
      const tags = tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 12)

      const { data: inserted, error: insertErr } = await supabase
        .from('market_listings')
        .insert({
          seller_id: seller.id,
          category,
          title: title.trim(),
          description: description.trim() || null,
          price: priceNum,
          stock: stockNum,
          game_id: gameId || null,
          tags,
          images: imageUrls,
        })
        .select('id')
        .single()
      if (insertErr || !inserted) throw insertErr || new Error('Insert failed')

      // 3. For digital, upload file scoped to listing id, then update file_url
      if (category === 'digital' && digitalFile) {
        setProgress('Uploading digital file...')
        const filePath = await uploadDigital(digitalFile, inserted.id)
        await supabase.from('market_listings').update({ file_url: filePath }).eq('id', inserted.id)
      }

      setProgress('')
      // Reset form
      setTitle('')
      setDescription('')
      setPrice('')
      setStock('1')
      setGameId('')
      setTagsInput('')
      imagePreviews.forEach(u => URL.revokeObjectURL(u))
      setImageFiles([])
      setImagePreviews([])
      setDigitalFile(null)
      onCreated()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Submission failed'
      setError(msg)
    } finally {
      setSubmitting(false)
      setProgress('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="vs-card vs-lit space-y-4">
      <p className="vs-label">NEW LISTING</p>

      {/* Category */}
      <div>
        <label className="vs-label block mb-1">CATEGORY</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(MARKET_CATEGORIES) as MarketCategory[]).map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              data-active={category === c}
              className="vs-tab justify-center"
            >
              {MARKET_CATEGORIES[c].label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="vs-label block mb-1">TITLE *</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={120}
          placeholder="What are you selling?"
          className="vs-input text-sm"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="vs-label block mb-1">DESCRIPTION</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={4000}
          placeholder="Details, condition, what's included..."
          className="vs-input text-sm resize-none min-h-[100px]"
          rows={5}
        />
        <p className="text-[10px] text-text-dim mt-1 tabular-nums">{description.length} / 4000</p>
      </div>

      {/* Price + stock */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="vs-label block mb-1">PRICE (€) *</label>
          <input
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            min={0.01}
            max={100000}
            step={0.01}
            placeholder="0.00"
            className="vs-input text-sm tabular-nums"
            required
          />
        </div>
        <div>
          <label className="vs-label block mb-1">STOCK</label>
          <input
            type="number"
            value={stock}
            onChange={e => setStock(e.target.value)}
            min={0}
            max={9999}
            step={1}
            className="vs-input text-sm tabular-nums"
          />
        </div>
      </div>

      {/* Game */}
      <div>
        <label className="vs-label block mb-1">GAME (optional)</label>
        <select value={gameId} onChange={e => setGameId(e.target.value)} className="vs-input text-sm">
          <option value="">No game</option>
          {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="vs-label block mb-1">TAGS</label>
        <input
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
          placeholder="overlay, stream, dark-mode"
          className="vs-input text-sm"
        />
        <p className="text-[10px] text-text-dim mt-1">Comma-separated · max 12</p>
      </div>

      {/* Images */}
      <div>
        <label className="vs-label block mb-2">IMAGES (max {MAX_IMAGES} · 5 MB each)</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {imagePreviews.map((src, i) => (
            <div key={src} className="relative aspect-square rounded-lg overflow-hidden bg-surface-2 border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-void/80 flex items-center justify-center text-white hover:bg-danger/80"
              >
                <X size={11} />
              </button>
            </div>
          ))}
          {imagePreviews.length < MAX_IMAGES && (
            <label className="aspect-square rounded-lg border border-dashed border-border hover:border-purple-light hover:bg-purple/5 cursor-pointer flex items-center justify-center transition-colors">
              <input type="file" multiple accept={ACCEPTED_IMG} onChange={handleImageChange} className="hidden" />
              <ImageIcon size={20} className="text-text-dim" />
            </label>
          )}
        </div>
      </div>

      {/* Digital file */}
      {category === 'digital' && (
        <div>
          <label className="vs-label block mb-2">DIGITAL FILE * (max 50 MB)</label>
          {digitalFile ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-border">
              <div className="flex items-center gap-2 min-w-0">
                <FileLock2 size={14} className="text-purple-light shrink-0" />
                <span className="text-xs truncate">{digitalFile.name}</span>
                <span className="text-[10px] text-text-dim shrink-0 tabular-nums">
                  {(digitalFile.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
              <button type="button" onClick={() => setDigitalFile(null)} className="text-text-dim hover:text-danger">
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="block w-full p-4 rounded-lg border border-dashed border-border hover:border-purple-light hover:bg-purple/5 cursor-pointer transition-colors text-center">
              <input type="file" onChange={handleDigitalFile} className="hidden" />
              <Upload size={18} className="mx-auto text-text-dim mb-1" />
              <p className="text-xs text-text-muted">Click to select file (private — buyer-only after purchase)</p>
            </label>
          )}
        </div>
      )}

      {error && <p className="text-xs text-danger p-2 bg-danger-dim rounded">{error}</p>}
      {progress && <p className="text-xs text-text-muted flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> {progress}</p>}

      <button type="submit" disabled={submitting} className="vs-btn vs-btn-primary text-sm w-full disabled:opacity-50 disabled:cursor-not-allowed">
        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {submitting ? 'Publishing...' : 'Publish listing'}
      </button>
    </form>
  )
}
