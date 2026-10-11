import * as XLSX from 'xlsx'

/**
 * Synthetic disposable BOM workbook for E2E. Never uses real Production data.
 * Columns mirror the Penta layout consumed by parseBomWorkbook.
 */
export function buildSyntheticBomWorkbook(suffix: string): Buffer {
  const rows: Array<Array<string | number>> = [
    ['Stufe', 'Artikel', 'Artikelart', 'Position', 'Menge', 'Menge/kumuliert', 'Positionsgewicht', 'Werkstoff', 'Komp.Bezeichnung', 'Bezeichnung 2', 'Komp.Z.Din-Nr', 'Beschaff.Kenng'],
    [1, `E2E-ROOT-${suffix}`, 'Gruppe', '1', 1, 1, '', '', `E2E root assembly ${suffix}`, '', '', 'Eigenfertigung'],
    [2, `E2E-PART-A-${suffix}`, 'Teil', '10', 2, 2, 1.5, 'S235', `E2E plate 120/80/10 ${suffix}`, '', '', 'Eigenfertigung'],
    [2, `E2E-PART-B-${suffix}`, 'Teil', '20', 4, 4, 0.5, 'S235', `E2E rod 30/400 ${suffix}`, '', '', 'Fremdbezug'],
  ]
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Stueckliste')
  return Buffer.from(XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer)
}
