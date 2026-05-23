'use client'

const DAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00']

export interface AvailabilitySlot {
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

interface CoachAvailabilityCalendarProps {
  slots: AvailabilitySlot[]
  onSelectSlot?: (day: number, time: string) => void
  readonly?: boolean
}

export default function CoachAvailabilityCalendar({
  slots, onSelectSlot, readonly = true,
}: CoachAvailabilityCalendarProps) {

  function isAvailable(day: number, time: string) {
    return slots.some(s =>
      s.day_of_week === day &&
      s.is_active &&
      s.start_time <= time &&
      s.end_time > time
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        <div className="grid grid-cols-8 gap-1 mb-2">
          <div />
          {DAYS.map(day => (
            <div key={day} className="text-center font-mono text-[10px] text-text-dim uppercase tracking-wider py-1">
              {day}
            </div>
          ))}
        </div>

        {TIME_SLOTS.map(time => (
          <div key={time} className="grid grid-cols-8 gap-1 mb-1">
            <div className="font-mono text-[9px] text-text-dim/60 flex items-center pr-2">
              {time}
            </div>
            {DAYS.map((_, dayIdx) => {
              const available = isAvailable(dayIdx, time)
              return (
                <button
                  key={dayIdx}
                  onClick={() => !readonly && onSelectSlot?.(dayIdx, time)}
                  disabled={readonly && !available}
                  className={`h-7 rounded transition-colors duration-200 ${
                    available
                      ? 'bg-purple/30 border border-purple/50 hover:bg-purple/50'
                      : 'bg-void border border-transparent'
                  } ${!readonly ? 'cursor-pointer' : ''}`}
                />
              )
            })}
          </div>
        ))}

        <div className="flex items-center gap-3 mt-3">
          <div className="w-4 h-4 rounded bg-purple/30 border border-purple/50" />
          <span className="font-mono text-[10px] text-text-dim">Beschikbaar</span>
        </div>
      </div>
    </div>
  )
}
