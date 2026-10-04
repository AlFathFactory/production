import { Button } from '../../../components/ui/Button'
import { REPORT_PAGE_SIZE } from '../hooks/useReportPagination'

interface ReportsPaginationProps {
  currentPage: number
  firstIndex: number
  itemLabel: string
  pageCount: number
  totalItems: number
  onPageChange: (page: number) => void
}

export function ReportsPagination({
  currentPage,
  firstIndex,
  itemLabel,
  pageCount,
  totalItems,
  onPageChange,
}: ReportsPaginationProps) {
  return (
    <nav className="reports-pagination" aria-label="Report table pages">
      <span className="reports-pagination__count">
        Showing {firstIndex + 1}–{Math.min(firstIndex + REPORT_PAGE_SIZE, totalItems)} of {totalItems} {itemLabel}
      </span>
      <div className="reports-pagination__controls">
        <Button
          type="button"
          variant="secondary"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <span aria-live="polite">Page {currentPage} of {pageCount}</span>
        <Button
          type="button"
          variant="secondary"
          disabled={currentPage === pageCount}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  )
}
