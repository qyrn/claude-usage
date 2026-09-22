import type { UsageLevel } from '../shared/usage'

export interface Rgb {
  red: number
  green: number
  blue: number
}

export const levelColors: Record<UsageLevel, Rgb> = {
  normal: { red: 0xd9, green: 0x77, blue: 0x57 },
  warning: { red: 0xf0, green: 0xb4, blue: 0x29 },
  critical: { red: 0xef, green: 0x44, blue: 0x44 }
}

export const unknownColor: Rgb = { red: 0x9a, green: 0x96, blue: 0x8e }
