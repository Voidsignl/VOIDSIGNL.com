import Image from 'next/image'

export interface ChatMessage {
  id: string
  content: string
  message_type: string
  media_url?: string | null
  gif_url?: string | null
  sticker_id?: string | null
  is_read?: boolean
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
  isFirstInGroup?: boolean
  isLastInGroup?: boolean
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * WhatsApp-stijl read receipts. ✓ = verzonden, ✓✓ = gelezen door ontvanger
 * (kleurt cyan zodra read=true). Alleen tonen op eigen messages.
 */
function ReadReceiptIcon({ read }: { read: boolean }) {
  const color = read ? '#00C8F0' : 'currentColor'
  return (
    <svg
      width="14"
      height="10"
      viewBox="0 0 16 11"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label={read ? 'Gelezen' : 'Verzonden'}
    >
      {/* Eerste vinkje */}
      <polyline points="1,6 4.5,9 11,2.5" />
      {/* Tweede vinkje — alleen tonen bij read */}
      {read && <polyline points="5,6 8.5,9 15,2.5" />}
    </svg>
  )
}

export default function MessageBubble({
  message,
  isOwn,
  isFirstInGroup = true,
  isLastInGroup = true,
}: MessageBubbleProps) {
  const accentColor = message.sender?.accent_color ?? '#6B3FE0'
  const isText = message.message_type === 'text'

  // WhatsApp-stijl tail: alleen op de laatste bubble van een sequence,
  // aan de zijkant van de afzender (rechtsonder voor jezelf, linksonder
  // voor de ander). Anders gewoon symmetrisch rond.
  const radius = isLastInGroup
    ? isOwn
      ? '18px 18px 4px 18px'
      : '18px 18px 18px 4px'
    : '18px'

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
        isFirstInGroup ? 'mt-3' : 'mt-0.5'
      }`}
    >
      {/* Avatar slot links: alleen tonen op de LAATSTE bubble van een
          sequence van de ander. Zo voelt het zoals WhatsApp/Telegram. */}
      {!isOwn && (
        <div className="w-8 flex-shrink-0 flex items-end mr-1.5">
          {isLastInGroup && message.sender ? (
            <div
              className="w-7 h-7 rounded-full overflow-hidden bg-surface-2 border"
              style={{ borderColor: accentColor }}
            >
              {message.sender.avatar_url ? (
                <Image
                  src={message.sender.avatar_url}
                  alt={message.sender.username}
                  width={28}
                  height={28}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[9px] font-mono text-text-dim">
                    {message.sender.username?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {isText ? (
          <div
            className="relative px-3 py-1.5 text-sm leading-relaxed shadow-sm"
            style={{
              background: isOwn ? accentColor : '#1f1f28',
              color: '#ffffff',
              borderRadius: radius,
            }}
          >
            <span className="whitespace-pre-wrap break-words">{message.content}</span>
            {/* WhatsApp-stijl meta inline rechtsonder: tijd + read receipts */}
            <span
              className="ml-2 inline-flex items-center gap-0.5 align-bottom font-mono text-[10px]"
              style={{
                color: isOwn ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.45)',
                lineHeight: 1,
              }}
            >
              {formatTime(message.created_at)}
              {isOwn && (
                <ReadReceiptIcon read={!!message.is_read} />
              )}
            </span>
          </div>
        ) : message.message_type === 'image' && message.media_url ? (
          <div className="relative">
            <div
              className="relative overflow-hidden bg-void shadow-sm"
              style={{ borderRadius: radius }}
            >
              <Image
                src={message.media_url}
                alt="Afbeelding"
                width={240}
                height={180}
                className="object-cover"
              />
            </div>
            <span className="absolute bottom-1.5 right-1.5 font-mono text-[10px] text-white bg-black/55 backdrop-blur-sm rounded-full px-1.5 py-0.5 leading-none">
              {formatTime(message.created_at)}
            </span>
          </div>
        ) : message.message_type === 'gif' && message.gif_url ? (
          <div className="relative">
            <div
              className="overflow-hidden max-w-[200px] shadow-sm"
              style={{ borderRadius: radius }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={message.gif_url} alt="GIF" className="w-full" />
            </div>
            <span className="absolute bottom-1.5 right-1.5 font-mono text-[10px] text-white bg-black/55 backdrop-blur-sm rounded-full px-1.5 py-0.5 leading-none">
              {formatTime(message.created_at)}
            </span>
          </div>
        ) : message.message_type === 'sticker' && message.sticker_id ? (
          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
            <div className="w-28 h-28 relative">
              <Image
                src={`/stickers/${message.sticker_id.replace('void_', 'void-')}.svg`}
                alt="Sticker"
                fill
                sizes="112px"
                className="object-contain drop-shadow-md"
              />
            </div>
            <span className="font-mono text-[10px] text-text-dim mt-0.5 px-1">
              {formatTime(message.created_at)}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
