export default function MessagesPage() {
  // Op desktop wordt deze page in de rechterkolom van /messages/layout.tsx
  // gerenderd als 'lege staat'. Op mobiel verbergt de layout deze
  // panel-kolom — dan zie je alleen de conversation list uit de sidebar.
  return (
    <div
      className="flex-1 flex items-center justify-center"
      style={{
        backgroundImage:
          'radial-gradient(rgba(107,63,224,0.06) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      <div className="text-center px-6 max-w-sm">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-purple/8 border border-purple/15 flex items-center justify-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-purple"
          >
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </div>
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-purple mb-2">
          Berichten
        </p>
        <h2 className="font-mono text-lg font-bold text-text mb-2">
          Begin een gesprek
        </h2>
        <p className="text-text-muted text-sm leading-relaxed">
          Kies een conversatie uit de lijst, of klik op de + knop om iemand
          een nieuw bericht te sturen.
        </p>
      </div>
    </div>
  )
}
