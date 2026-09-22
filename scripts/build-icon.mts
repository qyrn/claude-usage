import { readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const iconSizes = [16, 24, 32, 48, 64, 128, 256]
const headerBytes = 6
const directoryEntryBytes = 16

async function renderPng(svg: Buffer, size: number): Promise<Buffer> {
  return sharp(svg, { density: 72 * (size / 256) * 4 })
    .resize(size, size)
    .png()
    .toBuffer()
}

function packIco(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(headerBytes)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)

  let dataOffset = headerBytes + directoryEntryBytes * images.length
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(directoryEntryBytes)
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(png.length, 8)
    entry.writeUInt32LE(dataOffset, 12)
    dataOffset += png.length
    return entry
  })

  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)])
}

const svg = await readFile('resources/icon.svg')
const images = await Promise.all(iconSizes.map(async (size) => ({ size, png: await renderPng(svg, size) })))
await writeFile('resources/icon.ico', packIco(images))
