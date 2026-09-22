import { nativeImage, type NativeImage } from 'electron'
import { usageLevelFor } from '../shared/usage'
import { levelColors, unknownColor, type Rgb } from './usageColor'

const glyphs: Record<string, readonly string[]> = {
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '2': ['###', '..#', '###', '#..', '###'],
  '3': ['###', '..#', '.##', '..#', '###'],
  '4': ['#.#', '#.#', '###', '..#', '..#'],
  '5': ['###', '#..', '###', '..#', '###'],
  '6': ['###', '#..', '###', '#.#', '###'],
  '7': ['###', '..#', '.#.', '.#.', '.#.'],
  '8': ['###', '#.#', '###', '#.#', '###'],
  '9': ['###', '#.#', '###', '..#', '###'],
  '-': ['...', '...', '###', '...', '...'],
  '!': ['.#.', '.#.', '.#.', '...', '.#.']
}

const baseIconSize = 16
const gridUnits = 8
const emptyBarAlpha = 90

function premultiply(channel: number, alpha: number): number {
  return Math.round((channel * alpha) / 255)
}

class PixelCanvas {
  readonly pixels: Buffer

  constructor(readonly size: number) {
    this.pixels = Buffer.alloc(size * size * 4)
  }

  fillRect(x: number, y: number, width: number, height: number, color: Rgb, alpha: number): void {
    for (let row = y; row < y + height; row++) {
      for (let column = x; column < x + width; column++) {
        const offset = (row * this.size + column) * 4
        this.pixels[offset] = premultiply(color.blue, alpha)
        this.pixels[offset + 1] = premultiply(color.green, alpha)
        this.pixels[offset + 2] = premultiply(color.red, alpha)
        this.pixels[offset + 3] = alpha
      }
    }
  }
}

function labelFor(percent: number | null): string {
  if (percent === null) return '--'
  if (percent >= 100) return '!!'
  return String(Math.max(0, Math.round(percent)))
}

export function renderTrayIcon(percent: number | null, scaleFactor: number): NativeImage {
  const unit = Math.max(2, Math.floor((baseIconSize * scaleFactor) / gridUnits))
  const canvas = new PixelCanvas(unit * gridUnits)
  const color = percent === null ? unknownColor : levelColors[usageLevelFor(percent)]
  const origin = Math.floor(unit / 2)

  const label = labelFor(percent)
  const labelLeft = origin + (label.length === 1 ? 2 * unit : 0)
  label.split('').forEach((character, characterIndex) => {
    const glyphLeft = labelLeft + characterIndex * 4 * unit
    glyphs[character]?.forEach((line, lineIndex) => {
      line.split('').forEach((cell, cellIndex) => {
        if (cell !== '#') return
        canvas.fillRect(glyphLeft + cellIndex * unit, origin + lineIndex * unit, unit, unit, color, 255)
      })
    })
  })

  const barWidth = 7 * unit
  const filledWidth = Math.round((barWidth * Math.min(100, Math.max(0, percent ?? 0))) / 100)
  const barTop = origin + 6 * unit
  canvas.fillRect(origin, barTop, barWidth, unit, color, emptyBarAlpha)
  canvas.fillRect(origin, barTop, filledWidth, unit, color, 255)

  return nativeImage.createFromBitmap(canvas.pixels, {
    width: canvas.size,
    height: canvas.size,
    scaleFactor: canvas.size / baseIconSize
  })
}
