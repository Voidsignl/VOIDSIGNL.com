import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('avatar') as File | null

    if (!file)
      return NextResponse.json({ error: 'Geen bestand' }, { status: 400 })
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Max 2MB' }, { status: 400 })
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return NextResponse.json(
        { error: 'Alleen JPG, PNG of WebP' },
        { status: 400 },
      )
    }

    const ext = file.name.split('.').pop() ?? 'png'
    const path = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)

    // Cache-buster zodat browsers de nieuwe versie pakken
    const url = `${urlData.publicUrl}?t=${Date.now()}`

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({ error: 'Upload mislukt' }, { status: 500 })
  }
}
