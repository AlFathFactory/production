import { useEffect, useState } from 'react'

export const REPORT_PAGE_SIZE = 25

export function useReportPagination<Row>(rows: Row[]) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(rows.length / REPORT_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const firstIndex = (currentPage - 1) * REPORT_PAGE_SIZE
  const visibleRows = rows.slice(firstIndex, firstIndex + REPORT_PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [rows])

  return {
    currentPage,
    firstIndex,
    pageCount,
    setPage,
    visibleRows,
  }
}
