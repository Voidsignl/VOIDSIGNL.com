import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

interface Params {
  id: string
}

function formatPrice(amount: number, currency: string): string {
  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : ''
  return `${symbol}${amount.toFixed(2)}`
}

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { id } = await params
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data } = await supabase
    .from('market_listings')
    .select('title, description, price, currency, images, category, status')
    .eq('id', id)
    .eq('status', 'active')
    .maybeSingle()

  if (!data) {
    return {
      title: 'Listing not found · VOIDSIGNL Market',
      description: 'This listing is no longer available.',
    }
  }

  const price = formatPrice(Number(data.price), data.currency)
  const title = `${data.title} · ${price} · VOIDSIGNL Market`
  const description =
    data.description?.slice(0, 160) ||
    `${data.category.toUpperCase()} listing on VOIDSIGNL — only for those who know.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: (data.images?.[0]) ? [{ url: data.images[0] }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: (data.images?.[0]) ? [data.images[0]] : undefined,
    },
  }
}

export default function ListingLayout({ children }: { children: React.ReactNode }) {
  return children
}
