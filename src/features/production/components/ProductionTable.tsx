import { useEffect, useState } from 'react'

import { Button } from '../../../components/ui/Button'
import type { DispenseSelectionItem } from '../../dispense/types'
import { getAvailableDirectStageActions } from '../productionActions'
import { ProductionTableRow } from './ProductionTableRow'
import type { DirectStageAction, ProductionSearchRow } from '../types'

const PAGE_SIZE = 25

interface ProductionTableProps {
  filterKey: string
  items: ProductionSearchRow[]
  onDispenseItems: (items: DispenseSelectionItem[]) => void
  onStageAction: (item: ProductionSearchRow, action: DirectStageAction) => void
  onViewHistory: (item: ProductionSearchRow) => void
  selectionResetKey: number
}

function getDispenseSelection(item: ProductionSearchRow): DispenseSelectionItem | null {
  const productionItemId = item.production_item_id
  const dispenseAction = getAvailableDirectStageActions(item).find((action) => action.stage === 'DISPENSE')
  if (!productionItemId || !dispenseAction) return null

  return {
    article: item.article ?? 'Unknown article',
    availableQuantity: dispenseAction.availableQuantity,
    designation: item.designation,
    productionItemId,
  }
}

export function ProductionTable({ filterKey, items, onDispenseItems, onStageAction, onViewHistory, selectionResetKey }: ProductionTableProps) {
  const [page, setPage] = useState(1)
  const [selectedArticles, setSelectedArticles] = useState<string[]>([])
  const [selectedDispenseItemIds, setSelectedDispenseItemIds] = useState<string[]>([])
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
  const selectedDispenseSet = new Set(selectedDispenseItemIds)
  const selectedDispenseItems = items.flatMap((item) => {
    const selection = getDispenseSelection(item)
    return selection && selectedDispenseSet.has(selection.productionItemId) ? [selection] : []
  })
  const visibleDispenseItems = visibleItems.flatMap((item) => {
    const selection = getDispenseSelection(item)
    return selection ? [selection] : []
  })
  const areAllVisibleDispenseItemsSelected = visibleDispenseItems.length > 0
    && visibleDispenseItems.every((item) => selectedDispenseSet.has(item.productionItemId))

  useEffect(() => {
    setPage(1)
    setSelectedDispenseItemIds([])
  }, [filterKey])

  useEffect(() => {
    setSelectedDispenseItemIds([])
  }, [selectionResetKey])

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

  const toggleDispenseItem = (productionItemId: string, selected: boolean) => {
    setSelectedDispenseItemIds((current) => selected
      ? [...new Set([...current, productionItemId])]
      : current.filter((id) => id !== productionItemId))
  }

  const toggleVisibleDispenseItems = (selected: boolean) => {
    const visibleIds = new Set(visibleDispenseItems.map((item) => item.productionItemId))
    setSelectedDispenseItemIds((current) => selected
      ? [...new Set([...current, ...visibleIds])]
      : current.filter((id) => !visibleIds.has(id)))
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
        {selectedDispenseItems.length > 0 ? (
          <>
            <Button type="button" onClick={() => onDispenseItems(selectedDispenseItems)}>
              Dispense {selectedDispenseItems.length} Item{selectedDispenseItems.length === 1 ? '' : 's'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setSelectedDispenseItemIds([])}>
              Clear DISPENSE Selection
            </Button>
          </>
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
              <th scope="col" className="production-table__select">
                <input
                  aria-label="Select all DISPENSE-eligible items on this page"
                  checked={areAllVisibleDispenseItemsSelected}
                  disabled={visibleDispenseItems.length === 0}
                  type="checkbox"
                  onChange={(event) => toggleVisibleDispenseItems(event.target.checked)}
                />
              </th>
              <th scope="col">Article</th>
              <th scope="col">Designation</th>
              <th scope="col">Profile</th>
              <th scope="col">Route</th>
              <th scope="col" className="production-table__number">T.QTY</th>
              <th scope="col" className="production-table__number">CUT</th>
              <th scope="col" className="production-table__number">OUT BEND</th>
              <th scope="col" className="production-table__number">BEND / ROLLING</th>
              <th scope="col" className="production-table__number">Warehouse</th>
              <th scope="col" className="production-table__number">Dispensed</th>
              <th scope="col" className="production-table__actions">Actions</th>
            </tr>
          </thead>
          <tbody>{visibleItems.map((item, index) => {
            const rowKey = item.production_item_id ?? `production-row-${firstIndex + index}`
            return (
              <ProductionTableRow
                key={rowKey}
                isSelectedForDispense={Boolean(item.production_item_id && selectedDispenseSet.has(item.production_item_id))}
                item={item}
                onStageAction={selectStageAction}
                onToggleDispenseItem={toggleDispenseItem}
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
