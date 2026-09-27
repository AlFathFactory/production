import type { jsPDF } from 'jspdf'

type PdfDocument = InstanceType<typeof jsPDF>

export const PDF_UNICODE_FONT = 'DejaVuSans'

const fontFiles = [
  { fileName: 'DejaVuSans.ttf', style: 'normal', url: '/fonts/DejaVuSans.ttf' },
  { fileName: 'DejaVuSans-Bold.ttf', style: 'bold', url: '/fonts/DejaVuSans-Bold.ttf' },
] as const

const fontRequests = new Map<string, Promise<Uint8Array>>()

function loadFont(url: string): Promise<Uint8Array> {
  const currentRequest = fontRequests.get(url)
  if (currentRequest) return currentRequest

  const request = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`The PDF font could not be loaded (${response.status}).`)
      return response.arrayBuffer()
    })
    .then((buffer) => new Uint8Array(buffer))
    .catch((error: unknown) => {
      fontRequests.delete(url)
      throw error
    })
  fontRequests.set(url, request)
  return request
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }
  return btoa(binary)
}

export async function registerPdfFonts(doc: PdfDocument): Promise<void> {
  const loadedFonts = await Promise.all(fontFiles.map(async (font) => ({
    ...font,
    data: await loadFont(font.url),
  })))

  loadedFonts.forEach((font) => {
    doc.addFileToVFS(font.fileName, toBase64(font.data))
    doc.addFont(font.fileName, PDF_UNICODE_FONT, font.style)
  })
}

export function setPdfUnicodeFont(doc: PdfDocument, style: 'bold' | 'normal' = 'normal'): void {
  doc.setFont(PDF_UNICODE_FONT, style)
}

function startsWithArabic(value: string): boolean {
  const firstStrongCharacter = value.match(/[A-Za-z\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u)?.[0]
  return firstStrongCharacter ? /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u.test(firstStrongCharacter) : false
}

export function getPdfTextOptions(
  value: string,
  align: 'left' | 'right' = 'left',
): {
  align: 'left' | 'right'
  isInputRtl: boolean
  isInputVisual: boolean
  isOutputRtl: boolean
  isOutputVisual: boolean
  isSymmetricSwapping: boolean
} {
  const isRtl = startsWithArabic(value)
  return {
    align: isRtl ? 'right' : align,
    isInputRtl: isRtl,
    isInputVisual: false,
    isOutputRtl: false,
    isOutputVisual: true,
    isSymmetricSwapping: true,
  }
}
