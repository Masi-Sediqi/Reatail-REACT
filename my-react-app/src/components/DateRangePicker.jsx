import { useEffect, useRef, useState } from 'react'
import { CalendarDays } from './Icons.jsx'

const formatDateInput = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDateInput = (value) => (value ? new Date(`${value}T12:00:00`) : null)

const formatShortDate = (value) => {
  const date = parseDateInput(value)
  return date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''
}

function DateRangePicker({ className = '', end, onChange, start, t }) {
  const rootRef = useRef(null)
  const initialMonth = parseDateInput(start) || parseDateInput(end) || new Date()
  const [open, setOpen] = useState(false)
  const [monthDate, setMonthDate] = useState(initialMonth)

  useEffect(() => {
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const firstGridDay = new Date(monthStart)
  firstGridDay.setDate(firstGridDay.getDate() - firstGridDay.getDay())
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstGridDay)
    date.setDate(firstGridDay.getDate() + index)
    return date
  })
  const startDate = parseDateInput(start)
  const endDate = parseDateInput(end)
  const label = start && end
    ? `${formatShortDate(start)} - ${formatShortDate(end)}`
    : start
      ? formatShortDate(start)
      : (t.selectDateRange ?? 'Select date range')

  const selectDate = (date) => {
    const value = formatDateInput(date)
    if (!start || (start && end)) {
      onChange({ start: value, end: '' })
      return
    }
    const currentStart = parseDateInput(start)
    if (date < currentStart) onChange({ start: value, end: start })
    else onChange({ start, end: value })
  }

  return (
    <div className={`date-range-picker ${className}`.trim()} ref={rootRef}>
      <button className="date-range-btn" type="button" onClick={() => setOpen((current) => !current)}>
        <CalendarDays size={16} />
        <span>{label}</span>
      </button>
      {open && (
        <div className="date-range-calendar">
          <div className="calendar-head">
            <button type="button" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}>{'<'}</button>
            <strong>{monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong>
            <button type="button" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}>{'>'}</button>
          </div>
          <div className="calendar-weekdays">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="calendar-days">
            {days.map((date) => {
              const value = formatDateInput(date)
              const inMonth = date.getMonth() === monthDate.getMonth()
              const isStart = value === start
              const isEnd = value === end
              const selected = isStart || isEnd
              const inRange = startDate && endDate && date >= startDate && date <= endDate
              return (
                <button
                  className={`${inMonth ? '' : 'muted'} ${selected ? 'selected' : ''} ${isStart ? 'range-start' : ''} ${isEnd ? 'range-end' : ''} ${inRange ? 'in-range' : ''}`}
                  key={value}
                  type="button"
                  onClick={() => selectDate(date)}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default DateRangePicker
