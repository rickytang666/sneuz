import { describe, it, expect } from 'vitest'
import { generateApiKey, hashApiKey } from './keys'

describe('generateApiKey', () => {
  it('starts with snz_ prefix', () => {
    expect(generateApiKey()).toMatch(/^snz_/)
  })

  it('is 68 characters long', () => {
    // 'snz_' (4) + 32 bytes as hex (64) = 68
    expect(generateApiKey()).toHaveLength(68)
  })

  it('generates unique keys', () => {
    const keys = new Set(Array.from({ length: 10 }, generateApiKey))
    expect(keys.size).toBe(10)
  })

  it('contains only hex characters after prefix', () => {
    const key = generateApiKey()
    expect(key.slice(4)).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('hashApiKey', () => {
  it('returns a 64-character hex string', () => {
    const hash = hashApiKey('snz_abc123')
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic', () => {
    const key = generateApiKey()
    expect(hashApiKey(key)).toBe(hashApiKey(key))
  })

  it('produces different hashes for different keys', () => {
    const a = generateApiKey()
    const b = generateApiKey()
    expect(hashApiKey(a)).not.toBe(hashApiKey(b))
  })

  it('matches known sha256 value', () => {
    // sha256('test') = 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
    expect(hashApiKey('test')).toBe('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08')
  })
})
