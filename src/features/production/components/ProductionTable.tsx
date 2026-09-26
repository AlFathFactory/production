import { useEffect, useState } from 'react'

import { Button } from '../../../components/ui/Button'
import { ProductionTableRow } from './ProductionTableRow'
import type { DirectStageAction, ProductionSearchRow } from '../types'

const PAGE_SIZE = 25

interface ProductionTableProps {
  filterKey: string
  items: ProductionSearchRow[]
  onStageAction: (item: ProductionSearchRow, action: DirectStageAction) => void
  onViewHistory: (item: ProductionSearchRow) => void
}

export function ProductionTable({ filterKey, items, onStageAction, onViewHistory }: ProductionTableProps) {
  const [page, setPage] = useState(1)
  const [selectedArticles, setSelectedArticles] = useState<string[]>([])
  const [articleSearch, setArticleSearch] = useState('')
  const articleOptions = [...new Set(items.map((item) => item.article).filter((article): article is string => Boolean(article)))]
    .sort((first, second) => first.localeCompare(second, undefined, { numeric: true }))
  const matchingArticles = articleOptions.filter((article) => article.toLowerCase().includes(articleSearch.trim().toLowerCase()))
  const selectedSet = new Set(selectedArticles)
  const displayedItems = selectedArticles.length > 0
    ? items.filter((item) => item.article && selectedSet.has(item.article))
    : items
  const pageCount = Math.max(1, Math.ceil(displayedItems.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const firstIndex = (currentPage - 1) * PAGE_SIZE
  const visibleItems = displayedItems.slice(firstIndex, firstIndex + PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [filterKey])

  const toggleArticle = (article: string, selected: boolean) => {
    const nextArticles = selected
      ? [...selectedArticles, article]
      : selectedArticles.filter((current) => current !== article)
    setSelectedArticles(nextArticles)
    setPage(1)
  }

  const changePage = (nextPage: number) => {
    setPage(nextPage)
  }

  const selectStageAction = (item: ProductionSearchRow, action: DirectStageAction) => {
    onStageAction(item, action)
  }

  const viewHistory = (item: ProductionSearchRow) => {
    onViewHistory(item)
  }

  return (
    <>
      <div className="production-table-toolbar">
        <details className="production-article-picker">
          <summary>Articles ({selectedArticles.length} selected)</summary>
          <div className="production-article-picker__panel">
            <label htmlFor="production-article-search">Find an Article</label>
            <input
              id="production-article-search"
              className="input"
              type="search"
              value={articleSearch}
              placeholder="Search Article numbers"
              onChange={(event) => setArticleSearch(event.target.value)}
            />
            <div className="production-article-picker__options">
              {matchingArticles.map((article) => (
                <label key={article}>
                  <input type="checkbox" checked={selectedSet.has(article)} onChange={(event) => toggleArticle(article, event.target.checked)} />
                  <span>{article}</span>
                </label>
              ))}
              {matchingArticles.length === 0 ? <p>No matching Article numbers.</p> : null}
            </div>
          </div>
        </details>
        {selectedArticles.length > 0 ? (
          <Button type="button" variant="secondary" onClick={() => { setSelectedArticles([]); setPage(1) }}>
            Show all Articles
          </Button>
        ) : null}
      </div>
      {selectedArticles.length > 0 ? (
        <div className="production-selected-articles" aria-label="Selected Articles">
          {selectedArticles.map((article) => (
            <button key={article} type="button" onClick={() => toggleArticle(article, false)} aria-label={`Remove Article ${article} from selection`}>
              {article} <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      ) : null}
      <div className="production-table-wrap" tabIndex={0} aria-label="Production items table. Scroll horizontally to view all columns.">
        <table className="production-table">
          <thead>
            <tr>
              <th scope="col">Article</th>
              <th scope="col">Designation</th>
              <th scope="col">Profile</th>
              <th scope="col">Route</th>
              <th scope="col">T.QTY</th>
              <th scope="col">CUT</th>
              <th scope="col">OUT BEND</th>
              <th scope="col">BEND / ROLLING</th>
              <th scope="col">Warehouse</th>
              <th scope="col">Dispensed</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>{visibleItems.map((item, index) => {
            const rowKey = item.production_item_id ?? `production-row-${firstIndex + index}`
            return (
              <ProductionTableRow
                key={rowKey}
                item={item}
                onStageAction={selectStageAction}
                onViewHistory={viewHistory}
              />
            )
          })}</tbody>
        </table>
      </div>
      {displayedItems.length === 0 ? <p className="production-table-empty">No selected Articles match the current filters.</p> : null}
      <nav className="production-pagination" aria-label="Production table pages">
        <span className="production-pagination__count">
          Showing {displayedItems.length ? firstIndex + 1 : 0}–{Math.min(firstIndex + PAGE_SIZE, displayedItems.length)} of {displayedItems.length} items
        </span>
        <div className="production-pagination__controls">
          <Button type="button" variant="secondary" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>
            Previous
          </Button>
          <span aria-live="polite">Page {currentPage} of {pageCount}</span>
          <Button type="button" variant="secondary" disabled={currentPage === pageCount} onClick={() => changePage(currentPage + 1)}>
            Next
          </Button>
        </div>
      </nav>
    </>
  )
}
