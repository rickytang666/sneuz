import { createHash, randomBytes } from 'crypto'

export function generateApiKey(): string {
  return 'snz_' + randomBytes(32).toString('hex')
}

export function hashApiKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}
