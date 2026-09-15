import type { WorkBook, WorkSheet } from 'xlsx'

import type { ParsedProductionWorkbook, RawWorkbookCell, RawWorkbookRow } from './types'

export class ProductionWorkbookError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProductionWorkbookError'
  }
}

function toRawRows(sheet: WorkSheet, xlsx: typeof import('xlsx')): RawWorkbookRow[] {
  return xlsx.utils.sheet_to_json<RawWorkbookCell[]>(sheet, {
    blankrows: true,
    defval: null,
    header: 1,
    raw: true,
  })
}

export async function parseProductionWorkbook(data: ArrayBuffer): Promise<ParsedProductionWorkbook> {
  let workbook: WorkBook
  let xlsx: typeof import('xlsx')

  try {
    xlsx = await import('xlsx')
    workbook = xlsx.read(data, {
      bookVBA: false,
      cellDates: true,
      cellFormula: false,
      type: 'array',
    })
  } catch {
    throw new ProductionWorkbookError('The selected file is not a readable Excel workbook.')
  }

  if (workbook.SheetNames.length === 0) {
    throw new ProductionWorkbookError('The selected workbook does not contain any sheets.')
  }

  const sheets: Record<string, RawWorkbookRow[]> = {}
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    if (sheet) {
      sheets[sheetName] = toRawRows(sheet, xlsx)
    }
  }

  return { sheetNames: workbook.SheetNames, sheets }
}
