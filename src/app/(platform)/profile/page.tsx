'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { ScopeSpinner } from '@/components/ui/loader'

export default function ProfileRedirect() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function redirect() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single()
      if (data?.username) {
        router.replace(`/profile/${data.username}`)
      }
    }
    redirect()
  }, [])

  return (
    <div className="flex items-center justify-center h-64">
      <ScopeSpinner size={28} />
    </div>
  )
}
