'use client'

/**
 * QR code modal for sharing a profile URL — useful at offline gaming events.
 */
import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { QrCode, Copy, Check } from 'lucide-react'
import { Sheet } from '@/components/ui/sheet'

interface ProfileQRProps {
  username: string
  displayName?: string | null
}

export function ProfileQR({ username, displayName }: ProfileQRProps) {
  const [open, setOpen] = useState(false)
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  const url = origin ? `${origin}/profile/${username}` : `/profile/${username}`

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="vs-btn vs-btn-ghost text-xs"
        title="Share profile QR code"
        aria-label="Share profile"
      >
        <QrCode size={13} /> Share
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="max-w-xs"
        title={<span className="flex items-center gap-2"><QrCode size={16} className="text-purple-light" /> Share profile</span>}
      >
        <div className="p-5 flex flex-col items-center gap-4">
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <QRCodeSVG
              value={url}
              size={200}
              level="M"
              includeMargin={false}
              fgColor="#0e0e12"
              bgColor="#ffffff"
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">{displayName || `@${username}`}</p>
            <p className="vs-counter text-[10px] text-text-dim mt-0.5 tabular-nums break-all">
              {url.replace(/^https?:\/\//, '')}
            </p>
          </div>
          <button
            onClick={copyUrl}
            className="vs-btn vs-btn-primary text-sm w-full"
          >
            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy link</>}
          </button>
        </div>
      </Sheet>
    </>
  )
}
