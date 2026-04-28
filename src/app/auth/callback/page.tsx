'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { ensureUserRecord } from '@/lib/api'

function setSessionCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = 'sq-session=1; path=/; max-age=31536000; samesite=lax'
  }
}

function CallbackInner() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const code = params.get('code')
    const status = params.get('status')
    const igHandle = params.get('ig_handle')
    const igAccessToken = params.get('ig_access_token')

    if (code) {
      // Supabase OAuth / magic link PKCE callback
      supabase.auth.exchangeCodeForSession(code).then(async ({ data, error }) => {
        if (error || !data.session) {
          router.replace('/sign-in?error=oauth_failed')
          return
        }
        setSessionCookie()

        // Check if this is a brand-new user
        const { data: existing } = await supabase
          .from('users')
          .select('id, display_name')
          .eq('id', data.session.user.id)
          .single()

        const isNew = !existing

        await ensureUserRecord(data.session.user.id)

        // If this came from Instagram login, save the handle
        if (igHandle) {
          await supabase.from('users').update({
            instagram_handle: igHandle,
            ...(igAccessToken ? { instagram_token: igAccessToken } : {}),
            display_name: igHandle,
          }).eq('id', data.session.user.id)
        }

        router.replace(isNew ? '/onboarding' : '/feed')
      })
    } else if (status === 'success') {
      // Quest Engine Instagram connection callback
      router.replace('/profile?connected=1')
    } else {
      router.replace('/profile?error=instagram_failed')
    }
  }, [params, router])

  return (
    <div className="flex h-screen items-center justify-center bg-parchment dark:bg-ink">
      <p className="font-serif italic text-2xl text-ink/60 dark:text-parchment/60">connecting…</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-parchment dark:bg-ink">
        <p className="font-serif italic text-2xl text-ink/60 dark:text-parchment/60">connecting…</p>
      </div>
    }>
      <CallbackInner />
    </Suspense>
  )
}
