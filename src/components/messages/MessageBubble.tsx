import Image from 'next/image'

export interface ChatMessage {
  id: string
  content: string
  message_type: string
  media_url?: string | null
  gif_url?: string | null
  sticker_id?: string | null
  created_at: string
  sender_id?: string
  sender: {
    id: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
    accent_color?: string | null
  } | null
}

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
  showAvatar: boolean
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ message, isOwn, showAvatar }: MessageBubbleProps) {
  const accentColor = message.sender?.accent_color ?? '#6B3FE0'

  return (
    <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && (
        <div className="flex-shrink-0 w-7 h-7">
          {showAvatar && message.sender && (
            <div className="relative w-7 h-7 rounded-full overflow-hidden bg-surface-2 border"
              style={{ borderColor: accentColor }}>
              {message.sender.avatar_url ? (
                <Image src={message.sender.avatar_url} alt={message.sender.username}
                  fill sizes="28px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[9px] font-mono text-text-dim">
                    {message.sender.username?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isOwn && showAvatar && message.sender && (
          <span className="font-mono text-[10px] text-text-dim mb-1 ml-1">
            {message.sender.display_name ?? message.sender.username}
          </span>
        )}

        {message.message_type === 'text' && (
          <div
            className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
            style={{
              background: isOwn ? accentColor : '#24242e',
              color: '#ffffff',
              borderBottomRightRadius: isOwn ? '4px' : '16px',
              borderBottomLeftRadius: isOwn ? '16px' : '4px',
            }}
          >
            {message.content}
          </div>
        )}

        {message.message_type === 'image' && message.media_url && (
          <div className="relative rounded-xl overflow-hidden max-w-[240px] aspect-[4/3] bg-void">
            <Image src={message.media_url} alt="Afbeelding" fill sizes="240px" className="object-cover" />
          </div>
        )}

        {message.message_type === 'gif' && message.gif_url && (
          <div className="rounded-xl overflow-hidden max-w-[200px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={message.gif_url} alt="GIF" className="w-full" />
          </div>
        )}

        {message.message_type === 'sticker' && message.sticker_id && (
          <div className="w-20 h-20 relative">
            <Image
              src={`/stickers/${message.sticker_id.replace('void_', 'void-')}.svg`}
              alt="Sticker"
              fill
              sizes="80px"
              className="object-contain"
            />
          </div>
        )}

        <span className="font-mono text-[9px] text-text-dim/60 mt-1 px-1">
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  )
}
