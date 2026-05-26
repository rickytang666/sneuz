import { describe, it, expect } from 'vitest'
import {
  mapDbSessionToSleepSession,
  getMinutesFromMidnight,
  timeStringToMinutes,
  minutesToTimeString,
  isLateBedtime,
} from './sleep-utils'

describe('mapDbSessionToSleepSession', () => {
  it('maps id and times', () => {
    const result = mapDbSessionToSleepSession({
      id: 'abc',
      start_time: '2026-01-01T23:00:00Z',
      end_time: '2026-01-02T07:00:00Z',
    })
    expect(result.id).toBe('abc')
    expect(result.bedtime).toBe('2026-01-01T23:00:00Z')
    expect(result.wake_time).toBe('2026-01-02T07:00:00Z')
  })

  it('sets created_at equal to start_time', () => {
    const result = mapDbSessionToSleepSession({
      id: 'abc',
      start_time: '2026-01-01T23:00:00Z',
      end_time: '2026-01-02T07:00:00Z',
    })
    expect(result.created_at).toBe('2026-01-01T23:00:00Z')
  })

  it('calculates duration_minutes correctly', () => {
    const result = mapDbSessionToSleepSession({
      id: 'abc',
      start_time: '2026-01-01T23:00:00Z',
      end_time: '2026-01-02T07:00:00Z',
    })
    expect(result.duration_minutes).toBe(480)
  })

  it('rounds up fractional minutes', () => {
    const result = mapDbSessionToSleepSession({
      id: 'abc',
      start_time: '2026-01-01T23:00:00Z',
      end_time: '2026-01-01T23:01:30Z',
    })
    expect(result.duration_minutes).toBe(2)
  })

  it('returns null duration when end_time is null', () => {
    const result = mapDbSessionToSleepSession({
      id: 'abc',
      start_time: '2026-01-01T23:00:00Z',
      end_time: null,
    })
    expect(result.duration_minutes).toBeNull()
    expect(result.wake_time).toBeNull()
  })
})

describe('getMinutesFromMidnight', () => {
  it('returns 0 for midnight', () => {
    expect(getMinutesFromMidnight('2026-01-01T00:00:00')).toBe(0)
  })

  it('returns correct minutes for 23:30', () => {
    expect(getMinutesFromMidnight('2026-01-01T23:30:00')).toBe(1410)
  })
})

describe('timeStringToMinutes', () => {
  it('converts 00:00 to 0', () => {
    expect(timeStringToMinutes('00:00')).toBe(0)
  })

  it('converts 23:30 to 1410', () => {
    expect(timeStringToMinutes('23:30')).toBe(1410)
  })
})

describe('minutesToTimeString', () => {
  it('formats 0 as 00:00', () => {
    expect(minutesToTimeString(0)).toBe('00:00')
  })

  it('formats 90 as 01:30', () => {
    expect(minutesToTimeString(90)).toBe('01:30')
  })

  it('wraps around past 24 hours', () => {
    expect(minutesToTimeString(1440)).toBe('00:00')
  })
})

describe('isLateBedtime', () => {
  it('returns false when on time', () => {
    expect(isLateBedtime('2026-01-01T23:00:00', '23:00')).toBe(false)
  })

  it('returns false within grace period', () => {
    expect(isLateBedtime('2026-01-01T23:30:00', '23:00', 60)).toBe(false)
  })

  it('returns true when beyond grace period', () => {
    expect(isLateBedtime('2026-01-02T01:30:00', '23:00', 60)).toBe(true)
  })

  it('handles cross-midnight target correctly', () => {
    // target 22:00, actual 01:00 next day — 3 hours late
    expect(isLateBedtime('2026-01-02T01:00:00', '22:00', 60)).toBe(true)
  })
})
